# 나래 한글 오피스

**나래한글 엔진 기반 · 한컴오피스 2024 연동 · 로컬 문서 작업 공간**

[나래한글 엔진](https://github.com/y5496694/narae_hangul)을 사용하는 Windows용 HWP/HWPX 문서 앱입니다. 기존 한글 문서를 읽고 본문·글자·문단 서식을 AI로 편집하거나, 새 문서·표·그림을 작성하고 PDF 사본을 만들 수 있습니다. 문서와 대화는 내 컴퓨터에 저장합니다. 앱 자체 로그인은 필요 없습니다.

![나래 한글 오피스의 문서 편집 화면](docs/images/app.png)

## 설치

1. Windows 10/11 64비트에 **한컴오피스 2024 한글**을 정식 설치하고 한 번 실행해 초기 설정을 마칩니다. 한컴 프로그램·라이선스·글꼴은 이 저장소에 포함하지 않습니다.
2. [Node.js 24 LTS](https://nodejs.org/en/download)와 [Python 3.13 64비트](https://www.python.org/downloads/windows/)를 설치합니다. Python 설치 시 **Add Python to PATH**를 선택합니다.
3. [최신 릴리스](https://github.com/y5496694/Narae_hangul_office/releases/latest)의 `Narae-Hangul-Office-0.8.0-windows-x64.zip`을 내려받아 압축을 풉니다. 또는 이 저장소의 Code → Download ZIP을 사용합니다.
4. 폴더 안의 **`설치.cmd`**를 실행합니다. 첫 설치에는 인터넷이 필요하며 Electron과 Python 의존성, 공식 Claude 로그인 도구를 내려받습니다. 관리자 권한은 필요 없습니다.
5. 바탕화면의 **나래 한글 오피스**를 실행합니다.

기본 설치 위치는 `%LOCALAPPDATA%\Programs\NaraeHangulOffice`, 데이터 위치는 `%LOCALAPPDATA%\NaraeHangulOffice`입니다. 설치 위치에 공백·한글이 있어도 사용할 수 있습니다. 다른 드라이브에 설치하려면:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1 -InstallRoot "D:\Apps\NaraeHangulOffice"
```

설치가 끝나면 Node.js/Python을 직접 실행할 필요가 없습니다. 설치본의 Electron과 전용 Python 가상환경으로 실행합니다. Python 본체는 제거하지 마세요. 설치 스크립트·전체 소스·고정 의존성 목록을 제공하므로 각 라이브러리를 교체하거나 다시 설치할 수 있습니다.

## AI 연결

상단 **AI 연결 · 설정**을 엽니다. 기본값은 **ChatGPT / OpenAI → OAuth 계정 연결**입니다.

- **ChatGPT OAuth:** `Continue with ChatGPT`를 누르고 브라우저에서 계정의 사용 권한을 승인합니다. 계정에서 제공하는 모델을 불러와 선택하고 저장합니다. 권한·모델 제공 여부는 해당 계정에 따릅니다.
- **OpenAI API:** 연결 방식을 API 키로 바꾸고 Responses API 주소·모델 ID·키를 저장합니다. OAuth와 API 설정은 따로 유지합니다.
- **Claude OAuth:** 제공자를 Claude로 바꾸고 **Claude Console 계정 연결**을 선택합니다. 공식 `ant` CLI의 격리된 프로필로 로그인합니다. **Console은 API 사용량 과금이며 Claude Pro/Max 구독과 별개입니다.**
- **Claude API:** Claude → API 키에서 Messages API 주소·모델·키를 저장합니다.

계정을 추가·선택·연결 해제할 수 있습니다. OAuth 실패 시 API 키로 자동 대체 호출하지 않습니다. 토큰과 키는 Windows 사용자 DPAPI로 암호화합니다. 다른 PC에서는 계정에 다시 로그인하거나 API 키를 다시 저장하세요.

## 문서 작업

1. **문서 열기**로 HWP/HWPX를 선택합니다. 미리보기는 한글 2024로 출력한 실제 문서 쪽입니다.
2. AI에게 “이 문서의 오탈자를 고쳐 줘”, “제목을 17pt 굵게 바꿔 줘”처럼 요청합니다. 기존 파일은 실제 한글 창을 재사용하며, 편집하려고 별도의 빈 문서를 남기지 않습니다.
3. **한글에서 열기**로 직접 편집하거나, **현재 내용**으로 현재 열린 문서의 텍스트를 확인할 수 있습니다.
4. **미리보기**로 저장한 최신 내용을 확인합니다. 자동 저장을 끈 경우에는 한글에서 먼저 저장하세요. **PDF 사본**은 작업 폴더에 새 이름으로 저장합니다.
5. **새 한글 문서**에서 HWP/HWPX를 만들 수 있습니다. 표·그림을 포함한 문서는 AI에게 형식과 내용을 함께 지정하세요.

기존 문서의 편집 전 사본은 데이터 폴더의 `backups` 또는 `data/backups`에 보관합니다. 파일을 직접 편집할 때는 최신 해시를, 열린 문서를 편집할 때는 최신 내용과 원문 후보 수를 확인합니다. 미저장 문서를 파일 엔진으로 덮어쓰지 않습니다. 변경 추적 문서는 현재 한글의 텍스트와 네이티브 동작으로 처리합니다. 일부 작업이 실패하면 완료 단계와 백업을 알립니다.

지원 범위와 문제 해결은 [사용 안내](docs/사용안내.md)를 참조하세요. 모든 한글 기능을 대체하는 앱은 아니며 한컴오피스 2024 설치가 필요합니다.

## 데이터와 개인정보

문서·대화·설정·백업은 로컬에 저장합니다. AI를 요청하면 선택한 문서 내용과 도구 결과가 연결한 OpenAI 또는 Anthropic 서버로 전송됩니다. 앱 운영 서버를 경유하지 않습니다. API 키·OAuth 토큰·사용자 문서·대화·글꼴은 GitHub에 포함하지 않습니다. 데이터 폴더는 설정에서 열 수 있습니다.

## 개발

```powershell
npm ci
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm test
npm start
```

`scripts/install-ant.ps1`로 공식 Claude Console 로그인 도구를 설치할 수 있습니다. 기본 설치 프로그램은 이 단계를 자동 수행합니다. ChatGPT OAuth/API 사용에는 이 도구가 필요하지 않습니다.

실행 데이터 위치는 `NARAE_OFFICE_HOME`, Python 경로는 `NARAE_OFFICE_PYTHON`, 사용자 지정 한글 2024 경로는 `NARAE_HWP_EXE` 환경 변수로 지정할 수 있습니다. 검증 로그·문서는 [검증 결과](docs/검증결과.md)에 기록합니다.

## 라이선스

앱 코드와 포함된 나래한글 엔진은 **MIT**입니다. 엔진 기준 버전은 `c4ad1460e6b0ead94f7d13814ead8f948470e4fa`이며 원 저작권·허가문을 유지합니다. 외부 라이브러리에는 각각의 라이선스가 적용됩니다. [LICENSE](LICENSE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 참조하세요.

본 제품은 한컴의 HWP 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다. 한컴오피스 2024와 연동하는 별도 앱이며 한글과컴퓨터의 공식 제품은 아닙니다.
