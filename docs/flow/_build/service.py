# -*- coding: utf-8 -*-
"""지도 A · B · C — 사용자 흐름 / 기능·데이터 구조 / 인증·오류·독립 기능."""
from chart import Chart


# ── 공통 도구 ─────────────────────────────────────────────
def panel(c, cx, top, w, title, rows, sub=None, rowh=15.5, pad=10):
    """제목줄이 있는 컨테이너. rows 는 (왼쪽, 가운데, 오른쪽) 세 칸."""
    head = 26 if not sub else 36
    h = head + len(rows) * rowh + pad
    x0 = cx - w / 2
    c.parts.append(
        '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#fff" '
        'stroke="#000" stroke-width="1.3"/>' % (x0, top, w, h))
    c._see(x0, top)
    c._see(x0 + w, top + h)
    c.text(x0 + 12, top + 17, title, size=10.4, anchor="start", weight="bold")
    if sub:
        c.text(x0 + w - 12, top + 17, sub, size=8.4, anchor="end")
    c.parts.append(
        '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
        'stroke-width="0.7"/>' % (x0, top + head - 6, x0 + w, top + head - 6))
    for i, row in enumerate(rows):
        y = top + head + 10 + i * rowh
        a, b, d = row
        c.text(x0 + 14, y, a, size=8.4, anchor="start", mono=True)
        if b:
            c.text(x0 + w * 0.50, y, b, size=8.2, anchor="start")
        if d:
            c.text(x0 + w - 14, y, d, size=8.2, anchor="end")
    return h


def group(c, x0, y0, x1, y1, title):
    """옅은 테두리로 묶는 영역."""
    c.parts.append(
        '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" '
        'stroke="#000" stroke-width="0.7" stroke-dasharray="6 4"/>'
        % (x0, y0, x1 - x0, y1 - y0))
    c._see(x0, y0)
    c._see(x1, y1)
    c.text(x0 + 8, y0 - 8, title, size=9.6, anchor="start", weight="bold")


def xmark(c, x, y, r=7):
    for a, b in (((-r, -r), (r, r)), ((-r, r), (r, -r))):
        c.parts.append(
            '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
            'stroke-width="2"/>' % (x + a[0], y + a[1], x + b[0], y + b[1]))
    c._see(x - r, y - r)
    c._see(x + r, y + r)


