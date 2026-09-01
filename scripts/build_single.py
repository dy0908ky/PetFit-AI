#!/usr/bin/env python3
"""
PetFit 단일 HTML 빌더

모든 페이지를 하나의 HTML 파일로 합친다.
각 페이지는 iframe srcdoc 으로 격리되어 CSS/ID 충돌이 발생하지 않는다.
외부 CSS/JS 는 모두 인라인화하고, CDN 링크만 유지한다.
"""
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
PAGES_DIR = os.path.join(ROOT, "pages")
DIST_DIR = os.path.join(ROOT, "dist")

# 뷰 키 -> (소스 파일, 탭 라벨)
PAGES = [
    ("landing", "landing.html", "🏠 소개"),
    ("map", "vet_map.html", "🏥 동물병원"),
    ("food", "food_analysis.html", "📸 사료 분석"),
    ("feeding", "feeding.html", "🥣 급여량"),
    ("health", "healthcare.html", "📊 건강"),
    ("enc", "encyclopedia.html", "📚 백과사전"),
]

# landing 의 페이지 링크 -> 부모 탭 전환으로 치환
LINK_TO_VIEW = {
    "vet_map.html": "map",
    "food_analysis.html": "food",
    "feeding.html": "feeding",
    "healthcare.html": "health",
    "encyclopedia.html": "enc",
    "landing.html": "landing",
    "index.html": "landing",
}


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def inline_assets(html, source_dir):
    """로컬 CSS/JS 를 인라인으로 치환. CDN 링크는 유지."""

    def css_repl(m):
        tag = m.group(0)
        href = m.group("href")
        if href.startswith("http"):
            return tag  # CDN / 웹폰트 유지
        path = os.path.normpath(os.path.join(source_dir, href))
        if not os.path.exists(path):
            return f"<!-- 누락된 CSS: {href} -->"
        return "<style>\n" + read(path) + "\n</style>"

    html = re.sub(
        r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*href=["\'](?P<href>[^"\']+)["\'][^>]*>',
        css_repl, html)
    # href 가 rel 보다 앞에 오는 순서도 처리
    html = re.sub(
        r'<link\b[^>]*href=["\'](?P<href>[^"\']+)["\'][^>]*rel=["\']stylesheet["\'][^>]*>',
        css_repl, html)

    def js_repl(m):
        tag = m.group(0)
        src = m.group("src")
        if src.startswith("http"):
            return tag  # CDN 유지
        # 로컬 비밀키는 단일 HTML 결과물에 포함하지 않는다.
        # 생성된 파일에서는 사용자가 화면의 입력란에 직접 키를 입력한다.
        if os.path.basename(src).lower() == "config.js":
            return "<script>const GEMINI_API_KEY = \"\";</script>"
        path = os.path.normpath(os.path.join(source_dir, src))
        if not os.path.exists(path):
            return f"<!-- 누락된 JS: {src} -->"
        return "<script>\n" + read(path) + "\n</script>"

    html = re.sub(
        r'<script\b[^>]*src=["\'](?P<src>[^"\']+)["\'][^>]*>\s*</script>',
        js_repl, html)
    return html


def strip_navbar(html):
    """각 페이지의 자체 네비게이션 제거 (부모 탭이 대체)."""
    return re.sub(r'<header class="navbar">.*?</header>', "", html, flags=re.S)


def rewire_landing_links(html):
    """landing 의 내부 페이지 링크를 부모 탭 전환 호출로 바꿈."""
    def repl(m):
        target = m.group("href")
        view = LINK_TO_VIEW.get(target)
        if view is None:
            return m.group(0)
        rest = m.group("rest") or ""
        # 기존 onclick 제거
        rest = re.sub(r'\s*onclick="[^"]*"', "", rest)
        return f'<a href="#" onclick="return parent.navigateTo(\'{view}\')"{rest}>'

    return re.sub(
        r'<a\s+(?:[^>]*?\s)?href="(?P<href>[^"]+\.html)"(?P<rest>[^>]*)>',
        repl, html)


def build_page(key, filename):
    page_path = os.path.join(PAGES_DIR, filename)
    html = read(page_path)
    html = inline_assets(html, os.path.dirname(page_path))
    html = strip_navbar(html)
    if key == "landing":
        html = rewire_landing_links(html)
    # 템플릿 스크립트 블록 안에서 조기 종료되지 않도록 이스케이프
    html = html.replace("</script>", "<\\/script>")
    return html


def main():
    templates = []
    tabs = []
    frames = []

    for key, filename, label in PAGES:
        page = build_page(key, filename)
        templates.append(
            f'<script type="text/html" id="tpl-{key}">{page}</script>')
        active = " active" if key == "landing" else ""
        tabs.append(
            f'<button class="tab{active}" data-view="{key}" '
            f'onclick="navigateTo(\'{key}\')">{label}</button>')
        # sandbox 는 사용하지 않는다.
        # allow-modals 없이 sandbox 를 걸면 각 페이지가 쓰는 alert() 가 차단되고,
        # geolocation 권한도 전달되지 않는다. 모두 자체 제작 페이지라 격리 이득이 없다.
        frames.append(
            f'<iframe class="frame" id="frame-{key}" title="{label}" '
            f'allow="geolocation" referrerpolicy="no-referrer"></iframe>')

    shell = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PetFit - 반려견 건강의 모든 것</title>
<style>
  *{{margin:0;padding:0;box-sizing:border-box}}
  :root{{
    --primary:#e8790a; --primary-dark:#d06a05; --accent:#f5a623;
    --bg:#fffbf5; --border:#f0e6da; --text:#2d2013; --text-light:#5c4a37;
  }}
  html,body{{height:100%}}
  body{{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;
    background:var(--bg); color:var(--text); display:flex; flex-direction:column;
  }}
  /* ── 상단 탭 바 ── */
  .topbar{{
    display:flex; align-items:center; gap:16px; flex-wrap:wrap;
    padding:10px 20px; background:#fff;
    border-bottom:1px solid var(--border);
    box-shadow:0 2px 8px rgba(139,90,43,.06);
    flex:0 0 auto;
  }}
  .brand{{
    font-size:19px; font-weight:800; color:var(--primary);
    cursor:pointer; white-space:nowrap; background:none; border:0;
    font-family:inherit;
  }}
  .tabs{{display:flex; gap:4px; flex-wrap:wrap}}
  .tab{{
    border:0; background:none; font-family:inherit; cursor:pointer;
    padding:8px 13px; border-radius:8px;
    font-size:13px; font-weight:600; color:var(--text-light);
    white-space:nowrap; transition:all .18s;
  }}
  .tab:hover{{background:var(--bg); color:var(--primary)}}
  .tab.active{{background:var(--primary); color:#fff}}

  /* ── 뷰 영역 ── */
  .stage{{position:relative; flex:1 1 auto; overflow:hidden}}
  .frame{{
    position:absolute; inset:0; width:100%; height:100%;
    border:0; display:none; background:var(--bg);
    opacity:0; transition:opacity .32s ease;
  }}
  .frame.show{{display:block}}
  .frame.visible{{opacity:1}}

  .loading{{
    position:absolute; inset:0; display:flex; align-items:center;
    justify-content:center; gap:10px; color:var(--text-light);
    font-size:14px; pointer-events:none; opacity:0;
    transition:opacity .2s;
  }}
  .loading.on{{opacity:1}}
  .spinner{{
    width:20px; height:20px; border:3px solid var(--border);
    border-top-color:var(--primary); border-radius:50%;
    animation:spin .8s linear infinite;
  }}
  @keyframes spin{{to{{transform:rotate(360deg)}}}}

  @media (max-width:768px){{
    .topbar{{padding:8px 12px; gap:8px}}
    .brand{{font-size:17px}}
    .tab{{padding:7px 10px; font-size:12px}}
  }}
</style>
</head>
<body>

<header class="topbar">
  <button class="brand" onclick="navigateTo('landing')">🐾 PetFit</button>
  <nav class="tabs">
    {chr(10).join("    " + t for t in tabs)}
  </nav>
</header>

<main class="stage">
  <div class="loading" id="loading"><span class="spinner"></span> 불러오는 중…</div>
  {chr(10).join("  " + f for f in frames)}
</main>

<!-- ── 각 페이지 원본 (iframe 으로 격리 렌더링) ── -->
{chr(10).join(templates)}

<script>
(function () {{
  var current = null;

  function setTab(view) {{
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {{
      tabs[i].classList.toggle('active', tabs[i].dataset.view === view);
    }}
  }}

  window.navigateTo = function (view) {{
    if (view === current) return false;

    var frame = document.getElementById('frame-' + view);
    var tpl = document.getElementById('tpl-' + view);
    if (!frame || !tpl) return false;

    // 이전 뷰 페이드 아웃
    if (current) {{
      var prev = document.getElementById('frame-' + current);
      prev.classList.remove('visible');
      setTimeout(function () {{ prev.classList.remove('show'); }}, 320);
    }}

    setTab(view);
    current = view;

    var loading = document.getElementById('loading');

    // 최초 진입 시에만 로드 (지도/차트 스크립트 지연 로딩)
    if (!frame.dataset.loaded) {{
      frame.dataset.loaded = '1';
      loading.classList.add('on');
      frame.addEventListener('load', function () {{
        loading.classList.remove('on');
        frame.classList.add('show');
        requestAnimationFrame(function () {{
          requestAnimationFrame(function () {{ frame.classList.add('visible'); }});
        }});
      }}, {{ once: true }});
      // 템플릿 저장 시 이스케이프했던 닫는 스크립트 태그를 복원한다.
      // textContent 는 백슬래시를 그대로 돌려주므로 이 처리가 없으면
      // 내부 페이지의 <script> 가 닫히지 않아 렌더링이 깨진다.
      frame.srcdoc = tpl.textContent.replace(/<\\\\\\/script>/g, '<' + '/script>');
    }} else {{
      frame.classList.add('show');
      requestAnimationFrame(function () {{
        requestAnimationFrame(function () {{ frame.classList.add('visible'); }});
      }});
    }}
    return false;
  }};

  navigateTo('landing');
}})();
</script>
</body>
</html>
"""

    os.makedirs(DIST_DIR, exist_ok=True)
    out = os.path.join(DIST_DIR, "petfit_all.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(shell)

    size = os.path.getsize(out)
    print(f"생성: dist/petfit_all.html  ({size:,} bytes / {size/1024:.0f} KB)")
    print(f"1MB 제한: {'통과' if size < 1024*1024 else '초과!'}")
    return size


if __name__ == "__main__":
    main()
