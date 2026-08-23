# -*- coding: utf-8 -*-
"""전체 흐름 지도의 도형 3종 (3장 2장 · 4장 1장)."""
from chart import Chart


# ── 세로로 쌓는 작은 도우미 ────────────────────────────────
class Col:
    """한 세로줄에 도형을 위에서 아래로 쌓는다."""

    W = 214
    DW, DH = 200, 88

    def __init__(self, c, x, y, gap=34):
        self.c, self.x, self.y, self.gap = c, x, y, gap
        self.last = None

    def _h(self, shape, lines, sub):
        if shape == "dec":
            return self.DH
        return max(36.0, 14.0 + 15.0 * len(lines) + (11.0 if sub else 0.0))

    def _put(self, shape, cx, cy, w, h, lines, sub, size=10.0):
        if shape == "dec":
            self.c.dec(cx, cy, w, h, lines, sub, size=9.4)
        else:
            {"proc": self.c.box, "term": self.c.term, "io": self.c.io,
             "pre": self.c.pre, "cyl": self.c.cyl}[shape](
                cx, cy, w, h, lines, sub, size=size, subsize=7.6)

    def node(self, shape, lines, sub=None, edge=None, gap=None, size=10.0):
        g = self.gap if gap is None else gap
        w = self.DW if shape == "dec" else self.W
        h = self._h(shape, lines, sub)
        if self.last:
            top = self.last[0] + self.last[1] / 2
            self.c.vline(self.x, top, top + g, edge)
            cy = top + g + h / 2
        else:
            cy = self.y + h / 2
        self._put(shape, self.x, cy, w, h, lines, sub, size)
        self.last = (cy, h, w)
        return cy

    def side(self, sidech, label, shape, lines, sub=None, dy=0, off=290, size=10.0):
        cy0, h0, w0 = self.last
        cy = cy0 + dy
        w = self.DW if shape == "dec" else self.W
        h = self._h(shape, lines, sub)
        cx = self.x + (off if sidech == "r" else -off)
        self._put(shape, cx, cy, w, h, lines, sub, size)
        if sidech == "r":
            x1, x2 = self.x + w0 / 2, cx - w / 2
        else:
            x1, x2 = self.x - w0 / 2, cx + w / 2
        # 갈래가 둘 이상이면 글자가 한자리에 겹친다. dy 가 있으면 목표 쪽에 붙인다
        ly = cy - 6 if dy else cy0 - 5
        lx = (x1 * 2 + x2) / 3 if dy else (x1 + x2) / 2
        self.c.arrow([(x1, cy0), (x2, cy)], label, lx, ly, anchor="middle")
        return cy

    def conn(self, ch, gap=None, edge=None):
        g = self.gap if gap is None else gap
        top = self.last[0] + self.last[1] / 2
        self.c.vline(self.x, top, top + g, edge)
        cy = top + g + 17
        self.c.conn(self.x, cy, 17, ch)
        self.last = (cy, 34, 34)
        return cy


def head(c, x, y, txt):
    c.text(x, y, txt, size=12.5, weight="bold")


