/**
 * 도메인 · 어떤 Gemini 모델을 쓸지 정하는 규칙.
 *
 * 이 파일이 아는 것은 "무슨 일에 어떤 모델을 붙일까" 하나뿐이다.
 * 화면이 어떻게 생겼는지도, 구글에 어떻게 요청을 보내는지도 모른다.
 * 모델 이름이 바뀌는 날에는 여기 한 줄만 고치면 된다.
 *
 * 모델 이름을 화면 여기저기에 흩어 놓으면, 나중에 하나를 빠뜨린 채로
 * 옛 모델을 계속 부르게 된다. 그래서 이름은 이 파일 밖으로 새어 나가지 않는다.
 */

/**
 * 목소리를 알아듣는 일은 늘 이 모델이 맡는다.
 * 실시간으로 말을 주고받을 수 있는 모델이 지금은 이것뿐이라 고를 여지가 없다.
 * 고를 여지가 없으니 화면에 선택지로 내놓지도 않는다.
 */
export const LIVE_MODEL = "gemini-3.1-flash-live-preview";

/**
 * 답변 속도. 사람이 고르는 것은 모델 이름이 아니라 "얼마나 꼼꼼히 답할까" 다.
 * 모델 이름을 그대로 고르게 하면, 모델이 바뀔 때마다 사람이 고른 값이 쓸모없어진다.
 */
export type AnswerSpeed = "quick" | "careful";

/** 고를 수 있는 속도를 차례대로 적어 둔다. 화면은 이 차례로 늘어놓는다 */
export const answerSpeeds = ["quick", "careful"] as const;

/**
 * 속도마다 실제로 부를 모델.
 * 유튜브 레시피를 옮겨 오거나 냉장고 재료로 요리를 찾는 일이 이 모델에 간다.
 */
export const speedModels = {
  // 불 앞에서 묻고 바로 답을 들어야 할 때. 가벼운 대신 옮겨 적기가 조금 거칠다
  quick: "gemini-3.5-flash-lite",
  // 분량을 빠뜨리면 안 되는 일에 쓴다. 조금 기다리는 대신 촘촘하다
  careful: "gemini-3.7-flash",
} as const satisfies Record<AnswerSpeed, string>;

/** 아무것도 안 고른 사람에게 줄 값. 처음에는 빠른 쪽이 낫다 — 답이 늦으면 불이 탄다 */
export const DEFAULT_SPEED: AnswerSpeed = "quick";

/**
 * 밖에서 들어온 글자를 속도로 받아 준다.
 * 저장해 둔 값은 사람이 브라우저 개발자 도구로 고쳐 놓을 수도 있고,
 * 예전 판에서 쓰던 이름이 남아 있을 수도 있다. 모르는 값이면 조용히 기본값으로 돌린다.
 */
export function resolveAnswerSpeed(raw: unknown): AnswerSpeed {
  // 목록에 있는 이름일 때만 그대로 쓴다. includes 로 물어보면 타입까지 좁혀진다
  return answerSpeeds.includes(raw as AnswerSpeed) ? (raw as AnswerSpeed) : DEFAULT_SPEED;
}

/** 고른 속도에 맞는 모델 이름. 실제로 요청을 보내는 쪽은 이 함수만 부르면 된다 */
export function modelForSpeed(speed: AnswerSpeed): string {
  // 위 표에서 꺼내 온다. 표에 없는 속도는 타입이 미리 막아 준다
  return speedModels[speed];
}
