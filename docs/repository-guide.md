# GitHub 공개 가이드

## 저장소에 포함할 파일

- `pages/`의 기능별 HTML 원본
- `assets/css/`, `assets/js/`의 스타일과 애플리케이션 로직
- `config.example.js`
- `scripts/build_single.py`
- `desktop/`의 Electron 소스와 `package.json`
- `README.md`, `docs/`, `.gitignore`
- 직접 제작했거나 공개 권한이 명확한 이미지

## 포함하지 않을 파일

- `config.js`와 실제 API 키
- `dist/petfit_all.html`, `desktop/index.html` 같은 생성물
- `node_modules/`, `desktop/dist/`
- 개인 데이터가 들어간 화면 캡처
- 설치 파일과 실행 바이너리(필요하면 GitHub Releases에 별도 배포)

## 공개 전 체크리스트

- [ ] 노출된 Gemini 키를 폐기하고 새 키를 발급했다.
- [ ] `rg -n "API_KEY|KakaoAK|AIza|AQ\." .`로 키 흔적을 검사했다.
- [ ] 모든 주요 화면을 로컬 서버에서 직접 실행했다.
- [ ] AI·지도 기능의 실패 상태도 확인했다.
- [ ] README에 본인의 역할, 기간, 팀 구성, 기여도를 추가했다.
- [ ] 대표 스크린샷 3~5장을 `docs/images/`에 추가했다.
- [ ] 실험 또는 사용자 평가가 있다면 방법과 결과를 수치로 기록했다.
- [ ] 사용할 라이선스를 결정하고 `LICENSE`를 추가했다.

## 권장 GitHub 설정

- 저장소 설명: `AI-assisted pet health and nutrition management prototype`
- Topics: `pet-health`, `vanilla-javascript`, `gemini-api`, `leaflet`, `electron`, `portfolio`
- 기본 브랜치 보호와 secret scanning 활성화
- 웹 데모를 공개할 경우 GitHub Pages 사용. 단, API 키가 필요한 기능은 데모 모드로 제한

## 포트폴리오 보강 자료

README에 다음 정보를 추가하면 단순 구현물보다 연구 포트폴리오로서 설득력이 높아집니다.

1. 연구 질문 또는 문제 가설
2. 사용자·이해관계자와 사용 맥락
3. 데이터 출처와 영양 점수 계산 근거
4. 생성형 AI를 사용한 이유와 규칙 기반 로직의 경계
5. 평가 방법, 실패 사례, 윤리·안전 고려
6. 본인이 내린 핵심 설계 결정과 배운 점
