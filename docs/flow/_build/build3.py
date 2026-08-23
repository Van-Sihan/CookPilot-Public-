# -*- coding: utf-8 -*-
"""서비스 흐름도 — 지도 A · B · C + 구현 근거 (A4 가로)."""
import io
import html as H
from service import map_a, map_b, map_c1, map_c2

OUT = r"c:\dev\cookpilot.v2\docs\flow\phases.html"


def e(s):
    return H.escape(str(s))


CSS = """
@page { size: A4 landscape; margin: 11mm 12mm 10mm 12mm; }
* { box-sizing: border-box; }
body {
  font-family: 'Malgun Gothic','Nanum Gothic',Arial,sans-serif;
  font-size: 9.2pt; line-height: 1.5; color: #000; background: #fff; margin: 0;
}
code, .mono { font-family: Consolas,'Malgun Gothic','Courier New',monospace;
              font-size: 8.4pt; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
h2 { font-size: 13pt; margin: 0 0 1mm; border-bottom: 1.4pt solid #000;
     padding-bottom: 1.2mm; }
p  { margin: 0 0 2mm; }
.lead { font-size: 9.0pt; margin: 0 0 2mm; }
.chapno { font-size: 8.2pt; letter-spacing: .18em; margin: 0 0 1mm; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 0.5pt solid #000; padding: 0.9mm 1.4mm; vertical-align: top;
         text-align: left; }
thead { display: table-header-group; }
thead th { background: #e8e8e8; font-size: 8.2pt; }
tr { page-break-inside: avoid; }
.ref th, .ref td { font-size: 7.6pt; line-height: 1.42; }
.ref .g  { background: #ddd; font-weight: bold; font-size: 8.2pt; }
.ref .id { width: 20mm; white-space: nowrap; font-weight: bold; }
.ref .nm { width: 58mm; }
.ref .lo { font-family: Consolas,'Malgun Gothic',monospace; font-size: 7.2pt; }
.fc { display: block; margin: 2mm auto 0; page-break-inside: avoid; }
.legend { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.4mm 5mm;
          font-size: 8.2pt; margin-bottom: 1mm; }
.legend div { display: flex; gap: 2mm; }
.legend b { min-width: 21mm; }
.ids { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8mm 5mm;
       font-size: 8.0pt; }
.ids div { display: flex; gap: 2mm; }
.ids b { min-width: 15mm; white-space: nowrap; }
.fns { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.6mm 4mm;
       font-size: 7.6pt; }
.fns div { display: flex; gap: 1.6mm; }
.fns b { min-width: 9mm; white-space: nowrap;
         font-family: Consolas,monospace; font-size: 7.4pt; }
h4 { font-size: 9.0pt; margin: 2mm 0 0.8mm; }
"""

