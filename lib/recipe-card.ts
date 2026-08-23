/**
 * 레시피 카드(인포그래픽) 그리기.
 *
 * 요리 완성 화면과 글쓰기 화면이 **같은 그림**을 써야 한다. 두 벌로 두면
 * 한쪽만 고쳐져서 내려받은 그림과 글에 붙은 그림이 달라진다.
 * 그래서 그리는 일만 여기로 떼어 두었다.
 *
 * 캔버스에 직접 그리는 까닭은 파일로 내보내야 하기 때문이다. HTML 로 그리면
 * 화면에는 예쁘지만 그림 파일로 저장할 길이 없다.
 *
 * ── 생김새
 * 어두운 바탕에 왼쪽 정렬이던 것을 **밝은 종이에 가운데 정렬한 표제**로 바꿨다.
 * 표지는 화면에서만 보는 것이 아니라 내려받아 인쇄하거나 커뮤니티 카드로 쓰는
 * 그림이다. 어두운 바탕은 잉크만 먹고, 왼쪽에 몰린 표제는 카드로 줄여 놓으면
 * 무슨 요리인지 한눈에 안 들어온다.
 *
 * ── 높이
 * **재 보고 나서 높이를 정한다.** 높이를 먼저 못 박아 두면 순서가 길 때
 * 글자가 그림 밖으로 나가고 꼬리말과 겹친다 — 처음에 그렇게 만들었다가 겹쳤다.
 */

import { coverColors, type CoverTone } from "@/lib/cook-content";
import type { Recipe } from "@/lib/domain/recipe";

/* ---------- 자리 값. 여기 모아 두어야 재는 셈과 그리는 셈이 안 어긋난다 ---------- */

/** 그림 너비. 세로는 내용에 따라 아래에서 정해진다 */
const W = 1080;

/** 좌우 여백 */
const PAD = 96;

/** 테두리를 종이 끝에서 얼마나 안쪽에 그릴지 */
const FRAME = 34;

/** 서비스 이름이 앉는 높이 */
const BRAND_Y = 122;

/** 요리 이름 첫 줄의 높이와 줄 간격 */
const TITLE_Y = 214;
const TITLE_LEAD = 84;

/** 요리 이름 글꼴. 재는 데도 그리는 데도 같은 값을 써야 줄 수가 안 어긋난다 */
const TITLE_FONT = "700 66px serif";

/** 인분·단계 줄이 요리 이름 마지막 줄에서 얼마나 아래인지 */
const META_GAP = 68;

/** 냄비 그림이 차지하는 세로 자리 */
const POT_GAP = 54;
const POT_H = 124;

/** 묶음 제목("재료"·"순서") 위아래 여백 */
const HEAD_GAP = 62;
const HEAD_TO_ROW = 50;

/** 재료 한 줄의 높이 */
const ING_H = 46;

/** 재료 분량을 칸 오른쪽 끝에서 얼마나 띄울지. 두 칸이 맞닿아 보이지 않게 하는 값이다 */
const ING_GUTTER = 62;

/** 순서 글꼴과, 번호 자리만큼 오른쪽으로 밀리는 폭 */
const STEP_FONT = "400 28px sans-serif";
const TEXT_INDENT = 62;

/** 걸음 오른쪽에 붙는 "5분" 의 글꼴과, 글과 사이에 두는 틈 */
const MIN_FONT = "400 24px monospace";
const MIN_GAP = 28;

/** 순서 한 걸음의 높이. 두 줄짜리는 그만큼 더 든다 */
const STEP_H1 = 54;
const STEP_H2 = 92;

/** 맨 아래 날짜가 차지하는 자리 */
const FOOT = 104;

