# -*- coding: utf-8 -*-
"""CookPilot Use Case Diagram 을 만든다 (SVG · Mermaid · 매핑표).

근거: docs/flow/flow.md (FN01–FN13) · docs/flow/map.pdf (D · J · S) ·
      docs/spec/CookPilot_기능명세서_HIPO.xlsx (M1–M7) · 코드의 [F#] 주석.
근거가 없는 Actor · Use Case · 관계는 만들지 않는다.
"""
import html
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "flow", "_build"))
from chart import Chart, FONT, MONO, PX_MM  # noqa: E402

OUT_DIR = os.path.dirname(HERE)

# ══════════════════════════════════════════════════════════
# 데이터 — 모든 산출물이 이 표 하나에서 나온다
# ══════════════════════════════════════════════════════════
SYSTEM_NAME = "CookPilot"

# (id, 이름, 부제)
ACTORS = [
    ("A1", "비로그인 사용자", "계정 없이 쓰는 사람"),
    ("A2", "로그인 사용자", "A1 이 할 수 있는 일을 모두 할 수 있다"),
    ("A3", "운영자", "후기 데이터를 올리는 사람"),
]
EXTERNALS = [
    ("E1", "YouTube", "영상 · 썸네일"),
    ("E2", "Gemini", "레시피 생성 · 실시간 음성 · 응답"),
    ("E3", "Pinecone", "후기 벡터 검색 · 색인"),
    ("E4", "Supabase", "계정 · 데이터 · 이미지"),
]

# (모듈ID, 모듈명, [유스케이스])
# 유스케이스: (UC, 이름, FN, 화면 J, 데이터 D, 근거, [행위자], [외부])
MODULES = [
 ("M1", "이용 준비", [
   ("UC01", "Gemini API Key 입력", "FN01", "J1", "D1-1",
    "components/start/api-key-form.tsx:F5 · lib/usecase/enter-with-api-key.ts:F1",
    ["A1"], []),
 ]),
 ("M3", "레시피 생성", [
   ("UC02", "음성 입력 레시피 생성", "FN03", "J2", "D1-1 · D1-3 · D4-1",
    "components/pick/voice-console.tsx:F6 · lib/usecase/plan-recipe.ts:F1",
    ["A1"], ["E2"]),
   ("UC03", "YouTube 링크 레시피 생성", "FN04", "J2", "D1-3 · D4-1 · D4-5",
    "lib/usecase/plan-recipe.ts:F8 · lib/domain/recipe.ts:F22",
    ["A1"], ["E1", "E2"]),
   ("UC04", "냉장고 재료 레시피 생성", "FN05", "J2", "D1-3 · D4-1",
    "lib/usecase/plan-recipe.ts:F12 · lib/usecase/plan-recipe.ts:F13",
    ["A1"], ["E2"]),
 ]),
 ("M4", "요리 진행", [
   ("UC05", "음성 기반 요리 진행", "FN06", "J2", "D1-1 · D1-2 · D1-3 · D4-2 · D4-7",
    "components/cook/live-console.tsx:F12 · lib/adapter/gemini-live-gateway.ts:F1",
    ["A1"], ["E2"]),
 ]),
 ("M7", "저장 레시피", [
   ("UC06", "저장 레시피 관리", "FN12", "J6", "D1-3 · D1-4",
    "lib/usecase/keep-recipe-shelf.ts:F7 · components/shelf/shelf-stand.tsx:F6",
    ["A1"], []),
 ]),
 ("M6", "AI 요리 상담", [
   ("UC07", "AI 요리 상담", "FN11", "J5", "D1-6 · D2-6 · D2-7 · D4-3 · D4-4",
    "components/ask/ask-shell.tsx:F8 · lib/usecase/ask-kitchen.ts:F1",
    ["A1"], ["E2", "E3"]),
   ("UC08", "후기 데이터 색인", "FN11", "확인 필요 (화면 없음)", "D4-4",
    "app/api/kitchen/index/route.ts:F1 · lib/adapter/langchain-rag.ts:F10",
    ["A3"], ["E3"]),
 ]),
 ("M2", "계정 · 프로필", [
   ("UC09", "로그인 · 회원가입", "FN02", "J1", "D2-1",
    "app/actions/auth.ts:F2 · lib/usecase/sign-in.ts:F1", ["A1"], ["E4"]),
   ("UC10", "프로필 관리", "FN10", "J7", "D2-1 · D3-2",
    "lib/usecase/rename-me.ts:F6 · lib/adapter/browser-avatar-upload.ts:F6",
    ["A2"], ["E4"]),
   ("UC11", "접근 권한 검사", "해당 없음 (J7)", "J7", "D2-1",
    "app/write/page.tsx:F4 · app/account/page.tsx:F3 · "
    "app/posts/[id]/edit/page.tsx:F3", [], ["E4"]),
 ]),
 ("M5", "커뮤니티", [
   ("UC12", "커뮤니티 목록 · 검색 · 태그", "FN13", "J3", "D2-1 · D2-2 · D3-1",
    "app/community/page.tsx:F1 · lib/domain/community-tab.ts:F8", ["A1"], ["E4"]),
   ("UC13", "게시글 작성 · 수정 · 삭제", "FN07", "J4 · J7", "D2-2 · D3-1",
    "app/actions/post.ts:F2 · lib/usecase/write-post.ts:F1", ["A2"], ["E4"]),
   ("UC14", "댓글", "FN08", "J3 · J7", "D2-5 · D1-5",
    "app/actions/post.ts:F17 · lib/usecase/discuss-post.ts:F11", ["A2"], ["E4"]),
   ("UC15", "좋아요 · 즐겨찾기", "FN09", "J3", "D2-3 · D2-4",
    "app/actions/post.ts:F25 · lib/usecase/react-to-post.ts:F2", ["A2"], ["E4"]),
   ("UC16", "표지 이미지 생성", "FN07", "J4", "D3-1",
    "components/write/write-form.tsx:F11 · lib/adapter/browser-cover-upload.ts:F3",
    [], ["E4"]),
 ]),
]

