'use strict';
const path=require('node:path');
function documentStep(prompt,input,all,workspace,allowReceipt=false,selectedFile){
 const records=[];for(const item of input){if(item.type!=='function_call_output')continue;const call=input.find(c=>c.type==='function_call'&&c.call_id===item.call_id);if(!call)continue;try{records.push({name:call.name,args:JSON.parse(call.arguments),value:JSON.parse(item.output)});}catch{}}
 if(records.some(r=>r.value?.finalAction||/^wxs-final/.test(r.value?.kind||'')))return null;
 const tracked=records.findLast(r=>r.name==='read_document'&&!r.value?.error&&r.value?.textDetailsLoaded===false);
 if(tracked&&typeof tracked.args.path==='string'&&!records.slice(records.indexOf(tracked)+1).some(r=>r.name==='read_live_document'&&r.args.path===tracked.args.path)){
  const tool=structuredClone(all.find(t=>t.name==='read_live_document'));
  if(tool){tool.parameters={type:'object',properties:{path:{type:'string',enum:[tracked.args.path]}},required:['path'],additionalProperties:false};return {tools:[tool],required:true,context:{source:'파일 엔진에서 변경 추적 때문에 현재 본문을 읽지 못한 실제 문서',path:tracked.args.path},instructions:'textDetailsLoaded:false는 빈 문서가 아니다. read_live_document로 현재 한글의 실제 본문과 liveRevision을 읽는다. 읽겠다는 답변으로 도구 실행을 대신하지 않는다.'};}
 }
 if(typeof selectedFile==='string'&&/수정|고쳐|바꾸|바꿔|변경|굵게|글꼴|서식/.test(prompt)&&!/열려\s*있|열린\s*한글|실시간|현재\s*한글/.test(prompt)){
  const same=p=>typeof p==='string'&&path.resolve(p).toLowerCase()===path.resolve(selectedFile).toLowerCase();
  const read=records.findLast(r=>r.name==='read_document'&&same(r.args.path)&&!r.value?.error),edit=records.findLast(r=>['edit_document','edit_live_document'].includes(r.name)&&same(r.args.path));
  if(!read||edit&&records.indexOf(edit)>records.indexOf(read)){
   const tool=structuredClone(all.find(t=>t.name==='read_document'));if(tool){tool.parameters={type:'object',properties:{path:{type:'string',enum:[selectedFile]}},required:['path'],additionalProperties:false};return {tools:[tool],required:true,context:{source:'사용자가 선택한 실제 문서',path:selectedFile},instructions:'편집 전 또는 편집 시도 후에는 선택한 파일을 실제로 다시 읽어 최신 해시·문단 ID·저장된 내용을 확인한다.'};}
  }
  if(read?.value?.textDetailsLoaded!==false&&(read?.value?.hash||read?.value?.input_sha256)){
   const tools=structuredClone(all.filter(t=>['edit_document',...(read.value.hasMore?['read_document']:[]),...(/PDF/i.test(prompt)?['export_pdf']:[])].includes(t.name))),tool=tools.find(t=>t.name==='edit_document');
   if(tool){tool.parameters.properties.path={type:'string',enum:[selectedFile]};tool.parameters.properties.expectedHash={type:'string',enum:[read.value.hash||read.value.input_sha256]};tool.parameters.required=['path','expectedHash','operations'];const ids=[...new Set([...(read.value.paragraphs||[]),...(read.value.blocks||[])].map(p=>p.id).filter(Boolean))];if(ids.length)for(const op of tool.parameters.properties.operations.items.anyOf)if(op.properties?.target)op.properties.target={type:'string',enum:ids};}
   return {tools,instructions:'선택 파일은 방금 일반 파일 엔진으로 읽었다. 같은 파일의 같은 내용을 다시 읽지 않는다. 실제 해시와 문단 ID로 edit_document를 사용한다. 저장 후 다시 읽은 내용이 이미 요청대로 바뀌었으면 도구를 호출하지 말고 최종 확인 결과를 답한다. liveRevision을 파일 해시로 지어내지 않는다.'};
  }
 }
 if(!/PDF\s*(?:사본|버전)|PDF\s*(?:로|으로)\s*(?:출력|내보내|저장|변환)|PDF(?:도|까지)?\s*(?:만들|생성)|\.pdf["”]?/i.test(prompt)||/PDF.{0,12}(?:하지\s*마|만들지\s*마|필요\s*없)/i.test(prompt))return null;
 const created=records.filter(r=>r.name==='create_document'&&!r.value?.error&&r.value?.modeledContentVerified&&r.value?.path);
 if(created.length!==1)return null;
 const file=created[0].value.path,same=p=>typeof p==='string'&&path.resolve(p).toLowerCase()===path.resolve(file).toLowerCase();
 const required=(name,values,instructions)=>{const tool=structuredClone(all.find(t=>t.name===name));if(!tool)return null;tool.parameters={type:'object',properties:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{type:'string',enum:[value]}])),required:Object.keys(values),additionalProperties:false};return {tools:[tool],required:true,context:{source:'실제 생성 파일과 아직 수행하지 않은 출력 단계',path:file},instructions};};
 if(!records.some(r=>r.name==='read_document'&&same(r.args.path)&&!r.value?.error&&(r.value?.hash||r.value?.input_sha256)))return required('read_document',{path:file},'생성한 실제 한글 파일을 다시 읽어 내용을 확인한다. PDF 출력은 아직 실행되지 않았다.');
 const exports=records.filter(r=>r.name==='export_pdf'&&same(r.args.path));
 const exported=exports.find(r=>!r.value?.error&&r.value?.pages>0&&r.value?.bytes>0);
 if(exported)return allowReceipt?{tools:[],receipt:'한글 문서와 PDF 사본을 실제로 저장했습니다.\n'+file+'\n'+exported.args.target+'\n저장된 한글 본문을 다시 읽고 PDF 출력 결과를 확인했습니다.'}:null;
 if(exports.length)return {tools:[],receipt:'한글 파일은 생성했지만 PDF 출력을 확인하지 못했습니다.\n'+file+'\nPDF 완료로 처리하지 않았습니다. '+(exports.at(-1).value?.error||'출력 검증 결과가 없습니다.')};
 const names=[...prompt.matchAll(/["“]([^"“”\r\n]+\.pdf)["”]/gi)];if(names.length>1)return null;
 const target=names.length?(path.isAbsolute(names[0][1])?names[0][1]:path.resolve(workspace||path.dirname(file),names[0][1])):file.replace(/\.hwpx?$/i,'.pdf');
 return required('export_pdf',{path:file,target},'사용자가 요청한 PDF 사본은 아직 없다. 실제 export_pdf를 실행한다. 텍스트 답변이나 한글 파일 생성 결과를 PDF 완료 근거로 쓰지 않는다.');
}
module.exports={documentStep};