# ══════════════════════════════════════════════════════════
# 지도 A — 사용자 주요 흐름
# ══════════════════════════════════════════════════════════
def map_a():
    c = Chart()
    MX, DX, LX = 0, 400, 560       # 흐름 / 데이터 / 되돌아가는 선
    MW, DW = 250, 200
    BH, PITCH = 36, 46

    def row(i):
        return i * PITCH + (18 if i >= 4 else 0) + (24 if i >= 5 else 0)

    def step(i, shape, label, pid=None):
        y = row(i)
        h = 52 if shape == "dec" else BH
        w = 230 if shape == "dec" else MW
        if shape == "dec":
            c.dec(MX, y, w, h, [label], None, size=10.0)
        elif shape == "term":
            c.term(MX, y, w, h, [label], None, size=10.6)
        else:
            c.box(MX, y, w, h, [label], None, size=10.6)
        if pid:
            c.text(MX - MW / 2 - 10, y + 4, pid, size=10.0, anchor="end",
                   weight="bold")
        return y

    def link(i, j, label=None):
        y1 = row(i) + (26 if i == 3 else BH / 2)
        y2 = row(j) - (26 if j == 3 else BH / 2)
        c.vline(MX, y1, y2, label)

    def store(i, label, mode):
        """데이터 계층 한 칸. mode 는 저장 / 읽기 / 삭제."""
        y = row(i)
        c.cyl(DX, y, DW, 38, [label], None, size=9.8)
        if mode == "읽기":
            c.arrow([(DX - DW / 2, y), (MX + MW / 2 + 4, y)], "읽기",
                    (DX - DW / 2 + MX + MW / 2) / 2, y - 6, anchor="middle")
        else:
            c.arrow([(MX + MW / 2, y), (DX - DW / 2 - 4, y)], mode,
                    (DX - DW / 2 + MX + MW / 2) / 2, y - 6, anchor="middle")
        if mode == "삭제":
            xmark(c, DX + DW / 2 + 16, y)

    c.text(MX, -46, "사용자 흐름", size=11.0, weight="bold")
    c.text(DX, -46, "데이터 계층", size=11.0, weight="bold")

    step(0, "term", "CookPilot 시작", "P1")
    link(0, 1)
    step(1, "proc", "Gemini API Key 입력", "P2")
    store(1, "D1-1  API Key", "저장")
    link(1, 2)
    step(2, "proc", "음성 모델 선택", "P3")
    store(2, "D1-2  Cook Setup", "저장")
    link(2, 3)
    step(3, "dec", "레시피 입력 방식 선택")

    # 입력 방식 세 갈래 → 직각으로 뻗고 직각으로 모은다
    y3, y4, y5 = row(3), row(4), row(5)
    ybus = y4 + BH / 2 + 22
    fan = [(-280, "음성 입력", "FN03"), (0, "YouTube 링크", "FN04"),
           (280, "냉장고 재료", "FN05")]
    for fx, name, fn in fan:
        c.box(fx, y4, 226, BH, [name], None, size=10.4)
        c.text(fx - 115, y4 - 32, fn, size=8.8, anchor="start", weight="bold")
        if fx == 0:
            c.arrow([(0, y3 + 26), (0, y4 - BH / 2)])
            c.plain([(0, y4 + BH / 2), (0, ybus)])
        else:
            vx = -115 if fx < 0 else 115
            c.arrow([(vx, y3), (fx, y3), (fx, y4 - BH / 2)])
            c.plain([(fx, y4 + BH / 2), (fx, ybus), (0, ybus)])
    c.arrow([(0, ybus), (0, y5 - BH / 2)])

    step(5, "proc", "레시피 생성", "P4")
    store(5, "D1-3  Recipe Draft", "저장")
    link(5, 6)
    step(6, "proc", "장보기 목록 확인", "P5")
    store(6, "D1-3  Recipe Draft", "읽기")
    link(6, 7)
    step(7, "proc", "음성 기반 요리 진행", "P6")
    store(7, "D1-2 · D1-3", "읽기")
    link(7, 8)
    step(8, "proc", "요리 완료", "P7")
    store(8, "D1-4  Recipe Shelf", "저장 (선택)")
    link(8, 9)
    step(9, "proc", "임시 레시피 삭제")
    store(9, "D1-3  Recipe Draft", "삭제")
    link(9, 10)
    step(10, "term", "다음 요리 선택", "P8")

    # 되돌아가는 선 — 오른쪽 채널로 한 줄만
    c.arrow([(MW / 2, row(10)), (LX, row(10)), (LX, y3), (115, y3)])
    c.text(LX + 8, (row(10) + y3) / 2, "반복", size=9.0, anchor="start")
    return c.svg(max_w_mm=273, max_h_mm=116)