/** 레시피 한 편을 캔버스에 그린다. 캔버스 크기는 내용에 맞춰 여기서 정한다 */
// [F1][함수] drawRecipeCard(canvas, recipe, tone): 레시피 한 장을 캔버스에 그린다
// 입력: canvas(그릴 자리) + recipe + tone(색조) → 처리: 먼저 재고 → 높이를 정하고 → 그린다
// 출력: 없음(canvas 에 그려진다). done-shell 과 write-form 이 **같은 함수**를 쓴다
export function drawRecipeCard(
  canvas: HTMLCanvasElement,
  recipe: Recipe,
  tone: CoverTone,
): void {
  const steps = recipe.steps;
  const items = recipe.ingredients;

  // [F2][외부] ▷ canvas.getContext('2d') → ctx (없으면 아무것도 안 하고 돌아간다)
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const c = coverColors[tone];

  /* ---------- 먼저 재 본다 ----------
     canvas.width 를 정하면 붓의 설정(글꼴 따위)이 몽땅 지워진다.
     그래서 재는 일을 크기 정하기 **앞에** 다 끝내 둔다 */

  // 글이 놓일 칸의 너비. 좌우 여백을 뺀 만큼이다
  const ROOM = W - PAD * 2;

  // 요리 이름은 큰 글씨라 재는 글꼴도 그때 것으로 맞춰야 한다
  // [F3][호출] 요리 이름 → wrapText(F8) → titleLines
  // canvas.width 를 정하면 붓 설정이 지워지므로 **재는 일을 크기 정하기 앞에** 끝낸다
  ctx.font = TITLE_FONT;
  const titleLines = wrapText(ctx, recipe.title, ROOM);

  /* 걸음마다 글이 쓸 수 있는 너비.
     번호 자리를 빼고, 시간이 적힌 걸음이면 오른쪽 "5분" 자리까지 뺀다.
     첫 줄만 좁게 잡았더니 접는 자리와 실제로 그릴 자리가 어긋나서
     첫 줄이 통째로 말줄임표로 잘려 나갔다 — 글이 사라지는 것이 가장 나쁘다 */
  // [F4][반복] 걸음마다 쓸 수 있는 너비를 잰다 → stepRooms
  // 시간이 적힌 걸음은 오른쪽 '5분' 자리까지 미리 뺀다(안 그러면 첫 줄이 잘려 나간다)
  ctx.font = MIN_FONT;
  const stepRooms = steps.map((st) => {
    // 시간이 없으면 오른쪽 끝까지 다 쓴다
    if (!st.minutes) return ROOM - TEXT_INDENT;

    return ROOM - TEXT_INDENT - ctx.measureText(`${st.minutes}분`).width - MIN_GAP;
  });

  ctx.font = STEP_FONT;
  // [F5][반복] 걸음마다 wrapText(F8) → stepWraps / 두 줄까지만 접는다 → stepLines
  const stepWraps = steps.map((st, i) => wrapText(ctx, st.text, stepRooms[i]));

  // 두 줄까지만 접는다. 그 뒤는 아래에서 말줄임표로 잘라 낸다
  const stepLines = stepWraps.map((lines) => Math.min(2, lines.length));
  const stepH = (lines: number) => (lines > 1 ? STEP_H2 : STEP_H1);

  // 재료는 두 칸으로 나눠 적는다. 홀수면 왼쪽 칸이 한 줄 더 길다
  const ingRows = Math.ceil(items.length / 2);

  // 냄비 그림 아래, 재료 제목이 앉는 높이
  const titleEnd = TITLE_Y + (titleLines.length - 1) * TITLE_LEAD;
  const metaY = titleEnd + META_GAP;
  const potY = metaY + POT_GAP;
  const ingHeadY = potY + POT_H + HEAD_GAP;
  const ingEnd = ingHeadY + HEAD_TO_ROW + (ingRows - 1) * ING_H;
  const stepHeadY = ingEnd + HEAD_GAP;
  const stepsTop = stepHeadY + HEAD_TO_ROW;
  const stepsH = stepLines.reduce((sum, n) => sum + stepH(n), 0);

  // [F6][흐름] 재 둔 값으로 높이를 셈해 canvas.width·height 를 정한다
  // 높이를 먼저 못 박으면 순서가 길 때 글자가 그림 밖으로 나가고 꼬리말과 겹친다
  canvas.width = W;
  canvas.height = stepsTop + stepsH + FOOT;

  const H = canvas.height;

  /* ---------- 바탕과 테두리 ---------- */

  // 종이 한 장. 그라데이션 없이 한 색으로 칠한다
  // [F7][흐름] 종이 한 색으로 칠하고 안쪽에 가는 테두리를 두른다
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);

  /* 안쪽에 가는 테두리 하나. 종이에 인쇄한 것처럼 보이게 하는 선이고,
     카드로 줄여 놓았을 때 그림의 끝이 어디인지 알려 주는 몫도 한다 */
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(FRAME, FRAME, W - FRAME * 2, H - FRAME * 2, 24);
  ctx.stroke();

  /* ---------- 머리: 서비스 이름 ---------- */

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c.accent;
  ctx.font = "700 24px monospace";

  /* 글자 사이를 벌린다. canvas 의 letterSpacing 은 브라우저마다 있고 없고 해서
     글자 사이에 빈칸을 끼워 넣는 쪽이 어디서나 똑같이 나온다 */
  ctx.fillText("COOKPILOT".split("").join(" "), W / 2, BRAND_Y);

  /* ---------- 요리 이름 ---------- */

  ctx.fillStyle = c.ink;
  ctx.font = TITLE_FONT;
  titleLines.forEach((line, i) => ctx.fillText(line, W / 2, TITLE_Y + i * TITLE_LEAD));

  /* ---------- 인분과 단계 수 ---------- */

  ctx.fillStyle = c.dim;
  ctx.font = "400 30px sans-serif";
  ctx.fillText(`${recipe.servings}인분 · ${steps.length}단계`, W / 2, metaY);

  /* ---------- 냄비 그림 ----------
     로고 파일을 불러오지 않고 여기서 그린다. 파일은 늦게 와서
     빈 채로 저장되는 일이 있다 */
  drawPot(ctx, W / 2, potY, c.accent);

  /* ---------- 재료 ---------- */

  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.font = "700 26px monospace";
  ctx.fillText("재료", PAD, ingHeadY);

  // 칸 하나의 너비. 두 칸으로 나눠 적어야 세로가 덜 길어진다
  const COL = ROOM / 2;

  // [F8-ing][반복] 재료를 **줄 차례대로**(왼→오른) 두 칸에 놓는다
  // 분량은 오른쪽에 붙이고, 이름은 남은 자리에 맞춰 fit(F9) 로 자른다
  items.forEach((ing, i) => {
    /* 왼쪽 칸을 다 채우고 오른쪽으로 넘어가는 것이 아니라 **줄 차례대로** 놓는다.
       레시피에 적힌 재료 순서가 왼→오른, 다음 줄로 이어져야 눈이 안 튄다 */
    const col = i % 2;
    const row = Math.floor(i / 2);
    const left = PAD + col * COL;
    const lineY = ingHeadY + HEAD_TO_ROW + row * ING_H;

    /* 분량을 칸 오른쪽에 붙인다. 이름 뒤 고정 자리에 두었더니
       이름이 긴 재료에서 글자가 겹쳤다.
       오른쪽 끝에서 한 칸 더 띄우는 까닭 — 바짝 붙이면 왼쪽 칸의 분량과
       오른쪽 칸의 이름이 맞닿아서 한 낱말처럼 읽힌다 */
    ctx.fillStyle = c.dim;
    ctx.font = "400 26px monospace";
    ctx.textAlign = "right";
    ctx.fillText(ing.amount, left + COL - ING_GUTTER, lineY);
    const amountW = ctx.measureText(ing.amount).width;

    // 이름은 분량이 시작하는 자리까지만. 넘치면 잘라 낸다
    ctx.textAlign = "left";
    ctx.fillStyle = c.ink;
    ctx.font = "400 28px sans-serif";
    ctx.fillText(fit(ctx, ing.name, COL - ING_GUTTER - 18 - amountW), left, lineY);
  });

  /* ---------- 만드는 순서 ---------- */

  ctx.textAlign = "left";
  ctx.fillStyle = c.accent;
  ctx.font = "700 26px monospace";
  ctx.fillText("순서", PAD, stepHeadY);

  // 번호가 앉는 자리와 글이 시작하는 자리
  const NUM_X = PAD;
  const TEXT_X = PAD + TEXT_INDENT;

  let y = stepsTop;

  // [F9-step][반복] 걸음마다 번호(01)·시간·글을 그린다
  // 세 줄 넘게 나온 걸음은 두 줄까지만, 마지막 줄 끝에 말줄임표가 붙는다
  steps.forEach((step, i) => {
    /* 번호는 두 자리로 맞춘다. 한 자리와 두 자리가 섞이면 글 시작점이 들쭉날쭉해 보인다 */
    ctx.fillStyle = c.accent;
    ctx.font = "700 24px monospace";
    ctx.fillText(String(i + 1).padStart(2, "0"), NUM_X, y);

    // 시간이 적힌 걸음에만 오른쪽에 붙인다. 접을 때 이미 자리를 비워 두었다
    if (step.minutes) {
      ctx.fillStyle = c.dim;
      ctx.font = MIN_FONT;
      ctx.textAlign = "right";
      ctx.fillText(`${step.minutes}분`, W - PAD, y);
      ctx.textAlign = "left";
    }

    // 걸음 글자. 위에서 재 둔 줄을 그대로 쓴다 — 다시 접으면 높이와 어긋난다
    ctx.fillStyle = c.ink;
    ctx.font = STEP_FONT;
    /* 세 줄 넘게 나온 걸음은 두 줄까지만 그린다. 그때는 마지막 줄 끝에
       말줄임표가 붙어야 한다 — 그냥 끊으면 문장이 온전한 줄 안다 */
    const all = stepWraps[i];
    const lines = all.slice(0, stepLines[i]);
    if (all.length > lines.length) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${all[lines.length]}`;
    }
    lines.forEach((line, k) => {
      /* fit 은 대비책이다. 접을 때 쓴 것과 같은 너비를 주므로 보통은 그대로 지나가고,
         두 줄로 잘라 낸 마지막 줄에만 말줄임표가 붙는다 */
      ctx.fillText(fit(ctx, line, stepRooms[i]), TEXT_X, y + k * 38);
    });

    y += stepH(stepLines[i]);
  });

  /* ---------- 맨 아래 날짜 ----------
     언제 만든 레시피인지 남긴다. 서재에 여러 장 꽂아 두면 이 줄로 가른다 */
  ctx.textAlign = "center";
  ctx.fillStyle = c.dim;
  ctx.font = "400 24px monospace";
  // [F7b][호출] today()(F11) → 맨 아래 날짜
  ctx.fillText(today(), W / 2, H - 62);
}

/**
 * 글을 칸 너비에 맞춰 여러 줄로 접는다.
 *
 * 글자 수로 세지 않고 **실제로 재서** 접는다. 예전에는 "26글자마다" 처럼 세었는데,
 * 그러면 "돼지고기 감자 고추장찌개" 가 "…고추장찌 / 개" 로 잘려서 마지막 줄에
 * 한 글자만 남았다. 한글·숫자·영문이 폭이 달라서 글자 수는 너비와 안 맞는다.
 *
 * 낱말 사이에서 먼저 끊는다. 낱말 하나가 칸보다 길 때만 글자 단위로 쪼갠다 —
 * 긴 영문 재료 이름 하나 때문에 줄이 통째로 넘치는 일을 막는 대비책이다.
 *
 * 부르기 전에 ctx.font 를 그릴 때와 같은 값으로 맞춰 두어야 한다.
 */
// [F8][함수] wrapText(ctx, text, room): 글을 칸 너비에 맞춰 여러 줄로 접는다
// 입력: ctx(글꼴이 맞춰진 붓) + text + room(쓸 수 있는 너비)
// 처리: [반복] 낱말 사이에서 먼저 끊고, 낱말 하나가 칸보다 길 때만 글자 단위로
// 출력: 줄 배열 (글자 수가 아니라 **잰 너비**로 접는다)
function wrapText(ctx: CanvasRenderingContext2D, text: string, room: number): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of text.split(/\s+/).filter((w) => w.length > 0)) {
    // 이 낱말까지 넣어도 들어가면 그냥 이어 붙인다
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= room) {
      line = next;
      continue;
    }

    // 안 들어가면 여기서 줄을 끊는다
    if (line) {
      lines.push(line);
      line = "";
    }

    // 낱말 하나가 칸보다 길면 그 낱말만 글자 단위로 쪼갠다
    let chunk = "";
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width <= room) {
        chunk += ch;
        continue;
      }
      if (chunk) lines.push(chunk);
      chunk = ch;
    }
    line = chunk;
  }

  if (line) lines.push(line);

  // 빈 글이 들어와도 줄 하나는 돌려준다. 부르는 쪽이 길이 0을 안 다뤄도 되게
  return lines.length > 0 ? lines : [text];
}

/**
 * 글자가 칸에 안 들어가면 뒤를 잘라 내고 말줄임표를 붙인다.
 *
 * 글자 수가 아니라 **실제로 잰 너비**로 자른다. 한글과 숫자·영문은 폭이 달라서
 * 글자 수로 자르면 어떤 줄은 남고 어떤 줄은 넘친다.
 */
// [F9][함수] fit(ctx, text, room): 칸에 안 들어가면 뒤를 잘라 말줄임표를 붙인다
// 입력: ctx + text + room → 처리: [반복] 들어갈 때까지 한 글자씩 줄임 → 출력: 문자열
function fit(ctx: CanvasRenderingContext2D, text: string, room: number): string {
  // 이미 들어가면 그대로 둔다. 대부분 여기서 끝난다
  if (ctx.measureText(text).width <= room) return text;

  let cut = text;

  // 말줄임표 자리까지 셈해서 줄인다
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > room) {
    cut = cut.slice(0, -1);
  }

  return `${cut}…`;
}

/** 오늘 날짜를 "2026.08.23" 처럼 적는다 */
// [F11][함수] today(): 오늘 날짜를 '2026.08.23' 처럼 적는다
// 입력: 없음 → 처리: ▷ new Date() → 자릿수 맞추기 → 출력: 문자열
function today(): string {
  const d = new Date();

  // 월과 일은 한 자리일 때 앞에 0을 붙여야 자릿수가 안 흔들린다
  const two = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
}

/**
 * 냄비와 그 아래 불꽃을 그린다.
 *
 * 요리 카드라는 것을 글자 없이 알리는 그림 하나다. 표제와 본문 사이에 두어
 * 둘을 갈라 주는 몫도 한다 — 선을 하나 긋는 것보다 조용하고 눈에 남는다.
 *
 * `cx` 는 가로 한가운데, `top` 은 이 그림 묶음이 시작하는 높이다.
 */
// [F12][함수] drawPot(ctx, cx, top, color): 냄비와 그 아래 불꽃을 그린다
// 입력: ctx + 가운데 x + 시작 높이 + 색 → 처리: 뚜껑·몸통·손잡이·불꽃 → 출력: 없음
// 로고 파일을 안 불러오는 까닭 — 파일은 늦게 와서 빈 채로 저장되는 일이 있다
function drawPot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  color: string,
): void {
  ctx.fillStyle = color;

  // 뚜껑 손잡이. 맨 위 가운데 작은 덩어리
  ctx.beginPath();
  ctx.roundRect(cx - 11, top, 22, 12, 6);
  ctx.fill();

  // 뚜껑. 가로로 긴 막대
  ctx.beginPath();
  ctx.roundRect(cx - 62, top + 14, 124, 14, 7);
  ctx.fill();

  // 냄비 몸통. 아래쪽만 둥글려서 냄비처럼 보이게 한다
  ctx.beginPath();
  ctx.roundRect(cx - 50, top + 32, 100, 56, [6, 6, 22, 22]);
  ctx.fill();

  // 양쪽 손잡이
  ctx.beginPath();
  ctx.roundRect(cx - 70, top + 40, 18, 12, 6);
  ctx.roundRect(cx + 52, top + 40, 18, 12, 6);
  ctx.fill();

  /* 냄비 밑의 불. 길이를 들쭉날쭉하게 두어야 불처럼 보인다 —
     다 같은 길이면 그냥 줄무늬로 보인다 */
  const flames = [12, 20, 14, 26, 16, 26, 14, 20, 12];
  const step = 12;
  const startX = cx - ((flames.length - 1) * step) / 2;

  // [F13][반복] flames 를 훑어 길이가 들쭉날쭉한 불꽃 막대를 그린다
  flames.forEach((h, i) => {
    ctx.beginPath();
    // 아래쪽에 맞춰 세운다. 그래야 끝이 가지런하고 위가 들쭉날쭉해진다
    ctx.roundRect(startX + i * step - 2.5, top + 118 - h, 5, h, 2.5);
    ctx.fill();
  });
}
