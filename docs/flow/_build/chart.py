# -*- coding: utf-8 -*-
"""기본 플로차트(basic flowchart) SVG 를 뽑는 작은 엔진.

흑백 · 실선 · 화살촉 marker. PDF 로 인쇄해도 벡터 그대로 남는다.
"""
import html

FONT = "'Malgun Gothic','Nanum Gothic',Arial,sans-serif"
MONO = "Consolas,'Malgun Gothic','Courier New',monospace"

PX_MM = 25.4 / 96.0


def esc(s):
    return html.escape(str(s), quote=True)


class Chart:
    """절대 좌표로 도형과 화살표를 놓는다."""

    def __init__(self):
        self.parts = []
        self.minx = 10 ** 9
        self.miny = 10 ** 9
        self.maxx = -10 ** 9
        self.maxy = -10 ** 9

    def _see(self, x, y):
        self.minx = min(self.minx, x)
        self.miny = min(self.miny, y)
        self.maxx = max(self.maxx, x)
        self.maxy = max(self.maxy, y)

    def _seebox(self, cx, cy, w, h):
        self._see(cx - w / 2, cy - h / 2)
        self._see(cx + w / 2, cy + h / 2)

    def text(self, x, y, s, size=10.5, anchor="middle", mono=False, weight="normal"):
        fam = MONO if mono else FONT
        self.parts.append(
            '<text x="%.1f" y="%.1f" font-family="%s" font-size="%.1f" '
            'font-weight="%s" text-anchor="%s" fill="#000">%s</text>'
            % (x, y, fam, size, weight, anchor, esc(s))
        )
        half = len(str(s)) * size * 0.32
        if anchor == "middle":
            self._see(x - half, y - size)
            self._see(x + half, y + size * 0.4)
        elif anchor == "end":
            self._see(x - half * 2, y - size)
            self._see(x, y + size * 0.4)
        else:
            self._see(x, y - size)
            self._see(x + half * 2, y + size * 0.4)

    def _label_block(self, cx, cy, lines, sub, size, subsize):
        n = len(lines)
        total = n * (size + 3.5) + (subsize + 3 if sub else 0)
        top = cy - total / 2 + size * 0.82
        for i, ln in enumerate(lines):
            self.text(cx, top + i * (size + 3.5), ln, size=size, weight="bold")
        if sub:
            self.text(cx, top + n * (size + 3.5) + subsize * 0.2, sub,
                      size=subsize, mono=True)

    def box(self, cx, cy, w, h, lines, sub=None, size=10.5, subsize=8.0):
        self.parts.append(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" '
            'fill="#fff" stroke="#000" stroke-width="1.1"/>'
            % (cx - w / 2, cy - h / 2, w, h)
        )
        self._seebox(cx, cy, w, h)
        self._label_block(cx, cy, lines, sub, size, subsize)

    def term(self, cx, cy, w, h, lines, sub=None, size=10.5, subsize=8.0):
        self.parts.append(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" ry="%.1f" '
            'fill="#fff" stroke="#000" stroke-width="1.1"/>'
            % (cx - w / 2, cy - h / 2, w, h, h / 2, h / 2)
        )
        self._seebox(cx, cy, w, h)
        self._label_block(cx, cy, lines, sub, size, subsize)

    def io(self, cx, cy, w, h, lines, sub=None, size=10.5, subsize=8.0):
        s = h * 0.34
        x0, y0 = cx - w / 2, cy - h / 2
        pts = "%.1f,%.1f %.1f,%.1f %.1f,%.1f %.1f,%.1f" % (
            x0 + s, y0, x0 + w, y0, x0 + w - s, y0 + h, x0, y0 + h)
        self.parts.append(
            '<polygon points="%s" fill="#fff" stroke="#000" stroke-width="1.1"/>' % pts)
        self._seebox(cx, cy, w, h)
        self._label_block(cx, cy, lines, sub, size, subsize)

    def pre(self, cx, cy, w, h, lines, sub=None, size=10.5, subsize=8.0):
        self.box(cx, cy, w, h, lines, sub, size, subsize)
        for dx in (-w / 2 + 7, w / 2 - 7):
            self.parts.append(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" '
                'stroke="#000" stroke-width="1.1"/>'
                % (cx + dx, cy - h / 2, cx + dx, cy + h / 2))

    def cyl(self, cx, cy, w, h, lines, sub=None, size=10.5, subsize=8.0):
        """저장소 — 원통. 타원 두 개와 흰 사각형만으로 그린다(아크 없음)."""
        r = h * 0.13
        x0, y0 = cx - w / 2, cy - h / 2
        yt, yb = y0 + r, y0 + h - r
        # 아래 타원을 먼저 놓고, 몸통 흰 사각형으로 그 위쪽 절반을 덮는다
        self.parts.append(
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#fff" '
            'stroke="#000" stroke-width="1.1"/>' % (cx, yb, w / 2, r))
        self.parts.append(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#fff" '
            'stroke="none"/>' % (x0, yt, w, yb - yt))
        for x in (x0, x0 + w):
            self.parts.append(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#000" '
                'stroke-width="1.1"/>' % (x, yt, x, yb))
        self.parts.append(
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#fff" '
            'stroke="#000" stroke-width="1.1"/>' % (cx, yt, w / 2, r))
        self._seebox(cx, cy, w, h)
        self._label_block(cx, cy + r * 0.9, lines, sub, size, subsize)

    def dec(self, cx, cy, w, h, lines, sub=None, size=10.0):
        pts = "%.1f,%.1f %.1f,%.1f %.1f,%.1f %.1f,%.1f" % (
            cx, cy - h / 2, cx + w / 2, cy, cx, cy + h / 2, cx - w / 2, cy)
        self.parts.append(
            '<polygon points="%s" fill="#fff" stroke="#000" stroke-width="1.1"/>' % pts)
        self._seebox(cx, cy, w, h)
        n = len(lines)
        top = cy - n * (size + 3.0) / 2 + size * 0.82
        for i, ln in enumerate(lines):
            self.text(cx, top + i * (size + 3.0), ln, size=size, weight="bold")
        if sub:
            self.text(cx - w / 2 - 7, cy - h / 2 + 13, sub, size=7.5,
                      anchor="end", mono=True)

    def conn(self, cx, cy, r, ch):
        self.parts.append(
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" stroke="#000" '
            'stroke-width="1.1"/>' % (cx, cy, r))
        self._seebox(cx, cy, r * 2, r * 2)
        self.text(cx, cy + 4.2, ch, size=11.5, weight="bold")

    def arrow(self, pts, label=None, lx=None, ly=None, dash=False, anchor="start"):
        d = " ".join("%.1f,%.1f" % (x, y) for x, y in pts)
        st = ' stroke-dasharray="5 3"' if dash else ""
        self.parts.append(
            '<polyline points="%s" fill="none" stroke="#000" stroke-width="1.1"%s '
            'marker-end="url(#ah)"/>' % (d, st))
        for x, y in pts:
            self._see(x, y)
        if label:
            self.text(lx, ly, label, size=8.8, anchor=anchor)

    def plain(self, pts):
        """화살촉 없는 연결선 — 여러 갈래가 모이는 버스에 쓴다."""
        d = " ".join("%.1f,%.1f" % (x, y) for x, y in pts)
        self.parts.append(
            '<polyline points="%s" fill="none" stroke="#000" '
            'stroke-width="1.1"/>' % d)
        for x, y in pts:
            self._see(x, y)

    def vline(self, x, y1, y2, label=None):
        self.arrow([(x, y1), (x, y2)], label, x + 5, (y1 + y2) / 2 + 3.2)

    def svg(self, max_w_mm=273.0, max_h_mm=166.0, pad=14):
        x0, y0 = self.minx - pad, self.miny - pad
        w = (self.maxx - self.minx) + pad * 2
        h = (self.maxy - self.miny) + pad * 2
        wmm, hmm = w * PX_MM, h * PX_MM
        s = min(max_w_mm / wmm, max_h_mm / hmm, 1.0)
        return (
            '<svg class="fc" viewBox="%.1f %.1f %.1f %.1f" width="%.2fmm" '
            'height="%.2fmm" xmlns="http://www.w3.org/2000/svg">'
            '<defs><marker id="ah" viewBox="0 0 10 10" refX="9.2" refY="5" '
            'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="#000"/></marker></defs>%s</svg>'
            % (x0, y0, w, h, wmm * s, hmm * s, "".join(self.parts))
        )


