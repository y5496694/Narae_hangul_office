'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {taskFor,taskTools,taskStep}=require('../src/agent-task.cjs'),{localCreationResult}=require('../src/agent.cjs');
const all=['gyomu_browser','gyomu_wxs','gyomu_wxs_prepare','gyomu_wxs_options','gyomu_wxs_save','gyomu_wxs_final_prepare','gyomu_wxs_final_dialog','gyomu_wxs_final_confirm','read_document','create_document','export_pdf'].map(name=>({name,parameters:{type:'object',properties:{action:{type:'string',enum:['snapshot','click','fill']}}}}));
test('a compound HWP/attachment request retains document and draft tools before final processing',()=>{
 for(const prompt of ['한글 문서 계획서를 만들고 기안 작성해서 첨부해줘. 상신하지 마.','한글 파일 "계획.hwp" 만들고 기안에 첨부하고 상신해줘']){
  const task=taskFor(prompt),names=taskTools(task,all).map(t=>t.name);for(const name of ['read_document','create_document','gyomu_wxs_prepare'])assert(names.includes(name),prompt+' '+name);
  assert.equal(localCreationResult(prompt,{provider:'local'},[{}],'create_document',{path:'계획.hwp',modeledContentVerified:true}),null);
 }
 const simple=taskTools(taskFor('공문 QA-001 결재해줘'),all);assert(!simple.some(t=>t.name==='create_document'));
 const reading=taskTools(taskFor('에듀파인 공문의 한글 파일을 읽고 요약해줘'),all);assert(reading.some(t=>t.name==='read_document'));assert(!reading.some(t=>t.name==='create_document'));
});
test('after a final attempt a compound workflow cannot recreate its document or change its attachments',()=>{
 const task=taskFor('한글 파일 "계획.hwp" 만들고 기안에 첨부하고 상신해줘');
 const input=[{type:'function_call',call_id:'one',name:'gyomu_wxs_final_prepare',arguments:'{}'},{type:'function_call_output',call_id:'one',output:JSON.stringify({kind:'wxs-final',result:{attempted:true,completed:false}})},{type:'function_call',call_id:'view',name:'gyomu_browser',arguments:'{"action":"snapshot"}'},{type:'function_call_output',call_id:'view',output:'{"title":"모의 문서진행"}'}];
 const step=taskStep(task,input,all);for(const name of ['create_document','export_pdf','gyomu_wxs_prepare','gyomu_wxs_save','gyomu_wxs_final_prepare'])assert(!step.tools.some(t=>t.name===name),name);assert(step.tools.some(t=>t.name==='gyomu_wxs_final_confirm'));
});