# ── 구현 근거 ─────────────────────────────────────────────
REF = [
    ("지도 A — 주요 요리 흐름", [
        ("P1", "CookPilot 시작", "app/page.tsx"),
        ("P2", "Gemini API Key 입력",
         "components/start/api-key-form.tsx:F5 · lib/usecase/enter-with-api-key.ts:F1 · "
         "lib/domain/api-key.ts:F1"),
        ("D1-1", "저장", "lib/adapter/browser-api-key-store.ts:F4"),
        ("P3", "음성 모델 선택",
         "components/setup/setup-picker.tsx:F15 · lib/usecase/choose-cook-setup.ts:F1"),
        ("D1-2", "저장", "lib/adapter/browser-cook-setup-store.ts:F3"),
        ("—", "레시피 입력 방식 선택",
         "components/pick/pick-cards.tsx:F6 · components/pick/voice-console.tsx:F6"),
        ("FN03", "음성 입력", "lib/usecase/plan-recipe.ts:F1"),
        ("FN04", "YouTube 링크",
         "lib/usecase/plan-recipe.ts:F8 · lib/domain/recipe.ts:F22"),
        ("FN05", "냉장고 재료",
         "lib/usecase/plan-recipe.ts:F12 · lib/usecase/plan-recipe.ts:F13"),
        ("P4", "레시피 생성",
         "lib/adapter/gemini-recipe-gateway.ts:F5 · lib/domain/recipe.ts:F3"),
        ("D1-3", "저장",
         "lib/usecase/plan-recipe.ts:F16 · lib/adapter/browser-recipe-draft-store.ts:F3"),
        ("P5", "장보기 목록 확인",
         "components/shop/shop-shell.tsx:F7 · lib/domain/shopping.ts:F2"),
        ("P6", "음성 기반 요리 진행",
         "components/cook/live-console.tsx:F12 · lib/adapter/gemini-live-gateway.ts:F1 · "
         "lib/usecase/cook-along.ts:F1"),
        ("P7", "요리 완료",
         "components/cook/done-shell.tsx:F8 · lib/usecase/keep-recipe-shelf.ts:F7"),
        ("D1-4", "저장", "lib/adapter/browser-recipe-shelf-store.ts:F3"),
        ("—", "임시 레시피 삭제",
         "lib/usecase/plan-recipe.ts:F19 · components/cook/done-shell.tsx (F 미부여)"),
        ("P8", "다음 요리 선택", "components/cook/done-shell.tsx (F 미부여)"),
    ]),
    ("지도 C-1 — 독립 기능", [
        ("P9", "AI 요리 상담",
         "components/ask/ask-shell.tsx:F8 · app/api/chat/route.ts:F4 · "
         "lib/usecase/ask-kitchen.ts:F1"),
        ("D1-6", "저장 · 조회 · 삭제",
         "lib/usecase/ask-kitchen.ts:F13 · lib/usecase/ask-kitchen.ts:F12 · "
         "components/ask/ask-shell.tsx:F18"),
        ("P10", "저장 레시피 조회",
         "components/shelf/shelf-stand.tsx:F4 · components/shelf/shelf-stand.tsx:F6 · "
         "components/shelf/shelf-stand.tsx:F7"),
        ("P11", "커뮤니티 게시글 조회",
         "app/community/page.tsx:F1 · lib/adapter/supabase-post-reader.ts:F6 · "
         "lib/domain/community-tab.ts:F8"),
        ("D1-5", "저장 · 조회",
         "components/post/post-talk.tsx:F5 · lib/usecase/discuss-post.ts:F1 · "
         "lib/usecase/discuss-post.ts:F9"),
    ]),
    ("지도 C-2 — 로그인 영역", [
        ("P12", "로그인", "app/actions/auth.ts:F2 · lib/usecase/sign-in.ts:F1"),
        ("P12", "회원가입", "app/actions/auth.ts:F8 · lib/usecase/sign-up.ts:F1"),
        ("P13", "게시글 작성",
         "app/actions/post.ts:F2 · lib/usecase/write-post.ts:F1 · "
         "lib/domain/post-draft.ts:F3"),
        ("P13", "게시글 수정 · 삭제",
         "app/actions/post.ts:F10 · app/actions/post.ts:F14 · "
         "lib/usecase/write-post.ts:F6 · lib/usecase/write-post.ts:F11"),
        ("P14", "댓글",
         "app/actions/post.ts:F17 · lib/usecase/discuss-post.ts:F11 · "
         "lib/adapter/supabase-post-reader.ts:F14"),
        ("P14", "좋아요 · 즐겨찾기",
         "app/actions/post.ts:F25 · app/actions/post.ts:F27 · "
         "lib/usecase/react-to-post.ts:F2"),
        ("P15", "프로필 관리",
         "app/actions/post.ts:F7 · app/actions/post.ts:F29 · "
         "lib/usecase/rename-me.ts:F1 · lib/usecase/rename-me.ts:F6"),
        ("D3-1", "표지 이미지 업로드", "lib/adapter/browser-cover-upload.ts:F3"),
        ("D3-2", "프로필 이미지 업로드", "lib/adapter/browser-avatar-upload.ts:F6"),
    ]),
    ("접근 권한 검사 (J7) — 경계 5곳", [
        ("J7", "라우트 접근 검사 3곳",
         "app/write/page.tsx:F4 · app/account/page.tsx:F3 · "
         "app/posts/[id]/edit/page.tsx:F3"),
        ("J7", "클라이언트 접근 제한 2곳",
         "components/post/post-actions.tsx:F5 · components/post/live-talk.tsx:F1"),
        ("—", "최종 판정", "supabase/migrations/ RLS 정책"),
    ]),
    ("지도 C-3 — 오류 및 예외 처리 경로", [
        ("→ /start", "API Key 없음 2곳",
         "components/community/home-me.tsx:F7 · components/post/cook-this.tsx:F1"),
        ("→ /start/model", "음성 모델 미선택",
         "components/community/home-me.tsx:F8"),
        ("→ /login", "로그인 필요 3곳",
         "app/write/page.tsx:F4 · app/account/page.tsx:F3 · "
         "app/posts/[id]/edit/page.tsx:F3"),
        ("→ /posts/:id", "게시글 권한 없음",
         "app/posts/[id]/edit/page.tsx:F6"),
        ("현재 화면", "레시피 미선택 2곳",
         "components/shop/shop-shell.tsx:F8 · components/cook/done-shell.tsx:F6"),
        ("현재 화면", "API Key 없음 (요리 화면)",
         "components/cook/live-console.tsx:F13"),
        ("현재 화면", "비로그인 상태의 반응 · 댓글 2곳",
         "components/post/post-actions.tsx:F5 · components/post/live-talk.tsx:F1"),
        ("현재 화면", "레시피 미포함 저장 항목",
         "components/shelf/shelf-stand.tsx:F2"),
        ("현재 화면", "예시 게시글 반응 (uuid 아님)",
         "lib/usecase/react-to-post.ts:F3"),
        ("현재 화면", "검색 결과 0건", "lib/adapter/langchain-rag.ts:F30"),
        ("현재 화면", "백업 파일 형식 오류",
         "lib/usecase/keep-recipe-shelf.ts:F18 · lib/domain/recipe-shelf.ts:F5"),
    ]),
    ("데이터 삭제 지점 5곳", [
        ("D1-3", "임시 레시피 삭제",
         "lib/usecase/plan-recipe.ts:F19 · components/cook/done-shell.tsx (F 미부여)"),
        ("D1-1", "API Key 교체",
         "components/start/api-key-form.tsx:F9 · lib/usecase/enter-with-api-key.ts:F8"),
        ("D1-6", "대화 초기화",
         "components/ask/ask-shell.tsx:F18 · lib/usecase/ask-kitchen.ts:F14"),
        ("D1-4", "저장된 레시피 항목 1건 삭제",
         "components/shelf/shelf-stand.tsx:F10 · lib/usecase/keep-recipe-shelf.ts:F12"),
        ("D1-1 · D1-2 · D1-4", "일괄 삭제", "components/pick/pick-rail.tsx:F12"),
    ]),
    ("운영 작업 — 사용자 흐름 외", [
        ("FN11", "후기 데이터 색인",
         "app/api/kitchen/index/route.ts:F1 · lib/adapter/csv-reviews.ts:F4 · "
         "lib/adapter/langchain-rag.ts:F10"),
        ("FN11", "색인 점검 조회",
         "app/api/kitchen/index/route.ts:F6 · lib/adapter/langchain-rag.ts:F17"),
        ("D2 · D3", "스키마 · RLS 정책 생성", "supabase/migrations/ 5건"),
    ]),
]


