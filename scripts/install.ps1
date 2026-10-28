param([string]$InstallRoot=(Join-Path $env:LOCALAPPDATA 'Programs\NaraeHangulOffice'),[string]$PythonPath,[switch]$NoShortcut)
$ErrorActionPreference='Stop'
$env:PYTHONUTF8='1'
if(-not [Environment]::Is64BitOperatingSystem){throw 'Windows 64비트가 필요합니다.'}
$sourceRoot=[IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$InstallRoot=[IO.Path]::GetFullPath($InstallRoot)
if($InstallRoot -eq [IO.Path]::GetPathRoot($InstallRoot)){throw '드라이브 루트에는 설치할 수 없습니다.'}
$npm=(Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
$node=(Get-Command node.exe -ErrorAction SilentlyContinue).Source
if(-not $npm -or -not $node){throw 'Node.js 24 LTS를 설치하고 다시 실행하세요: https://nodejs.org/en/download'}
$nodeMajor=[int]((& $node --version).TrimStart('v').Split('.')[0]);if($nodeMajor -lt 22){throw 'Node.js 22 이상이 필요합니다. Node.js 24 LTS를 권장합니다.'}
if(-not $PythonPath){
    $launcher=Get-Command py.exe -ErrorAction SilentlyContinue
    if($launcher){$PythonPath=(& $launcher.Source -3.13 -c 'import sys;print(sys.executable)' 2>$null | Select-Object -Last 1)}
    if(-not $PythonPath){$PythonPath=(Get-Command python.exe -ErrorAction SilentlyContinue).Source}
}
if(-not $PythonPath -or -not (Test-Path -LiteralPath $PythonPath)){throw 'Python 3.13 64비트를 설치하고 다시 실행하세요: https://www.python.org/downloads/windows/'}
& $PythonPath -c "import sys,struct;sys.exit(0 if (3,12)<=sys.version_info[:2]<(3,15) and struct.calcsize('P')==8 else 1)"
if($LASTEXITCODE -ne 0){throw 'Python 3.12~3.14 64비트가 필요합니다. 3.13을 권장합니다.'}
$running=@(Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -and $_.ExecutablePath.StartsWith($InstallRoot+'\',[StringComparison]::OrdinalIgnoreCase)})
if($running.Count){throw '나래 한글 오피스를 닫은 뒤 다시 설치하세요.'}
New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
if($sourceRoot -ne $InstallRoot){
    foreach($name in @('src','ui','vendor','scripts','docs','package.json','package-lock.json','requirements.txt','LICENSE','README.md','THIRD_PARTY_NOTICES.md')){
        $source=Join-Path $sourceRoot $name
        if(Test-Path -LiteralPath $source){Copy-Item -LiteralPath $source -Destination $InstallRoot -Recurse -Force}
    }
}
Push-Location $InstallRoot
try {
    $cache=Join-Path $InstallRoot 'cache';New-Item -ItemType Directory -Path $cache -Force | Out-Null
    $env:npm_config_cache=Join-Path $cache 'npm';$env:PIP_CACHE_DIR=Join-Path $cache 'pip';$env:ELECTRON_CACHE=Join-Path $cache 'electron'
    Write-Output '데스크톱 런타임 설치 중...'
    & $npm ci --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw 'Electron 설치 실패'}
    & $node (Join-Path $InstallRoot 'node_modules\electron\install.js');if($LASTEXITCODE -ne 0){throw 'Electron 실행 파일 다운로드 실패'}
    $python=Join-Path $InstallRoot '.venv\Scripts\python.exe'
    if(-not (Test-Path -LiteralPath $python)){& $PythonPath -m venv (Join-Path $InstallRoot '.venv');if($LASTEXITCODE -ne 0){throw 'Python 환경 생성 실패'}}
    Write-Output '나래한글 엔진 의존성 설치 중...'
    & $python -m pip install --disable-pip-version-check -r (Join-Path $InstallRoot 'requirements.txt');if($LASTEXITCODE -ne 0){throw 'Python 라이브러리 설치 실패'}
    & (Join-Path $InstallRoot 'scripts\install-ant.ps1') -AppRoot $InstallRoot
    if(-not (Test-Path -LiteralPath (Join-Path $InstallRoot 'tools\ant\ant.exe'))){throw 'Claude 로그인 도구 설치 실패'}
    & $python -c "import pythoncom,win32crypt,PySide6,pypdfium2,lxml;print('Python 의존성 확인 완료')";if($LASTEXITCODE -ne 0){throw 'Python 환경 확인 실패'}
    $executable=Join-Path $InstallRoot 'node_modules\electron\dist\electron.exe'
    if(-not (Test-Path -LiteralPath $executable)){throw 'Electron 실행 파일 누락'}
    $vbs='Set shell = CreateObject("WScript.Shell")'+"`r`n"+'shell.CurrentDirectory = "'+$InstallRoot.Replace('"','""')+'"'+"`r`n"+'shell.Run Chr(34) & "'+$executable.Replace('"','""')+'" & Chr(34) & " " & Chr(34) & "'+$InstallRoot.Replace('"','""')+'" & Chr(34), 1, False'
    [IO.File]::WriteAllText((Join-Path $InstallRoot '나래 한글 오피스.vbs'),$vbs,[Text.Encoding]::Unicode)
    if(-not $NoShortcut){
        $shortcutShell=New-Object -ComObject WScript.Shell
        foreach($directory in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){
            $shortcut=$shortcutShell.CreateShortcut((Join-Path $directory '나래 한글 오피스.lnk'))
            $shortcut.TargetPath=$executable;$shortcut.Arguments='"'+$InstallRoot+'"';$shortcut.WorkingDirectory=$InstallRoot;$shortcut.Description='나래한글 엔진 기반 · 한컴오피스 2024 연동';$shortcut.Save()
        }
    }
    [ordered]@{version=(Get-Content -LiteralPath 'package.json' -Raw -Encoding UTF8 | ConvertFrom-Json).version;installedAt=(Get-Date).ToString('o');root=$InstallRoot;python=$python;runtime=$executable} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $InstallRoot 'installation.json') -Encoding UTF8
    Write-Output "설치 완료: $InstallRoot"
    Write-Output '바탕화면의 나래 한글 오피스를 실행하세요. 앱 로그인은 필요 없으며 AI는 설정에서 본인 계정으로 연결합니다.'
} finally {Pop-Location}
