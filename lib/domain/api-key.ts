/**
 * 도메인 · 구글 Gemini API 키.
 *
 * 이 파일이 아는 것은 딱 하나다. "어떤 키를 받아 줄까?"
 * 화면이 어떻게 생겼는지, 키를 어디에 넣어 두는지는 하나도 모른다.
 * 아는 게 적으니 어디서든 마음 놓고 갖다 쓸 수 있다.
 *
 * 키 모양(앞글자가 뭔지, 몇 글자인지)은 보지 않는다.
 * 구글이 "키는 이렇게 생겼습니다" 하고 약속한 적이 없기 때문이다.
 * 우리가 멋대로 규칙을 정하면 멀쩡한 키를 막아 버리게 된다.
 * 진짜 쓸 수 있는 키인지는 구글에 한번 물어봐야 알 수 있고, 그건 다른 파일이 할 일이다.
 * 그래서 여기서는 빈칸만 걸러 낸다.
 */

/** 검사를 통과한 키에만 몰래 붙는 도장. 아무 글자나 키인 척 끼어들지 못하게 막는다 */
declare const validated: unique symbol;

/** 도장이 찍힌 키. 아래 유스케이스는 이 타입만 받으니 검사를 건너뛴 값은 못 들어온다 */
export type ApiKey = string & { readonly [validated]: true };

/** 키를 왜 돌려보냈는지 알려 주는 쪽지. 화면에 그대로 띄우지 않고 문장은 화면이 알아서 고른다 */
export type ApiKeyProblem = "empty";

/** 검사 결과. 잘됐으면 키를, 안 됐으면 까닭을 담아 온다 */
export type ApiKeyCheck =
  | { ok: true; key: ApiKey }
  | { ok: false; problem: ApiKeyProblem };

/**
 * 사람이 적어 넣은 글자를 키로 받아 줄지 살펴본다.
 * 빈칸만 아니면 통과다 — 맞는 키인지 아닌지는 실제로 써 봐야 알 수 있으니까.
 */
export function checkApiKey(raw: string): ApiKeyCheck {
  // 복사해서 붙이면 앞뒤에 빈칸이나 줄바꿈이 딸려 오는 일이 많다. 그래서 먼저 떼어 낸다
  const key = raw.trim();

  // 아무것도 안 적고 눌렀을 때만 막는다. 빈칸을 넣어 봤자 쓸 데가 없기 때문이다
  if (key.length === 0) return { ok: false, problem: "empty" };

  // 여기까지 왔으면 검사를 통과한 것이니 이제야 도장을 찍어 돌려준다
  return { ok: true, key: key as ApiKey };
}

/**
 * 키를 화면에 보여 줄 때 쓰는 가림막. 앞뒤만 남기고 가운데는 점으로 덮는다.
 * 옆 사람이 넘겨다보거나 화면을 같이 볼 때 키가 통째로 드러나지 않게 하려는 것이다.
 */
export function maskApiKey(key: ApiKey): string {
  // 너무 짧은 키는 앞뒤를 남기면 거의 다 보여 버린다. 그래서 통째로 덮는다
  if (key.length <= 12) return "·".repeat(key.length);

  // "아, 그 키구나" 하고 알아볼 만큼만 앞을 남긴다
  const head = key.slice(0, 6);

  // 키를 여러 개 쓰는 사람은 끝 네 글자로 어느 게 어느 건지 가린다
  const tail = key.slice(-4);

  // 가운데는 늘 점 여덟 개로 덮는다. 그래야 키가 몇 글자인지도 안 들킨다
  return `${head}${"·".repeat(8)}${tail}`;
}