def ref_table():
    r = ['<table class="ref"><thead><tr><th class="id">ID</th>'
         '<th class="nm">항목</th><th>구현 위치 (경로/파일:F#)</th>'
         "</tr></thead><tbody>"]
    for g, rows in REF:
        r.append('<tr class="g"><td colspan="3">%s</td></tr>' % e(g))
        for a, b, cpath in rows:
            r.append('<tr><td class="id">%s</td><td class="nm">%s</td>'
                     '<td class="lo">%s</td></tr>' % (e(a), e(b), e(cpath)))
    r.append("</tbody></table>")
    return "".join(r)


P = []


def page(*chunks):
    P.append('<section class="page">' + "".join(chunks) + "</section>")


LEGEND = (
    '<div class="legend">'
    "<div><b>둥근 사각형</b><span>흐름 시작 · 종료</span></div>"
    "<div><b>사각형</b><span>화면 · 처리 단계</span></div>"
    "<div><b>마름모</b><span>분기 · 검사 조건</span></div>"
    "<div><b>원통</b><span>데이터 저장소</span></div>"
    "<div><b>실선 화살표</b><span>실행 순서 · 데이터 전달</span></div>"
    "<div><b>점선 사각형</b><span>영역 구분</span></div>"
    "<div><b>✕</b><span>데이터 삭제</span></div>"
    "<div><b>▷</b><span>외부 시스템</span></div>"
    "</div>")