# 관계 — 근거가 확인된 것만
INCLUDES = [("UC13", "UC11"), ("UC15", "UC11"), ("UC10", "UC11")]
EXTENDS = [("UC16", "UC13")]
GENERALIZATIONS = [("A2", "A1")]

UC = {u[0]: (m[0], m[1]) + u for m in MODULES for u in m[2]}
ACTOR_NAME = {a[0]: a[1] for a in ACTORS}
EXT_NAME = {e[0]: e[1] for e in EXTERNALS}


# ══════════════════════════════════════════════════════════
# 그림
# ══════════════════════════════════════════════════════════
class UcChart(Chart):
    """유스케이스 표기법에 필요한 도형을 더한다."""

    def ellipse(self, cx, cy, rx, ry, uc, name):
        self.parts.append(
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#fff" '
            'stroke="#000" stroke-width="1.2"/>' % (cx, cy, rx, ry))
        self._seebox(cx, cy, rx * 2, ry * 2)
        self.text(cx, cy - 2, name, size=10.6, weight="bold")
        self.text(cx, cy + 12, uc, size=8.4, mono=True)

    def actor(self, cx, cy, name, sub):
        """졸라맨. UML 에서 행위자를 나타내는 표준 기호다."""
        h = 16
        p = self.parts.append
        p('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" stroke="#000" '
          'stroke-width="1.2"/>' % (cx, cy - h - 7, 7))
        p('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
          'stroke-width="1.2"/>' % (cx, cy - h, cx, cy + h * 0.5))
        p('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
          'stroke-width="1.2"/>' % (cx - 12, cy - h * 0.5, cx + 12, cy - h * 0.5))
        p('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
          'stroke-width="1.2"/>' % (cx, cy + h * 0.5, cx - 10, cy + h + 8))
        p('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
          'stroke-width="1.2"/>' % (cx, cy + h * 0.5, cx + 10, cy + h + 8))
        self._seebox(cx, cy, 30, 80)
        self.text(cx, cy + h + 24, name, size=10.6, weight="bold")
        if sub:
            self.text(cx, cy + h + 37, sub, size=8.2)

    def system(self, x0, y0, x1, y1, title):
        self.parts.append(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" '
            'stroke="#000" stroke-width="2"/>' % (x0, y0, x1 - x0, y1 - y0))
        self._see(x0, y0)
        self._see(x1, y1)
        self.text((x0 + x1) / 2, y0 + 24, title, size=14.0, weight="bold")

    def band(self, x0, y0, x1, y1, mid, name):
        self.parts.append(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" '
            'stroke="#888" stroke-width="0.8" stroke-dasharray="5 4"/>'
            % (x0, y0, x1 - x0, y1 - y0))
        self._see(x0, y0)
        self._see(x1, y1)
        self.text(x0 + 10, y0 + 15, "%s  %s" % (mid, name), size=9.6,
                  anchor="start", weight="bold")

    def assoc(self, p1, p2):
        """연관선 — 실선, 화살촉 없음."""
        self.parts.append(
            '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
            'stroke-width="0.9"/>' % (p1[0], p1[1], p2[0], p2[1]))
        self._see(*p1)
        self._see(*p2)

    def stereo(self, pts, label):
        """점선 화살표 + <<include>> / <<extend>>."""
        d = " ".join("%.1f,%.1f" % (x, y) for x, y in pts)
        self.parts.append(
            '<polyline points="%s" fill="none" stroke="#000" stroke-width="1" '
            'stroke-dasharray="6 4" marker-end="url(#open)"/>' % d)
        for x, y in pts:
            self._see(x, y)
        # 세로 구간의 가운데에 글자를 둔다. 끝점에 두면 대상이 같은 관계끼리 겹친다
        vx = pts[1][0]
        vy = (pts[1][1] + pts[2][1]) / 2
        side = "end" if vx < pts[0][0] else "start"
        self.text(vx + (-6 if side == "end" else 6), vy, label, size=8.4,
                  anchor=side, mono=True)

    def generalize(self, p1, p2):
        """일반화 — 빈 삼각형 화살촉이 상위 쪽을 가리킨다."""
        self.parts.append(
            '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
            'stroke-width="1.2" marker-end="url(#tri)"/>'
            % (p1[0], p1[1], p2[0], p2[1]))
        self._see(*p1)
        self._see(*p2)

    def svg(self, max_w_mm=None, max_h_mm=None, pad=26):
        x0, y0 = self.minx - pad, self.miny - pad
        w = (self.maxx - self.minx) + pad * 2
        h = (self.maxy - self.miny) + pad * 2
        defs = (
            '<defs>'
            '<marker id="open" viewBox="0 0 10 10" refX="9" refY="5" '
            'markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
            '<path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#000" '
            'stroke-width="1.4"/></marker>'
            '<marker id="tri" viewBox="0 0 12 12" refX="11" refY="6" '
            'markerWidth="12" markerHeight="12" orient="auto-start-reverse">'
            '<path d="M 0 0 L 12 6 L 0 12 z" fill="#fff" stroke="#000" '
            'stroke-width="1.2"/></marker></defs>')
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" '
                'width="%.0f" height="%.0f">%s'
                '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#fff"/>'
                '%s</svg>'
                % (x0, y0, w, h, w, h, defs, x0, y0, w, h, "".join(self.parts)))


