/**
 * 유스케이스 · "키를 넣고 들어가기".
 *
 * 이 파일은 검사 규칙(도메인)만 알고, 키를 어디에 담아 두는지는 모른다.
 * 담아 두는 일은 ApiKeyStore 라는 약속으로 미뤄 두고,
 * 진짜 담는 방법은 어댑터가 나중에 건네준다.
 * 그래서 이 파일은 브라우저가 없는 곳에서도 그대로 돌아간다.
 */

import { checkApiKey, type ApiKey, type ApiKeyProblem } from "@/lib/domain/api-key";

/** 키를 담아 두는 곳이라면 이 네 가지는 할 줄 알아야 한다는 약속. 진짜 방법은 lib/adapter 에 있다 */
export type ApiKeyStore = {
  /** 키를 넣어 둔다. 넣을 수 없는 상황이면 오류를 낸다 */
  save(key: ApiKey): void;
  /** 넣어 둔 키를 꺼낸다. 없으면 null */
  load(): ApiKey | null;
  /** 넣어 둔 키를 버린다 */
  clear(): void;
  /**
   * 키가 바뀌면 알려 준다. 돌려주는 함수를 부르면 "이제 그만 알려 줘" 가 된다.
   * 화면이 "키 있어? 키 있어?" 하고 계속 물어보지 않고, 바뀔 때만 다시 그리게 하려는 것이다.
   */
  subscribe(onChange: () => void): () => void;
};

/** 들어가기를 눌렀을 때 생길 수 있는 일. 화면은 이 답만 보고 다음 모습을 정한다 */
export type EnterResult =
  | { ok: true; key: ApiKey }
  | { ok: false; reason: ApiKeyProblem | "storage" };

/**
 * 사람이 적어 넣은 글자를 검사하고, 통과하면 담아 두는 일까지 마친다.
 * 화면은 이 함수 하나만 부르면 되고, 검사 규칙도 담는 방법도 몰라도 된다.
 */
export function enterWithApiKey(raw: string, store: ApiKeyStore): EnterResult {
  // 모양 검사는 통째로 도메인에 맡긴다. 여기서 또 따지면 규칙이 두 군데로 갈라져 헷갈린다
  const checked = checkApiKey(raw);

  // 검사에서 걸렸으면 담아 두려는 시도조차 하지 않고 까닭만 그대로 올려 보낸다
  if (!checked.ok) return { ok: false, reason: checked.problem };

  try {
    // 시크릿 창이거나 저장을 막아 둔 브라우저면 바로 이 줄에서 오류가 난다
    store.save(checked.key);
  } catch {
    // 담지 못했을 뿐 키 자체는 멀쩡하다. 그러니 모양이 틀린 것과는 다른 까닭으로 알린다
    return { ok: false, reason: "storage" };
  }

  // 검사도 저장도 끝났다. 화면은 이제 다음 모습으로 넘어가도 된다
  return { ok: true, key: checked.key };
}

/**
 * 예전에 넣어 둔 키가 있는지 본다.
 * 다시 찾아온 사람에게 입력칸을 처음부터 또 보여 주지 않으려고 쓴다.
 */
export function findSavedKey(store: ApiKeyStore): ApiKey | null {
  try {
    // 꺼내 오는 방법은 어댑터가 안다. 여기서는 오류만 감싸 준다
    return store.load();
  } catch {
    // 못 읽는 상황은 "넣어 둔 키가 없다" 와 똑같이 봐도 아무 문제가 없다
    return null;
  }
}

/** 넣어 둔 키를 버린다. 다른 키로 갈아 끼우고 싶을 때 쓴다 */
export function forgetSavedKey(store: ApiKeyStore): void {
  try {
    // 버리는 방법도 어댑터가 안다
    store.clear();
  } catch {
    // 못 버렸다고 알려 줘도 사람이 할 수 있는 일이 없어서 조용히 넘어간다
  }
}

/**
 * 넣어 둔 키가 바뀌는지 지켜본다. 돌려주는 함수를 부르면 그만 본다.
 * 화면은 이 함수만 알면 되고 저장하는 곳을 직접 건드릴 일이 없다.
 */
export function watchSavedKey(store: ApiKeyStore, onChange: () => void) {
  // "그만 보기" 함수를 그대로 올려 보낸다. 화면이 사라질 때 그걸 불러 정리한다
  return store.subscribe(onChange);
}