# ══════════════════════════════════════════════════════════
# 지도 B — 기능 / 데이터 구조
# ══════════════════════════════════════════════════════════
STORES = [
    ("Browser Storage", "브라우저 localStorage · 서버로 전송하지 않음",
     "FN01 · FN03 · FN04 · FN05 · FN06 · FN08 · FN11 · FN12 · FN13",
     [("D1-1  Gemini API Key", "쓰기 FN01", "읽기 FN03·04·05·06·11·13"),
      ("D1-2  Cook Setup", "쓰기 기능 목록 외 공통 단계", "읽기 FN06 · FN13"),
      ("D1-3  Recipe Draft", "쓰기 FN03·04·05 · FN12", "읽기 FN06 · FN07"),
      ("D1-4  Recipe Shelf", "쓰기 FN12", "읽기 FN12 · FN13"),
      ("D1-5  Comments", "쓰기 FN08", "읽기 FN08"),
      ("D1-6  Chat ID", "쓰기 FN11", "읽기 FN11")]),
    ("External API", "▷ 외부 시스템",
     "FN03 · FN04 · FN05 · FN06 · FN11",
     [("D4-1  Gemini REST", "브라우저 직접 호출", "FN03 · FN04 · FN05"),
      ("D4-2  Gemini Live WebSocket", "브라우저 직접 호출", "FN06"),
      ("D4-3  Gemini 응답 생성", "Next Server 호출", "FN11"),
      ("D4-4  Pinecone 벡터 검색", "Next Server 호출", "FN11"),
      ("D4-5  i.ytimg.com 썸네일", "브라우저 직접 조회", "FN04"),
      ("D4-6  쇼핑몰 검색 URL", "새 창으로 열기", "FN03 계열 /shop"),
      ("D4-7  speechSynthesis", "브라우저 내장", "FN06")]),
    ("Supabase", "PostgreSQL · 접근 권한은 RLS 정책이 판정",
     "FN02 · FN07 · FN08 · FN09 · FN10 · FN11 · FN13",
     [("D2-1  profiles", "쓰기 FN02(트리거) · FN10", "읽기 FN07 · FN08 · FN13"),
      ("D2-2  posts", "쓰기 FN07", "읽기 FN08 · FN09 · FN13"),
      ("D2-3  post_likes", "쓰기 FN09", "읽기 FN09"),
      ("D2-4  post_bookmarks", "쓰기 FN09", "읽기 FN09"),
      ("D2-5  post_comments", "쓰기 FN08", "읽기 FN08"),
      ("D2-6  chats", "쓰기 FN11", "읽는 위치 확인 필요"),
      ("D2-7  messages", "쓰기 FN11", "읽기 FN11")]),
    ("Supabase Storage", "브라우저에서 직접 업로드",
     "FN07 · FN10",
     [("D3-1  post-covers", "쓰기 FN07", "읽기 FN07 · FN13"),
      ("D3-2  avatars", "쓰기 FN10", "읽기 FN07 · FN08 · FN13")]),
]


def map_b():
    c = Chart()
    LX, RX, LW, RW = 0, 700, 300, 760
    top = 0
    c.text(LX, -42, "접근 기능", size=11.0, weight="bold")
    c.text(RX, -42, "저장 위치", size=11.0, weight="bold")
    for title, sub, fns, rows in STORES:
        h = panel(c, RX, top, RW, title, rows, sub=sub)
        mid = top + h / 2
        c.box(LX, mid, LW, 52, [fns], None, size=8.6)
        c.arrow([(LX + LW / 2, mid), (RX - RW / 2 - 4, mid)])
        top += h + 26
    return c.svg(max_w_mm=273, max_h_mm=160)