# ══════════════════════════════════════════════════════════
# 3장 지도 ① — J1 진입 · J2 주요 요리 흐름 · J7 접근 권한 검사
# ══════════════════════════════════════════════════════════
def journey_1():
    c = Chart()
    XA, XB, XC = 0, 620, 1240

    # ── J1 진입 ──────────────────────────────────────────
    head(c, XA, -34, "J1  진입 — 소개 화면에서 API Key 입력까지")
    a = Col(c, XA, 0)
    a.node("term", ["서비스 진입"])
    a.node("proc", ["/  소개 화면"], "app/page.tsx")
    a.side("l", "커뮤니티", "proc", ["/community"], "홈 · 목록", off=268)
    a.node("proc", ["/login"], "app/login/page.tsx", edge="로그인 이동")
    a.side("l", "계정 미보유", "proc", ["/signup"], "회원가입", off=268)
    a.node("io", ["이메일 · 비밀번호"], "login-form.tsx")
    a.node("pre", ["signInAction()"], "app/actions/auth.ts:F2")
    a.node("dec", ["인증 성공?"], "auth.ts:F5")
    a.side("l", "[false]", "proc", ["현재 화면에서 오류 표시"], "화면 이동 없음", off=268)
    a.node("proc", ["/start"], "auth.ts:F7  redirect", edge="[true]")
    a.node("io", ["Gemini API Key 입력"], "start/api-key-form.tsx:F5")
    a.node("dec", ["저장 성공?"], "enter-with-api-key:F3")
    a.side("l", "[false]", "proc", ["현재 화면에서 오류 표시"], None, off=268)
    a.conn("A", edge="[true]")

    # ── J2 주요 요리 흐름 ───────────────────────────────────────
    head(c, XB, -34, "J2  주요 요리 흐름 — 홈에서 요리 완료까지")
    c.conn(XB, 17, 17, "A")
    b = Col(c, XB, 0)
    b.last = (17, 34, 34)
    b.node("proc", ["/community  (홈)"], "app/community/page.tsx")
    b.node("dec", ["API Key 존재?"], "home-me:F7")
    b.side("r", "[false]", "proc", ["/start"], "router.push", off=290)
    b.node("dec", ["음성 모델 선택됨?"], "home-me:F8", edge="[true]")
    b.side("r", "[false]", "proc", ["/start/model"], "setup-picker:F15 → /pick",
           off=290)
    b.node("proc", ["/pick"], "pick-shell · voice-console", edge="[true]")
    b.node("proc", ["/shop   장보기 목록 확인"],
           "shop-shell.tsx  router.push")
    b.node("proc", ["/cook   음성 기반 요리 진행"], "cook-shell.tsx  router.push")
    b.node("proc", ["/cook/done   요리 완료"], "done-shell.tsx")
    b.side("r", "게시글 작성", "proc", ["/write?from=cook"], "→ J4", off=290, dy=-34)
    b.side("r", "레시피 저장", "proc", ["/shelf"], "→ J6", off=290, dy=34)
    b.node("proc", ["/pick   다음 요리 선택"], "done-shell.tsx  forgetDraft → push", edge="다음 요리")

    # ── J7 접근 권한 검사 ─────────────────────────────────────────
    head(c, XC, -34, "J7  접근 권한 검사 (세 화면 공통)")
    d = Col(c, XC, 0)
    d.node("term", ["/write · /account", "/posts/[id]/edit 진입"])
    d.node("dec", ["로그인 상태?"], "write/page.tsx:F4")
    d.side("r", "[true]", "proc", ["요청 화면 렌더링"], None, off=278)
    d.node("proc", ["redirect", "/login?next=<원래 주소>"], None, edge="[false]")
    d.node("proc", ["/login"], "app/login/page.tsx")
    d.node("proc", ["로그인 성공"], "auth.ts:F7")
    d.node("proc", ["/start 이동"], "?next= 미사용")
    c.box(XC, d.last[0] + 96, 300, 62,
          ["확인된 사실: ?next= 는 URL 에 부착되지만",
           "/login 에서 읽는 코드가 없다. 로그인 후에는",
           "원래 화면이 아니라 항상 /start 로 이동한다."], size=9.0)
    return c.svg(max_w_mm=273, max_h_mm=163)


# ══════════════════════════════════════════════════════════
# 3장 지도 ② — J3 커뮤니티 · J4 글 · J5 챗봇 · J6 서재
# ══════════════════════════════════════════════════════════
def journey_2():
    c = Chart()
    XA, XB, XC = 0, 620, 1240

    head(c, XA, -34, "J3  커뮤니티 · 게시글 조회")
    a = Col(c, XA, 0)
    a.node("term", ["/community"], "app/community/page.tsx")
    a.node("io", ["?tab= · ?q= (검색어)"], "community-tab:F1 · F5")
    a.node("proc", ["게시글 목록"], "post-cards.tsx:F1")
    a.side("l", "태그", "proc", ["/community?q=<태그>"], "tag-link.tsx", off=270)
    a.node("proc", ["/posts/[id]"], "post-article · live-post-view")
    a.node("dec", ["본인 게시글?"], "post-actions.tsx")
    a.side("l", "[true]", "proc", ["/posts/[id]/edit"], "→ J4", off=270)
    a.node("dec", ["API Key 존재?"], "post/cook-this.tsx  onStart()", edge="이 레시피로 요리")
    a.side("l", "[false]", "proc", ["/start"], None, off=270)
    a.node("proc", ["/shop"], "cook-this.tsx → J2 합류", edge="[true]")

    head(c, XB, -34, "J4  게시글 작성 · 수정 · 삭제")
    b = Col(c, XB, 0)
    b.node("term", ["/write?from=cook", "또는 /posts/[id]/edit"], "write-form.tsx")
    b.node("io", ["제목 · 한 줄 설명 · 본문", "카테고리(태그) · 표지 이미지"], None)
    b.node("dec", ["신규 게시글?"], "write-form.tsx:F2")
    b.side("r", "[false] 수정", "pre", ["revisePostAction()"],
           "app/actions/post.ts:F10", off=290)
    b.node("pre", ["publishPostAction()"], "app/actions/post.ts:F2", edge="[true]")
    b.node("dec", ["테이블 반영 성공?"], "post.ts:F4 · F12")
    b.side("r", "[false]", "proc", ["폼에 오류 표시", "화면 이동 없음"], None, off=290)
    b.node("proc", ["/posts/<id>"], "post.ts:F6 · F13  redirect", edge="[true]")
    b.node("proc", ["/community"], "post.ts:F16  redirect", edge="삭제")

    head(c, XC, -34, "J5 AI 요리 상담 · J6 저장 레시피 · J7 계정")
    d = Col(c, XC, 0, gap=30)
    d.node("term", ["/community  (홈)"])
    d.side("r", "설정", "proc", ["/account"], "표시 이름 · 프로필 이미지 · API Key",
           off=282)
    d.node("proc", ["/ask   AI 요리 상담"], "ask-shell.tsx", edge="AI 요리 상담")
    d.node("proc", ["질문 → 응답 · 근거 후기", "화면 화면 이동 없음"], "▷ POST /api/chat")
    d.node("proc", ["/shelf   저장 레시피 조회"], "shelf-stand.tsx", edge="저장 레시피")
    d.node("dec", ["레시피 데이터 포함?"], "shelf-stand:F6")
    d.side("r", "[false]", "proc", ["항목 비활성화"], "구버전 항목", off=282)
    d.node("proc", ["/shop"], "shelf-stand:F7 → J2 합류", edge="[true]")
    return c.svg(max_w_mm=273, max_h_mm=163)