class Spine:
    """가운데 세로줄에 도형을 쌓고, 옆으로 분기를 뻗는다."""

    SW = 230
    BW = 214
    DW, DH = 210, 92
    GAP = 40
    OFF = 336

    def __init__(self, cx=0, y=0):
        self.c = Chart()
        self.cx = cx
        self.y = y
        self.anchors = {}
        self._last = None

    def _h(self, shape, lines, sub):
        if shape == "dec":
            return self.DH
        return max(38.0, 15.0 + 16.0 * len(lines) + (12.0 if sub else 0.0))

    def _draw(self, shape, cx, cy, w, h, lines, sub):
        if shape == "dec":
            self.c.dec(cx, cy, w, h, lines, sub)
        else:
            {"proc": self.c.box, "term": self.c.term, "io": self.c.io,
             "pre": self.c.pre, "cyl": self.c.cyl}[shape](cx, cy, w, h, lines, sub)

    def node(self, shape, lines, sub=None, edge=None, name=None, gap=None):
        g = self.GAP if gap is None else gap
        w = self.DW if shape == "dec" else self.SW
        h = self._h(shape, lines, sub)
        if self._last is not None:
            top = self._last[0] + self._last[1] / 2
            self.c.vline(self.cx, top, top + g, edge)
            self.y = top + g + h / 2
        else:
            self.y = self.y + h / 2
        self._draw(shape, self.cx, self.y, w, h, lines, sub)
        self._last = (self.y, h, w)
        if name:
            self.anchors[name] = (self.y, h, w)
        return self.y

    def branch(self, side, label, shape, lines, sub=None, name=None, dy=0):
        cy0, h0, w0 = self._last
        cy = cy0 + dy
        w = self.DW if shape == "dec" else self.BW
        h = self._h(shape, lines, sub)
        cx = self.cx + (self.OFF if side == "r" else -self.OFF)
        self._draw(shape, cx, cy, w, h, lines, sub)
        if side == "r":
            x1, x2 = self.cx + w0 / 2, cx - w / 2
        else:
            x1, x2 = self.cx - w0 / 2, cx + w / 2
        self.c.arrow([(x1, cy0), (x2, cy)], label,
                     (x1 + x2) / 2, cy0 - 6, anchor="middle")
        if name:
            self.anchors[name] = (cy, h, w)
        return cy

    def gapline(self, g, label=None):
        top = self._last[0] + self._last[1] / 2
        self.c.vline(self.cx, top, top + g, label)
        self._last = (top + g, 0, self.SW)

    def loop(self, from_name, to_name, x, label=None, side="l"):
        fy, fh, fw = self.anchors[from_name]
        ty, th, tw = self.anchors[to_name]
        if side == "l":
            x1, x2 = self.cx - fw / 2, self.cx - tw / 2
        else:
            x1, x2 = self.cx + fw / 2, self.cx + tw / 2
        self.c.arrow([(x1, fy), (x, fy), (x, ty), (x2, ty)])
        if label:
            self.c.text(x + (-6 if side == "l" else 6), (fy + ty) / 2,
                        label, size=8.8, anchor="end" if side == "l" else "start")

    def svg(self, **kw):
        return self.c.svg(**kw)