# ══════════════════════════════════════════════════════════
# 지도 C — 독립 기능 / 로그인 경계 / 오류 처리
# ══════════════════════════════════════════════════════════
def map_c1():
    """C-1 독립 기능 + C-2 로그인 경계."""
    c = Chart()
    GL, GR = -180, 1000

    # ── C-1 독립 기능 ─────────────────────────────────────
    group(c, GL, -34, GR, 296, "C-1  독립 기능 — 주요 요리 흐름과 분리")
    c.box(-40, 112, 240, 54, ["주요 요리 흐름"], "P1 – P8", size=10.6,
          subsize=8.4)
    ind = [("P9", "AI 요리 상담", "FN11", 24, "D1-6 · D2-6 · D2-7"),
           ("P10", "저장 레시피 조회", "FN12", 112, "D1-4 조회 → D1-3 기록"),
           ("P11", "커뮤니티 게시글 조회", "FN13", 200, "D2-2 조회")]
    for pid, name, fn, y, data in ind:
        c.box(560, y, 330, 54, [name], None, size=10.6)
        c.text(400, y - 36, pid, size=9.8, anchor="start", weight="bold")
        c.text(720, y - 36, fn, size=9.0, anchor="end", mono=True)
        c.text(560, y + 18, data, size=8.6)
        c.arrow([(80, 112), (230, 112), (230, y), (395, y)])
        c.text(950, y + 4, "로그인 불필요", size=9.0, anchor="end")
    c.plain([(725, 112), (790, 112), (790, 268)])
    c.arrow([(790, 268), (-40, 268), (-40, 139)])
    c.text(250, 262, "P10 은 D1-3 기록 후 P5 장보기 목록 확인으로 합류",
           size=8.6, anchor="middle")

    # ── C-2 로그인 경계 ───────────────────────────────────
    group(c, GL, 350, GR, 600, "C-2  로그인 경계 — 저장 위치가 바뀌는 지점")
    BX, BW = 410, 1120
    c.box(BX, 392, BW, 48, [], None)
    c.text(BX - BW / 2 + 16, 387, "비로그인 영역", size=10.6, anchor="start",
           weight="bold")
    c.text(BX - BW / 2 + 16, 403, "P1 – P8 주요 요리 흐름 · P9 · P10 · P11",
           size=9.0, anchor="start")
    c.text(BX + BW / 2 - 16, 396, "Browser Storage (D1)", size=9.4,
           anchor="end", mono=True)
    c.arrow([(BX, 416), (BX, 438)])
    c.box(BX, 462, 280, 46, ["P12  로그인"], "FN02", size=10.6, subsize=8.6)
    c.arrow([(BX, 485), (BX, 507)])
    c.box(BX, 546, BW, 66, [], None)
    c.text(BX - BW / 2 + 16, 528, "로그인 영역", size=10.6, anchor="start",
           weight="bold")
    c.text(BX - BW / 2 + 16, 546,
           "P13 게시글 작성 · P14 댓글 · 좋아요 · 즐겨찾기 · P15 프로필 관리",
           size=9.0, anchor="start")
    c.text(BX - BW / 2 + 16, 564,
           "접근 권한 검사(J7) 5곳 — 라우트 접근 검사 3 · 클라이언트 접근 제한 2",
           size=8.6, anchor="start")
    c.text(BX + BW / 2 - 16, 537, "Supabase (D2)", size=9.4, anchor="end",
           mono=True)
    c.text(BX + BW / 2 - 16, 555, "Supabase Storage (D3)", size=9.4,
           anchor="end", mono=True)
    return c.svg(max_w_mm=273, max_h_mm=150)


ERRORS = [
    ("API Key 없음", "/start", "FN01", "2곳"),
    ("음성 모델 미선택", "/start/model", "기능 목록 외 공통 단계", ""),
    ("로그인 필요", "/login?next=…", "FN07 · FN10", "3곳"),
    ("게시글 권한 없음", "/posts/:id", "FN07", ""),
    ("그 밖의 검사 실패",
     "현재 화면에서 오류 메시지 표시", "FN06 · FN08 · FN09 · FN11 · FN12", "9곳"),
]


def map_c2():
    """C-3 오류 및 예외 처리 경로."""
    c = Chart()
    AX, BX = 0, 640
    c.text(AX, -54, "검사 조건", size=11.0, weight="bold")
    c.text(BX, -54, "처리 결과", size=11.0, weight="bold")
    for i, (cond, dest, fn, cnt) in enumerate(ERRORS):
        y = i * 118
        c.dec(AX, y, 340, 86, [cond], None, size=10.4)
        c.text(AX - 190, y - 34, fn, size=9.0, anchor="start", mono=True)
        if cnt:
            c.text(AX + 190, y - 34, cnt, size=9.0, anchor="end")
        c.arrow([(AX + 170, y), (BX - 200, y)], "검사 실패",
                (AX + 170 + BX - 200) / 2, y - 8, anchor="middle")
        c.box(BX, y, 400, 50, [dest], None, size=10.6)
    return c.svg(max_w_mm=273, max_h_mm=150)