# ══════════════════════════════════════════════════════════
# 4장 시스템 전체 흐름
# ══════════════════════════════════════════════════════════
def system_map():
    c = Chart()
    BW, BH = 250, 66
    X1, X2, X3 = 0, 560, 1120          # 브라우저 · 서버 · 바깥
    YS3, YS4, YS5 = -270, 0, 270       # Supabase · Gemini · Pinecone

    c.box(X1, 0, BW, BH, ["S1  Browser"], "화면 · 마이크 · 캔버스", size=12.0)
    c.box(X2, 0, BW, BH, ["S2  Next Server"], "라우트 · 서버 액션", size=12.0)
    c.box(X3, YS3, BW, BH, ["S3  Supabase"], "계정 · 테이블 · 스토리지", size=12.0)
    c.box(X3, YS4, BW, BH, ["S4  Gemini"], "레시피 · 실시간 음성 · 응답", size=12.0)
    c.box(X3, YS5, BW, BH, ["S5  Pinecone"], "후기 벡터", size=12.0)
    c.cyl(X1, 300, BW, 76, ["브라우저 저장소"], "localStorage (D1)", size=11.0)

    # ── S1 ↔ S2 ───────────────────────────────────────────
    c.arrow([(X1 + BW / 2, -14), (X2 - BW / 2, -14)])
    c.text((X1 + X2) / 2, -34, "화면 요청 · 서버 액션", size=9.4)
    c.text((X1 + X2) / 2, -22, "POST /api/chat (질문 + 브라우저 보관 Key)", size=9.4)
    c.arrow([(X2 - BW / 2, 14), (X1 + BW / 2, 14)])
    c.text((X1 + X2) / 2, 30, "렌더링 결과 · 응답 · 근거 후기", size=9.4)

    # ── S2 → S3 · S4 · S5 ─────────────────────────────────
    c.arrow([(X2, -BH / 2), (X2, YS3), (X3 - BW / 2, YS3)])
    c.text((X2 + X3) / 2, YS3 - 8, "계정 · 게시글 · 댓글 · 좋아요 · 프로필 조회 · 기록",
           size=9.4)
    c.arrow([(X2 + BW / 2, 0), (X3 - BW / 2, YS4)])
    c.text((X2 + X3) / 2, -8, "검색 결과 기반 응답 생성", size=9.4)
    c.arrow([(X2, BH / 2), (X2, YS5), (X3 - BW / 2, YS5)])
    c.text((X2 + X3) / 2, YS5 - 8, "후기 벡터 검색 · 색인", size=9.4)

    # ── 서버 우회 ① 브라우저 ▷ 제미나이 (가장 바깥으로 돌린다) ──
    c.arrow([(X1 - 60, -BH / 2), (X1 - 60, -470), (X3 + 210, -470),
             (X3 + 210, YS4), (X3 + BW / 2, YS4)], dash=True)
    c.text((X1 + X3) / 2, -478,
           "▷ 서버 우회 ①   레시피 생성 REST · 실시간 음성 WebSocket   "
           "— Gemini Key 가 브라우저에만 저장되어 서버가 접근할 수 없다", size=9.6)

    # ── 서버 우회 ② 브라우저 ▷ 스토리지 (S3 위로 들어간다) ──
    c.arrow([(X1 + 60, -BH / 2), (X1 + 60, -380), (X3, -380),
             (X3, YS3 - BH / 2)], dash=True)
    c.text((X1 + X3) / 2 + 30, -388,
           "▷ 서버 우회 ②   스토리지 이미지 업로드 (post-covers · avatars)",
           size=9.6)

    # ── 서버 우회 ③ 브라우저 ▷ localStorage ────────────────
    c.arrow([(X1, BH / 2), (X1, 300 - 38)], dash=True)
    c.text(X1 + 10, 170, "▷ 서버 우회 ③", size=9.6, anchor="start")
    c.text(X1 + 10, 182, "API Key · 레시피 · 저장 레시피 · 음성 설정", size=9.6, anchor="start")

    c.box(X2 + 80, 430, 660, 74,
          ["코드에서 확인되지 않는 연결 — 표시하지 않음",
           "S3 Supabase ↔ S4 Gemini   ·   S3 Supabase ↔ S5 Pinecone   ·   "
           "S5 Pinecone → S1 Browser 직접",
           "Pinecone 은 Next Server 만 호출하고, Supabase 는 외부 모델을 호출하지 않는다."],
          size=9.6)
    return c.svg(max_w_mm=273, max_h_mm=160)
