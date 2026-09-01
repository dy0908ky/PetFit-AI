# PetFit

반려견의 사료 선택, 급여량 계산, 건강 기록, 주변 동물병원 탐색을 하나의 흐름으로 연결한 반려동물 건강관리 프로토타입입니다.

> 이 저장소는 대학원 진학 포트폴리오용 연구·개발 결과물입니다. PetFit의 분석 결과는 참고 정보이며 수의학적 진단을 대신하지 않습니다.

## 프로젝트 개요

반려인은 사료 성분표, 체중과 생애주기, 일상적인 건강 신호처럼 서로 흩어진 정보를 종합해야 합니다. PetFit은 이 정보를 한곳에 모아 다음 행동으로 연결하는 사용자 경험을 탐색합니다.

- 사료 영양성분표 이미지 기반 AI 분석 및 적합도 제안
- 체중·활동량·생애주기를 반영한 일일 급여량 계산
- 건강 항목 기록과 시각화
- 현재 위치 기반 주변 동물병원 검색
- 반려견 질환·품종·상식 백과와 AI 질의

## 기술 구성

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Visualization: Chart.js
- Map: Leaflet, OpenStreetMap, Kakao Local API
- AI: Google Gemini API
- Desktop packaging: Electron, electron-builder
- Build tools: Python, Node.js

## 실행 화면

대표 화면 캡처는 `docs/images/`에 저장합니다. 아래 주석을 실제 이미지 링크로 교체하면 GitHub README에서 바로 표시됩니다.

```markdown
![PetFit 메인 화면](docs/images/main.png)
![사료 분석 화면](docs/images/food-analysis.png)
![건강 리포트](docs/images/health-report.png)
![동물병원 지도](docs/images/vet-map.png)
```

API 키, 개인 위치, 반려동물 보호자 정보가 노출되지 않은 캡처만 사용합니다.

## 빠른 실행

별도의 번들러 없이 정적 웹으로 실행할 수 있습니다. 브라우저의 파일 접근 제한을 피하려면 로컬 서버 사용을 권장합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

AI 기능을 사용하려면 `config.example.js`를 `config.js`로 복사하고 본인의 Gemini API 키를 입력합니다. `config.js`는 Git에 포함되지 않습니다. 동물병원 검색의 Kakao REST API 키는 해당 화면에서 입력합니다.

## 저장소 구조

```text
.
├── index.html                 # 포트폴리오 진입 화면
├── config.example.js          # 공개 가능한 API 설정 예시
├── pages/                     # 기능별 HTML 화면
├── assets/
│   ├── css/                   # 공통·기능별 스타일
│   └── js/                    # 분석 데이터와 애플리케이션 로직
├── scripts/
│   └── build_single.py        # 단일 HTML 생성 도구
├── desktop/                   # Electron 데스크톱 패키징
├── docs/                      # 설계·업로드 문서와 캡처
└── dist/                      # 생성 결과물(Git 제외)
```

`dist/`, `desktop/index.html`, `desktop/dist/`는 빌드 결과물이므로 저장소에서 제외합니다.

## 단일 HTML 및 데스크톱 빌드

```bash
python scripts/build_single.py

cd desktop
npm install
node build-index.js
npm run build
```

단일 HTML은 `dist/petfit_all.html`, Electron 설치 파일은 `desktop/dist/`에 생성됩니다.

## 설계 포인트

- 기능별 HTML·CSS·JavaScript를 분리해 프로토타입을 빠르게 검증했습니다.
- 사료 분석에는 영양 기준, 반려견 프로필, 건강 목표를 함께 반영합니다.
- 건강 기록은 브라우저 로컬 저장소를 사용해 서버 없이 흐름을 검증합니다.
- 단일 HTML 빌드와 Electron 래퍼를 통해 웹 프로토타입의 배포 형태를 확장했습니다.

상세한 구성과 공개 전 점검 사항은 [docs/architecture.md](docs/architecture.md)와 [docs/repository-guide.md](docs/repository-guide.md)를 참고하세요.

## 한계 및 향후 과제

- 현재는 프런트엔드 프로토타입으로, API 키 보호를 위한 백엔드 프록시가 없습니다.
- 건강 및 사료 추천 결과에 대한 전문가 검증과 정량 평가가 필요합니다.
- 사용자 데이터는 로컬에 저장되며 계정 간 동기화를 지원하지 않습니다.
- 접근성, 자동화 테스트, 모바일 실기기 검증을 보강할 예정입니다.

## 라이선스

라이선스를 확정한 뒤 `LICENSE` 파일을 추가하세요. 데이터와 외부 API의 이용 조건은 각각 별도로 확인해야 합니다.
