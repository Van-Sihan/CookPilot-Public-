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
 * **재 보고 나서 높이를 정한다.** 높이를 먼저 못 박아 두면 순서가 길 때
 * 글자가 그림 밖으로 나가고 꼬리말과 겹친다 — 처음에 그렇게 만들었다가 겹쳤다.
 */

import { coverColors, type CoverTone } from "@/lib/cook-content";
import type { Recipe } from "@/lib/domain/recipe";

/** 레시피 한 편을 캔버스에 그린다. 캔버스 크기는 내용에 맞춰 여기서 정한다 */
export function drawRecipeCard(
  canvas: HTMLCanvasElement,
  recipe: Recipe,
  tone: CoverTone,
): void {
    const steps = recipe.steps;
    const items = recipe.ingredients;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PAD = 90;
    const W = 1080;
    const COL = (W - PAD * 2) / 2;
    const CREAM = "#FFF7EA";
    const DIM = "rgba(255,247,234,.62)";
    const EMBER = "#F0A07A";

    /** 글자가 칸을 넘으면 줄을 나눈다. 한글은 낱말 사이 빈칸이 적어 글자 수로 센다 */
    const wrap = (text: string, perLine: number) =>
      text.match(new RegExp(`.{1,${perLine}}`, "g")) ?? [text];

    /* 먼저 재 보고 나서 높이를 정한다. 높이를 먼저 못 박아 두면 순서가 길 때
       글자가 그림 밖으로 나가고, 꼬리말과 겹친다 — 처음에 그렇게 만들었다가 겹쳤다 */
    const titleLines = wrap(recipe.title, 13);
    const stepLines = steps.map((st) => Math.min(2, wrap(st.text, 26).length));
    const ING_H = 46;
    const ingRows = Math.ceil(items.length / 2);

    // 걸음 하나의 높이. 두 줄짜리는 그만큼 더 든다
    const stepH = (lines: number) => (lines > 1 ? 104 : 76);
    const stepsH = stepLines.reduce((sum, n) => sum + stepH(n), 0);

    const headH = 120 + titleLines.length * 86 + 110;
    const ingH = 56 + ingRows * ING_H + 40;
    const FOOT = 120;

    canvas.width = W;
    canvas.height = headH + ingH + 56 + stepsH + FOOT;

    const [top, bottom] = coverColors[tone];

    // 위에서 아래로 어두워지는 바탕
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, canvas.height);

    /** 가로선 하나. 칸을 나눌 때 쓴다 */
    const rule = (y: number) => {
      ctx.fillStyle = "rgba(255,247,234,.18)";
      ctx.fillRect(PAD, y, W - PAD * 2, 1);
    };

    // ── 머리: 서비스 이름과 냄비 그림
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = EMBER;
    ctx.font = "700 30px monospace";
    ctx.fillText("COOKPILOT", PAD, 84);

    /* 로고 파일을 불러오지 않고 냄비를 두 획으로 그린다.
       파일은 늦게 와서 빈 채로 저장되는 일이 있다 */
    ctx.strokeStyle = EMBER;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(W - PAD - 26, 62, 26, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - PAD - 62, 40);
    ctx.lineTo(W - PAD + 10, 40);
    ctx.stroke();

    rule(120);

    // ── 요리 이름
    ctx.fillStyle = CREAM;
    ctx.font = "700 76px serif";
    titleLines.forEach((line, i) => ctx.fillText(line, PAD, 214 + i * 86));

    // ── 인분과 걸리는 시간
    const total = steps.reduce((sum, st) => sum + (st.minutes ?? 0), 0);
    ctx.fillStyle = DIM;
    ctx.font = "400 38px sans-serif";
    ctx.fillText(
      `${recipe.servings}인분${total > 0 ? `   ·   약 ${total}분` : ""}`,
      PAD,
      214 + (titleLines.length - 1) * 86 + 76,
    );

    let y = headH;
    rule(y);
    y += 56;

    // ── 재료. 두 칸으로 나눠 적어야 세로가 덜 길어진다
    ctx.fillStyle = EMBER;
    ctx.font = "700 30px monospace";
    ctx.fillText("재료", PAD, y);
    y += 44;

    const half = Math.ceil(items.length / 2);
    items.forEach((ing, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      const left = PAD + col * COL;
      const lineY = y + row * ING_H;

      /* 분량을 칸 오른쪽에 붙인다. 이름 뒤 고정 자리에 두었더니
         이름이 긴 재료에서 글자가 겹쳤다 */
      ctx.fillStyle = DIM;
      ctx.font = "400 26px monospace";
      ctx.textAlign = "right";
      ctx.fillText(ing.amount, left + COL - 24, lineY);
      const amountW = ctx.measureText(ing.amount).width;

      // 이름은 분량이 시작하는 자리까지만. 넘치면 잘라 낸다
      ctx.textAlign = "left";
      ctx.fillStyle = CREAM;
      ctx.font = "400 30px sans-serif";
      let name = ing.name;
      const room = COL - 40 - amountW;
      while (name.length > 1 && ctx.measureText(name).width > room) {
        name = name.slice(0, -1);
      }
      ctx.fillText(name === ing.name ? name : `${name}…`, left, lineY);
    });

    y += (ingRows - 1) * ING_H + 40;
    rule(y);
    y += 56;

    // ── 만드는 순서. 번호를 동그라미에 넣어 눈으로 세기 쉽게 한다
    ctx.fillStyle = EMBER;
    ctx.font = "700 30px monospace";
    ctx.fillText("만드는 순서", PAD, y);
    y += 52;

    steps.forEach((step, i) => {
      // 번호 동그라미
      ctx.beginPath();
      ctx.arc(PAD + 20, y + 12, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,247,234,.1)";
      ctx.fill();
      ctx.strokeStyle = EMBER;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = EMBER;
      ctx.font = "700 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), PAD + 20, y + 21);
      ctx.textAlign = "left";

      // 시간이 적힌 걸음에만 오른쪽에 붙인다. 글자보다 먼저 그려 자리를 잡아 둔다
      let right = W - PAD;
      if (step.minutes) {
        ctx.fillStyle = DIM;
        ctx.font = "400 26px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${step.minutes}분`, W - PAD, y + 22);
        right = W - PAD - ctx.measureText(`${step.minutes}분`).width - 24;
        ctx.textAlign = "left";
      }

      // 걸음 글자. 길면 두 줄까지만 접는다
      ctx.fillStyle = CREAM;
      ctx.font = "400 31px sans-serif";
      const lines = wrap(step.text, 26).slice(0, stepLines[i]);
      lines.forEach((line, k) => {
        // 첫 줄만 시간 자리를 피한다. 둘째 줄은 그 아래라 겹치지 않는다
        let text = line;
        const room = (k === 0 ? right : W - PAD) - (PAD + 62);
        while (text.length > 1 && ctx.measureText(text).width > room) {
          text = text.slice(0, -1);
        }
        ctx.fillText(text, PAD + 62, y + 22 + k * 38);
      });

      y += stepH(stepLines[i]);
    });

    // ── 맨 아래 도장. 재 놓은 높이 안에 들어가야 한다
    rule(canvas.height - 80);
    ctx.fillStyle = DIM;
    ctx.font = "400 26px monospace";
    ctx.fillText("cookpilot — 말로 하는 요리 도우미", PAD, canvas.height - 34);

}
