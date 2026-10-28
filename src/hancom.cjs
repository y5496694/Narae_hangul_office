const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const roots = [
  path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Hnc/Office 2024/HOffice130/Bin'),
  path.join(process.env.ProgramFiles||'C:\\Program Files','Hnc/Office 2024/HOffice130/Bin'),
  'C:\\Program Files (x86)\\Hnc\\Office 2024\\HOffice130\\Bin',
  'C:\\Program Files\\Hnc\\Office 2024\\HOffice130\\Bin',
];
const programs = { hangul: 'Hwp.exe' };
function discoverHancom() {
  const override=process.env.NARAE_HWP_EXE;
  if(override&&path.basename(override).toLowerCase()==='hwp.exe'&&fs.existsSync(override))return {hangul:path.resolve(override)};
  return Object.fromEntries(Object.entries(programs).map(([kind, executable]) => [kind,
    roots.map(root => path.join(root, executable)).find(p => fs.existsSync(p)) || null]));
}
function nativeKind(file) {
  const ext = path.extname(file).toLowerCase();
  if (['.hwp', '.hwpx'].includes(ext)) return 'hangul';
  return null;
}
function openHancom(file) {
  const kind = nativeKind(file);
  if (!kind) return false;
  const executable = discoverHancom()[kind];
  if (!executable) throw new Error('이 형식의 한컴오피스 프로그램을 찾을 수 없습니다.');
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [file], { cwd: path.dirname(executable), windowsHide: true, detached: true, stdio: 'ignore' });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(true); });
  });
}
module.exports = { discoverHancom, nativeKind, openHancom };