def draw():
    c = UcChart()
    UCX, RX, RY = 375, 168, 26          # 유스케이스 타원
    BX0, BX1 = 0, 680                   # 시스템 경계
    GX0, GX1 = 150, 600                 # 모듈 띠 (관계선 채널을 밖에 둔다)
    HEAD, PITCH, PAD, GAP = 22, 62, 14, 22

    # ── 유스케이스 배치 ─────────────────────────────────
    y = 74                              # 시스템 이름 아래에서 시작
    pos, bands = {}, []
    for mid, mname, ucs in MODULES:
        top = y
        for i, u in enumerate(ucs):
            cy = top + HEAD + PAD + i * PITCH + RY
            c.ellipse(UCX, cy, RX, RY, u[0], u[1])
            pos[u[0]] = cy
        bot = top + HEAD + PAD + len(ucs) * PITCH
        bands.append((top, bot, mid, mname))
        y = bot + GAP
    for top, bot, mid, mname in bands:
        c.band(GX0, top, GX1, bot, mid, mname)
    c.system(BX0, 40, BX1, y - GAP + 22, SYSTEM_NAME)

    # ── 행위자 ─────────────────────────────────────────
    ay = {}
    for aid, name, sub in ACTORS:
        mine = [pos[u] for u in pos if aid in UC[u][8]]
        ay[aid] = sum(mine) / len(mine) if mine else (y / 2)
    # 겹치지 않게 최소 간격을 준다
    order = sorted(ay, key=lambda k: ay[k])
    for i in range(1, len(order)):
        ay[order[i]] = max(ay[order[i]], ay[order[i - 1]] + 150)
    AX = -280
    for aid, name, sub in ACTORS:
        c.actor(AX, ay[aid], name, sub)

    # ── 외부 시스템 ────────────────────────────────────
    ey = {}
    for eid, name, sub in EXTERNALS:
        mine = [pos[u] for u in pos if eid in UC[u][9]]
        ey[eid] = sum(mine) / len(mine) if mine else (y / 2)
    order = sorted(ey, key=lambda k: ey[k])
    for i in range(1, len(order)):
        ey[order[i]] = max(ey[order[i]], ey[order[i - 1]] + 150)
    EX = 900
    for eid, name, sub in EXTERNALS:
        c.actor(EX, ey[eid], name, sub)

    # ── 연관선 ─────────────────────────────────────────
    for uid, cy in pos.items():
        for aid in UC[uid][8]:
            c.assoc((AX + 22, ay[aid]), (UCX - RX - 4, cy))
        for eid in UC[uid][9]:
            c.assoc((UCX + RX + 4, cy), (EX - 22, ey[eid]))

    # ── include · extend · 일반화 ──────────────────────
    # 관계마다 채널을 따로 준다. 한 채널에 몰면 선이 겹쳐 네모처럼 보인다
    for i, (src, dst) in enumerate(INCLUDES):
        ch = UCX - RX - 70 - i * 30
        c.stereo([(UCX - RX, pos[src]), (ch, pos[src]), (ch, pos[dst]),
                  (UCX - RX, pos[dst])], "<<include>>")
    for i, (src, dst) in enumerate(EXTENDS):
        ch2 = UCX + RX + 36 + i * 30
        c.stereo([(UCX + RX, pos[src]), (ch2, pos[src]), (ch2, pos[dst]),
                  (UCX + RX, pos[dst])], "<<extend>>")
    gx = AX - 130
    for sub, sup in GENERALIZATIONS:
        # 하위 행위자에서 나가 왼쪽 채널을 타고 올라간다. 화살촉은 상위 쪽에 하나만
        c.assoc((AX - 24, ay[sub]), (gx, ay[sub]))
        c.assoc((gx, ay[sub]), (gx, ay[sup]))
        c.generalize((gx, ay[sup]), (AX - 26, ay[sup]))
        c.text(gx - 8, (ay[sub] + ay[sup]) / 2, "일반화", size=9.0, anchor="end")

    # ── 범례 ───────────────────────────────────────────
    ly = y + 26
    c.text(BX0, ly, "표기 — 졸라맨: 행위자 · 타원: 유스케이스 · 굵은 사각형: "
                    "시스템 경계 · 점선 사각형: 모듈", size=9.4, anchor="start")
    c.text(BX0, ly + 15, "        실선: 연관 · 점선 화살표: <<include>> · "
                         "<<extend>> · 빈 삼각형: 일반화", size=9.4, anchor="start")
    return c.svg()


