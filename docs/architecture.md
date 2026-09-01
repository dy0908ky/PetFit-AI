# Architecture

## 실행 구조

PetFit은 별도 서버 없이 브라우저에서 동작하는 정적 웹 프로토타입입니다.

```text
사용자
  └─ index.html / 기능별 화면
       ├─ 로컬 JavaScript와 CSS
       ├─ localStorage (반려견 프로필·건강 기록)
       ├─ Gemini API (AI 분석·질의)
       ├─ Kakao Local API (동물병원 검색)
       └─ Leaflet + OpenStreetMap / Chart.js
```

## 기능별 책임

| 영역 | 주요 파일 | 책임 |
|---|---|---|
| 소개·탐색 | `index.html`, `pages/landing.html` | 프로젝트 소개와 기능 진입 |
| 사료 분석 | `pages/food_analysis.html`, `assets/js/app.js`, `assets/js/food_db.js` | 프로필 입력, 이미지 분석, 사료 점수와 추천 |
| 급여량 | `pages/feeding.html`, `assets/css/feeding_style.css` | 에너지 요구량과 급여량 계산, 영양 시각화 |
| 건강관리 | `pages/healthcare.html`, `assets/js/healthcare_app.js` | 건강 항목 기록, 위험 신호와 리포트 |
| 병원 지도 | `pages/vet_map.html` | 위치정보, 병원 검색, 지도 표시 |
| 백과 | `pages/encyclopedia.html` | 정적 지식 카드와 AI 질의 |
| 배포 | `scripts/build_single.py`, `desktop/` | 단일 HTML과 Electron 앱 생성 |

## 데이터와 보안

- 사용자가 입력한 프로필 일부는 `localStorage`에 저장됩니다.
- Gemini 및 Kakao API는 현재 브라우저에서 직접 호출합니다.
- 실제 서비스에서는 키를 클라이언트에 두지 말고 백엔드 프록시와 사용자 인증, 요청 제한을 적용해야 합니다.
- 저장소에는 실제 키가 아닌 `config.example.js`만 포함합니다.

## 연구 포트폴리오에서 강조할 지점

- 문제 정의: 분산된 반려견 건강정보를 의사결정 흐름으로 통합
- 설계 가설: 프로필과 영양 정보를 함께 제시하면 사료 선택의 설명 가능성이 높아지는가
- 구현: 규칙 기반 계산과 생성형 AI를 역할별로 조합
- 평가 과제: 전문가 타당도, 추천 일관성, 사용성, 위험 문구 이해도
