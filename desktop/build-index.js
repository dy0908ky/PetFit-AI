/**
 * petfit_all.html을 Electron용 index.html로 변환하는 빌드 스크립트
 * - 하드코딩된 API 키를 동적 로딩으로 교체
 * - API 키 설정 UI (모달) 추가
 * - 설정 버튼 추가
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'dist', 'petfit_all.html');
const OUTPUT = path.join(__dirname, 'index.html');

let html = fs.readFileSync(SOURCE, 'utf-8');

// 1. 하드코딩된 GEMINI_API_KEY 선언을 동적 로딩으로 교체
// 패턴: const GEMINI_API_KEY = "..."; (여러 곳에 있음)
html = html.replace(
  /const GEMINI_API_KEY = "[^"]*";/g,
  'const GEMINI_API_KEY = window.__PETFIT_API_KEY || localStorage.getItem("petfit_gemini_key") || "";'
);

// 2. </head> 앞에 API 키 초기화 스크립트 삽입 (최상위 문서에만)
const initScript = `
<script>
  // Electron preload에서 API 키를 불러와 전역 변수에 세팅
  (async function() {
    if (window.petfitAPI) {
      const key = await window.petfitAPI.getApiKey();
      if (key) {
        window.__PETFIT_API_KEY = key;
        localStorage.setItem('petfit_gemini_key', key);
      }
    }
  })();
<\/script>
`;
html = html.replace('</head>', initScript + '\n</head>');

// 3. 상단 탭바에 설정 버튼 추가
html = html.replace(
  '</nav>\n</header>',
  `</nav>
  <button class="tab" id="settings-btn" onclick="openSettings()" title="API 키 설정" style="margin-left:auto;">⚙️ 설정</button>
</header>`
);

// 4. <body> 태그 바로 뒤에 (topbar 앞에) 설정 모달 + 스크립트 삽입
const settingsModal = `
<!-- ── PetFit 설정 모달 ── -->
<div id="settings-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99999; align-items:center; justify-content:center;">
  <div style="background:#fff; border-radius:16px; padding:32px; max-width:480px; width:90%; box-shadow:0 8px 32px rgba(0,0,0,0.2); position:relative;">
    <button onclick="closeSettings()" style="position:absolute; top:12px; right:16px; background:none; border:none; font-size:24px; cursor:pointer; color:#666;">&times;</button>
    <h2 style="font-size:20px; margin-bottom:8px; color:#2d2013;">⚙️ PetFit 설정</h2>
    <p style="font-size:13px; color:#9a8574; margin-bottom:24px;">API 키를 변경하면 앱을 다시 시작할 때 적용됩니다.</p>
    
    <label style="font-size:13px; font-weight:600; color:#5c4a37; display:block; margin-bottom:6px;">Gemini API Key</label>
    <input type="password" id="settings-api-key" placeholder="API 키를 입력하세요" 
      style="width:100%; padding:12px 14px; border:1px solid #f0e6da; border-radius:8px; font-size:14px; outline:none; margin-bottom:8px;">
    <p style="font-size:12px; color:#9a8574; margin-bottom:20px;">
      <a href="https://aistudio.google.com/apikey" style="color:#e8790a;" target="_blank">https://aistudio.google.com/apikey</a> 에서 발급받을 수 있습니다.
    </p>
    
    <div style="display:flex; gap:10px; justify-content:flex-end;">
      <button onclick="closeSettings()" style="padding:10px 20px; border:1px solid #f0e6da; background:#fff; border-radius:8px; cursor:pointer; font-size:14px; color:#5c4a37;">취소</button>
      <button onclick="saveSettings()" style="padding:10px 20px; border:none; background:#e8790a; color:#fff; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600;">저장</button>
    </div>
    
    <div id="settings-msg" style="margin-top:12px; font-size:13px; text-align:center; display:none;"></div>
  </div>
</div>

<script>
  function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    const input = document.getElementById('settings-api-key');
    overlay.style.display = 'flex';
    // 현재 저장된 키 표시
    const currentKey = window.__PETFIT_API_KEY || localStorage.getItem('petfit_gemini_key') || '';
    input.value = currentKey;
    input.focus();
  }

  function closeSettings() {
    document.getElementById('settings-overlay').style.display = 'none';
    document.getElementById('settings-msg').style.display = 'none';
  }

  async function saveSettings() {
    const input = document.getElementById('settings-api-key');
    const msg = document.getElementById('settings-msg');
    const key = input.value.trim();
    
    if (!key) {
      msg.style.display = 'block';
      msg.style.color = '#e03131';
      msg.textContent = 'API 키를 입력해주세요.';
      return;
    }

    // 로컬 스토리지에 저장
    localStorage.setItem('petfit_gemini_key', key);
    window.__PETFIT_API_KEY = key;

    // Electron API로도 저장 (파일 기반 영구 저장)
    if (window.petfitAPI) {
      await window.petfitAPI.saveApiKey(key);
    }

    // 각 iframe에도 키 전파
    document.querySelectorAll('iframe.frame').forEach(frame => {
      try {
        if (frame.contentWindow) {
          frame.contentWindow.__PETFIT_API_KEY = key;
        }
      } catch(e) {}
    });

    msg.style.display = 'block';
    msg.style.color = '#2b8a3e';
    msg.textContent = '✓ 저장되었습니다. 새 탭을 열면 적용됩니다.';
    
    setTimeout(() => closeSettings(), 1500);
  }

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettings();
  });
<\/script>
`;

html = html.replace(
  '<header class="topbar">',
  settingsModal + '\n<header class="topbar">'
);

// 5. iframe의 srcdoc 주입 시 API 키를 전파하도록 navigateTo 함수 수정
// petfit_all.html의 기존 navigateTo를 수정하여, iframe에 키 주입
const iframeKeyInjection = `
  // iframe 로드 완료 시 API 키 주입
  frame.addEventListener('load', function() {
    try {
      const key = window.__PETFIT_API_KEY || localStorage.getItem('petfit_gemini_key') || '';
      if (frame.contentWindow && key) {
        frame.contentWindow.__PETFIT_API_KEY = key;
        // GEMINI_API_KEY 변수도 갱신
        frame.contentWindow.GEMINI_API_KEY = key;
      }
    } catch(e) {}
  });
`;

// navigateTo 함수 안에서 frame.srcdoc 설정 직후에 키 주입 코드 삽입
html = html.replace(
  /frame\.srcdoc\s*=\s*tpl;/g,
  `frame.srcdoc = tpl;\n${iframeKeyInjection}`
);

// 6. 파일 저장
fs.writeFileSync(OUTPUT, html, 'utf-8');
console.log('✓ index.html 생성 완료 (' + Math.round(html.length/1024) + 'KB)');