# ══════════════════════════════════════════════════════════
# Mermaid
# ══════════════════════════════════════════════════════════
def mermaid():
    L = ["flowchart LR", ""]
    for aid, name, _ in ACTORS:
        L.append('    %s["👤 %s"]' % (aid, name))
    L.append("")
    for mid, mname, ucs in MODULES:
        L.append('    subgraph %s["%s  %s"]' % (mid, mid, mname))
        L.append("        direction TB")
        for u in ucs:
            L.append('        %s(["%s<br/>%s"])' % (u[0], u[0], u[1]))
        L.append("    end")
    L.append("")
    for eid, name, _ in EXTERNALS:
        L.append('    %s["🖥 %s"]' % (eid, name))
    L.append("")
    L.append("    %% 연관")
    for mid, mname, ucs in MODULES:
        for u in ucs:
            for aid in u[6]:
                L.append("    %s --- %s" % (aid, u[0]))
    L.append("")
    L.append("    %% 외부 시스템")
    for mid, mname, ucs in MODULES:
        for u in ucs:
            for eid in u[7]:
                L.append("    %s --> %s" % (u[0], eid))
    L.append("")
    L.append("    %% include · extend · 일반화")
    for a, b in INCLUDES:
        L.append("    %s -. \"&lt;&lt;include&gt;&gt;\" .-> %s" % (a, b))
    for a, b in EXTENDS:
        L.append("    %s -. \"&lt;&lt;extend&gt;&gt;\" .-> %s" % (a, b))
    for sub, sup in GENERALIZATIONS:
        L.append("    %s -- 일반화 --> %s" % (sub, sup))
    return "\n".join(L)


