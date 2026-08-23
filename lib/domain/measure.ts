/**
 * 도메인 · 계량 환산 규칙.
 *
 * 레시피마다 "한 컵", "두 큰술" 처럼 단위가 제멋대로라, 손에 든 계량도구로
 * 바꿔 볼 일이 잦다. 그 셈만 여기 모아 둔다.
 *
 * 무게(g)는 일부러 넣지 않았다. 밀가루 한 컵과 물 한 컵은 무게가 전혀 다른데,
 * 재료를 모르는 채로 g 를 알려 주면 요리를 망친다. 부피끼리만 바꾼다.
 */

/** 바꿀 수 있는 단위. 부를 말(컵·큰술…)은 화면이 정한다 */
export type MeasureUnit = "cup" | "tbsp" | "tsp" | "ml";

/** 화면에 늘어놓을 차례 */
export const measureUnits = ["cup", "tbsp", "tsp", "ml"] as const;

/**
 * 단위 하나가 몇 밀리리터인지.
 * 한국 레시피의 한 컵은 200ml 다 — 미국식 240ml 로 잡으면 20% 가 어긋난다.
 */
const inMl = {
  // 한국 계량컵
  cup: 200,
  // 밥숟가락 말고 계량스푼 큰술
  tbsp: 15,
  // 계량스푼 작은술
  tsp: 5,
  // 기준이 되는 단위라 그대로 1
  ml: 1,
} as const satisfies Record<MeasureUnit, number>;

/** 밖에서 들어온 글자를 단위로 받아 준다. 모르는 값이면 밀리리터로 본다 */
// [F1][함수] resolveMeasureUnit(raw): 밖에서 온 값을 계량 단위로 정리
// 입력: raw → 처리: measureUnits 목록 대조 → 출력: MeasureUnit (모르면 'ml')
export function resolveMeasureUnit(raw: unknown): MeasureUnit {
  // 목록에 있는 이름일 때만 그대로 쓴다
  return measureUnits.includes(raw as MeasureUnit) ? (raw as MeasureUnit) : "ml";
}

/**
 * 한 단위에서 다른 단위로 바꾼다.
 * 숫자로 못 읽는 값이면 null 을 돌려주고, 무슨 말로 알릴지는 화면이 정한다.
 */
// [F2][함수] convertMeasure(amount, from, to): 부피 단위를 서로 바꾼다
// 입력: amount + from + to → 처리: ml 로 옮겼다가 목표 단위로 나눔 → 출력: 숫자 또는 null
export function convertMeasure(
  amount: number,
  from: MeasureUnit,
  to: MeasureUnit,
): number | null {
  // 입력칸이 비었거나 글자가 섞이면 NaN 이 온다. 그대로 셈하면 NaN 이 화면까지 나간다
  // [F3][분기] amount 가 숫자가 아님 → true: null 반환 / false: F4
  if (!Number.isFinite(amount)) return null;

  // 음수 분량은 요리에 없다. 잘못 적은 것으로 보고 돌려보낸다
  // [F4][분기] amount < 0 → true: null 반환 / false: F5
  if (amount < 0) return null;

  // 일단 밀리리터라는 공통 자로 옮겨 놓고
  // [F5][흐름] amount × inMl[from] → ml (공통 자로 옮김)
  const ml = amount * inMl[from];

  // 목표 단위의 크기로 나눠서 몇 개인지 구한다
  // [F6][흐름] ml ÷ inMl[to] → value
  const value = ml / inMl[to];

  // 소수점이 길게 늘어지면 읽기 나쁘다. 계량은 소수 둘째 자리면 충분하다
  // [F7][반환] value → 소수 둘째 자리 반올림 → measure-tool 화면으로 전달
  return Math.round(value * 100) / 100;
}