ID_BLOCK = ('<h4>ID 규칙 — 지도 A · B · C 공통</h4><div class="ids"><div><b>P1 – P15</b><span>사용자 단계. 이 문서에서 부여</span></div><div><b>FN01 – FN13</b><span>기능. <code>flow.md</code> 와 동일</span></div><div><b>D1 – D4</b><span>데이터 저장 위치. map.pdf 2장</span></div><div><b>J1 – J7</b><span>화면 여정. map.pdf 3장</span></div></div><h4>FN — 기능 13종 (지도 A 에는 FN03 · FN04 · FN05 만 나온다)</h4><div class="fns"><div><b>FN01</b><span>Gemini API Key 입력</span></div><div><b>FN02</b><span>로그인 · 회원가입</span></div><div><b>FN03</b><span>음성 입력 레시피 생성</span></div><div><b>FN04</b><span>YouTube 링크 레시피 생성</span></div><div><b>FN05</b><span>냉장고 재료 레시피 생성</span></div><div><b>FN06</b><span>음성 기반 요리 진행</span></div><div><b>FN07</b><span>게시글 작성 · 수정 · 삭제</span></div><div><b>FN08</b><span>댓글</span></div><div><b>FN09</b><span>좋아요 · 즐겨찾기</span></div><div><b>FN10</b><span>프로필 관리</span></div><div><b>FN11</b><span>AI 요리 상담 (RAG)</span></div><div><b>FN12</b><span>저장 레시피 관리</span></div><div><b>FN13</b><span>커뮤니티 목록 · 검색 · 태그</span></div></div>')

page(
    '<p class="chapno">COOKPILOT 서비스 흐름도  ·  지도 A</p>',
    "<h2>지도 A — 사용자 주요 흐름 (P1 – P8)</h2>",
    '<p class="lead">로그인 없이 완료되는 요리 흐름이다. 왼쪽은 사용자 단계, 오른쪽은 각 단계에서 접근하는 데이터다. 구현 위치는 마지막 구현 근거 표를 참조한다.</p>',
    LEGEND,
    ID_BLOCK,
    map_a(),
)

page(
    '<p class="chapno">COOKPILOT 서비스 흐름도  ·  지도 B</p>',
    "<h2>지도 B — 기능 · 데이터 구조 (FN01 – FN13 / D1 – D4)</h2>",
    '<p class="lead">저장 위치별로 접근 기능을 정리했다. '
    "Browser Storage 는 서버로 전송되지 않으며, External API 중 D4-1 · D4-2 · "
    "D4-5 는 브라우저가 서버를 거치지 않고 직접 호출한다.</p>",
    map_b(),
)

page(
    '<p class="chapno">COOKPILOT 서비스 흐름도  ·  지도 C (1/2)</p>',
    "<h2>지도 C-1 · C-2 — 독립 기능과 로그인 경계</h2>",
    '<p class="lead">C-1 은 주요 요리 흐름과 독립적으로 사용 가능한 기능, '
    "C-2 는 저장 위치가 브라우저에서 Supabase 로 바뀌는 경계다.</p>",
    map_c1(),
)

page(
    '<p class="chapno">COOKPILOT 서비스 흐름도  ·  지도 C (2/2)</p>',
    "<h2>지도 C-3 — 오류 및 예외 처리 경로</h2>",
    '<p class="lead">검사 조건과 처리 결과만 표시한다. 검사 위치는 '
    "구현 근거를 참조한다. 처리 결과는 라우트 이동 4종과 현재 화면 처리 1종이다.</p>",
    map_c2(),
)

page(
    '<p class="chapno">COOKPILOT 서비스 흐름도  ·  구현 근거</p>',
    "<h2>구현 근거 — 지도 A · B · C 의 각 항목에 대응하는 코드 위치</h2>",
    '<p class="lead">지도에는 파일명을 넣지 않고 여기에 모았다. '
    "ID 체계는 기존 문서(<code>docs/flow/map.pdf</code> · "
    "<code>docs/flow/flow.md</code>)와 동일하다.</p>",
    ref_table(),
)

html = ('<title>CookPilot 서비스 흐름도</title><style>%s</style>%s'
        % (CSS, "".join(P)))
io.open(OUT, "w", encoding="utf-8").write(html)
print("wrote", OUT, len(html), "chars,", len(P), "pages")