# ══════════════════════════════════════════════════════════
# 매핑표 · 문서
# ══════════════════════════════════════════════════════════
def rows():
    for mid, mname, ucs in MODULES:
        for u in ucs:
            uid, name, fn, j, d, ev, acts, exts = u
            actors = " · ".join(ACTOR_NAME[a] for a in acts) or "— (관계로만 연결)"
            yield (uid, name, actors, fn, mid,
                   " · ".join(EXT_NAME[e] for e in exts) or "없음", j, d, ev)


def document(svg_name):
    t = ["# CookPilot Use Case Diagram", "",
         "사용자가 CookPilot 에서 무엇을 할 수 있고, 각 기능이 어떤 외부 시스템과",
         "관계를 가지는지 보여준다. 함수명 · 파일 경로 · 테이블 이름은 넣지 않는다.",
         "그 정보는 `docs/spec/CookPilot_기능명세서_HIPO.xlsx` 와",
         "`docs/flow/flow.md` 가 갖고 있다.", "",
         "| 산출물 | 파일 |", "| --- | --- |",
         "| 다이어그램 | `docs/usecase/%s` · `.png` |" % svg_name,
         "| Mermaid | 이 문서의 아래 절 |",
         "| 매핑표 | 이 문서의 아래 절 |", "",
         "---", "", "## 행위자", "",
         "| ID | 행위자 | 근거 |", "| --- | --- | --- |",
         "| A1 | 비로그인 사용자 | `/pick` · `/shop` · `/cook` · `/shelf` · `/ask` · "
         "`/community` 에 접근 제한이 없다 |",
         "| A2 | 로그인 사용자 | `app/write/page.tsx:F4` · `app/account/page.tsx:F3` · "
         "`app/posts/[id]/edit/page.tsx:F3` 이 인증을 요구한다 |",
         "| A3 | 운영자 | `app/api/kitchen/index/route.ts:F1` — 사용자 화면이 없는 "
         "운영 작업 |",
         "| E1 | YouTube | `lib/domain/recipe.ts:F30` 썸네일 · 영상 URL 을 모델에 전달 |",
         "| E2 | Gemini | `lib/adapter/gemini-recipe-gateway.ts:F5` · "
         "`gemini-live-gateway.ts:F1` · `langchain-rag.ts:F29` |",
         "| E3 | Pinecone | `lib/adapter/langchain-rag.ts:F28` · `F10` |",
         "| E4 | Supabase | `lib/adapter/supabase-server-client.ts:F3` 외 |", "",
         "**행위자가 아닌 것** — localStorage · Supabase 테이블 · 서버 액션 · ",
         "라우트 핸들러 · React 컴포넌트는 구현 계층이라 넣지 않았다.",
         "쇼핑몰 검색(D4-6)은 CookPilot 이 호출하지 않고 사용자가 새 창으로 여는",
         "이동이라 행위자에서 뺐다. 브라우저 음성 합성(D4-7)은 내장 기능이라 뺐다.", "",
         "### 일반화", "",
         "`A2 로그인 사용자` ─▷ `A1 비로그인 사용자`", "",
         "권한이 다르기 때문이 아니라, **A1 이 쓰는 유스케이스에 인증 검사가 하나도",
         "없어서 A2 도 그대로 쓸 수 있음이 코드에서 확인**되기 때문이다.", "",
         "---", "", "## include · extend", "",
         "| 관계 | 내용 | 근거 |", "| --- | --- | --- |",
         "| `UC13` `UC15` `UC10` → `UC11` `<<include>>` | 모든 실행 경로에서 접근 "
         "권한 검사를 거친다 | `app/write/page.tsx:F4` · "
         "`components/post/post-actions.tsx:F5` · `app/account/page.tsx:F3` |",
         "| `UC16` → `UC13` `<<extend>>` | 표지 이미지는 선택이다. 없어도 게시글이 "
         "올라간다 | `components/write/write-form.tsx:F11` |", "",
         "**`UC14 댓글` 에는 include 를 걸지 않았다.** 게시글 댓글은 인증을 거치지만",
         "예시 게시글 댓글은 브라우저에만 저장되어 인증 없이 동작한다",
         "(`components/post/post-talk.tsx:F5`). 모든 경로에서 수행되지 않으므로",
         "`<<include>>` 조건에 맞지 않는다.", "",
         "---", "", "## Mermaid", "", "```mermaid", mermaid(), "```", "",
         "---", "", "## 매핑표", "",
         "| Use Case ID | Use Case명 | Actor | 기능 ID | 모듈 ID | 외부 시스템 | "
         "관련 화면 | 관련 데이터 | 근거 |",
         "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows():
        t.append("| %s | %s | %s | %s | %s | %s | %s | %s | `%s` |" % r)
    t += ["", "---", "", "## 확인 필요", "",
          "| 항목 | 내용 |", "| --- | --- |",
          "| `UC08` 관련 화면 | 후기 데이터 색인은 사용자 화면이 없다. "
          "`POST /api/kitchen/index` 로만 실행한다 |",
          "| `UC08` 접근 제한 | 이 라우트에 인증 검사가 없다. 누구나 호출할 수 있다 |",
          "| 관리자 화면 | 코드에 없다. `A3 운영자` 는 화면이 아니라 라우트로만 "
          "상호작용한다 |", "",
          "---", "", "## 이름이 FN 과 다른 3건", "",
          "기능 ID 는 그대로 두고 이름만 유스케이스에 맞게 줄이거나 나눴다.", "",
          "| Use Case | 기능 | 왜 다른가 |", "| --- | --- | --- |",
          "| `UC07` AI 요리 상담 | `FN11` AI 요리 상담 (RAG) | RAG 는 구현 기술이라 "
          "유스케이스 이름에서 뺐다 |",
          "| `UC08` 후기 데이터 색인 | `FN11` AI 요리 상담 (RAG) | 같은 기능이지만 "
          "행위자가 `A3 운영자` 로 다르고 사용자 화면이 없다 |",
          "| `UC16` 표지 이미지 생성 | `FN07` 게시글 작성 · 수정 · 삭제 | 선택 단계라 "
          "`<<extend>>` 로 떼어 냈다 |", "",
          "나머지 13건은 `docs/flow/flow.md` 의 기능명을 그대로 쓴다.", ""]
    return "\n".join(t)


if __name__ == "__main__":
    svg = draw()
    name = "CookPilot_UseCase_Diagram.svg"
    io.open(os.path.join(OUT_DIR, name), "w", encoding="utf-8").write(svg)
    io.open(os.path.join(OUT_DIR, "usecase.md"), "w",
            encoding="utf-8").write(document(name))
    print("유스케이스 %d개 / 모듈 %d개 / 행위자 %d + 외부 %d"
          % (len(UC), len(MODULES), len(ACTORS), len(EXTERNALS)))
    print("wrote", os.path.join(OUT_DIR, name))
    print("wrote", os.path.join(OUT_DIR, "usecase.md"))
