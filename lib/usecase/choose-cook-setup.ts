/**
 * 유스케이스 · "안내 목소리와 답변 속도를 골라 두기".
 *
 * 고른 값을 어디에 담아 두는지는 이 파일이 모른다. CookSetupStore 라는 약속으로
 * 미뤄 두고, 진짜 담는 방법은 어댑터가 나중에 건네준다.
 * `enter-with-api-key.ts` 와 같은 짜임새다 — 두 화면이 서로 다른 방식으로
 * 값을 담으면, 나중에 서버 저장으로 옮길 때 두 번 고쳐야 한다.
 */

import {
  DEFAULT_SPEED,
  modelForSpeed,
  type AnswerSpeed,
} from "@/lib/domain/gemini-model";
import {
  DEFAULT_GENDER,
  DEFAULT_TONE,
  type VoiceGender,
  type VoiceTone,
} from "@/lib/domain/voice-tone";

/** 사람이 준비 단계에서 골라 두는 것 두 가지 */
export type CookSetup = {
  /** 안내 목소리의 성별 */
  gender: VoiceGender;
  /** 안내 목소리의 말투 */
  tone: VoiceTone;
  /** 답변 속도 — 어떤 모델을 부를지가 여기서 갈린다 */
  speed: AnswerSpeed;
};

/**
 * 아직 아무것도 안 고른 사람이 보게 될 값.
 *
 * 반드시 이 하나를 돌려 써야 한다. 부를 때마다 새 객체를 만들면
 * React 의 useSyncExternalStore 가 "값이 바뀌었다" 고 오해해서 끝없이 다시 그린다.
 */
export const DEFAULT_SETUP: CookSetup = Object.freeze({
  gender: DEFAULT_GENDER,
  tone: DEFAULT_TONE,
  speed: DEFAULT_SPEED,
});

/** 고른 값을 담아 두는 곳이라면 이 네 가지는 할 줄 알아야 한다는 약속 */
export type CookSetupStore = {
  /** 고른 값을 넣어 둔다. 넣을 수 없는 상황이면 오류를 낸다 */
  save(setup: CookSetup): void;
  /** 넣어 둔 값을 꺼낸다. 없으면 null */
  load(): CookSetup | null;
  /** 넣어 둔 값을 버린다 */
  clear(): void;
  /** 값이 바뀌면 알려 준다. 돌려주는 함수를 부르면 "이제 그만" 이 된다 */
  subscribe(onChange: () => void): () => void;
};

/**
 * 고른 값을 담아 둔다.
 * 시크릿 창처럼 저장이 막힌 곳에서도 요리는 할 수 있어야 하므로,
 * 담지 못했다고 해서 다음 화면으로 못 가게 막지는 않는다. 됐는지 여부만 알려 준다.
 */
export function keepCookSetup(setup: CookSetup, store: CookSetupStore): boolean {
  try {
    // 담는 방법은 어댑터가 안다
    store.save(setup);
    // 다음에 왔을 때도 이 값이 그대로 나온다
    return true;
  } catch {
    // 이번 방문에만 쓰고 사라진다는 뜻이다. 화면은 이 값을 보고 안내를 띄울지 정한다
    return false;
  }
}

/** 담아 둔 값을 꺼낸다. 없거나 못 읽으면 늘 같은 기본값 하나를 돌려준다 */
export function findCookSetup(store: CookSetupStore): CookSetup {
  try {
    // 꺼내 오는 방법은 어댑터가 안다. 없으면 기본값으로 메운다
    return store.load() ?? DEFAULT_SETUP;
  } catch {
    // 못 읽는 상황은 "안 골랐다" 와 똑같이 봐도 아무 문제가 없다
    return DEFAULT_SETUP;
  }
}

/** 담아 둔 값을 버린다. "전부 지우기" 가 이걸 부른다 */
export function forgetCookSetup(store: CookSetupStore): void {
  try {
    // 버리는 방법도 어댑터가 안다
    store.clear();
  } catch {
    // 못 버렸다고 알려 줘도 사람이 할 수 있는 일이 없어서 조용히 넘어간다
  }
}

/** 담아 둔 값이 바뀌는지 지켜본다. 돌려주는 함수를 부르면 그만 본다 */
export function watchCookSetup(store: CookSetupStore, onChange: () => void) {
  // "그만 보기" 함수를 그대로 올려 보낸다. 화면이 사라질 때 그걸 불러 정리한다
  return store.subscribe(onChange);
}

/**
 * 지금 고른 값으로 글자 일을 맡길 모델 이름을 구한다.
 * 유튜브 레시피 옮기기·냉장고 재료로 찾기가 이 모델을 쓴다.
 * 목소리를 알아듣는 모델은 고를 수 없어서 여기 끼지 않는다.
 */
export function modelForSetup(setup: CookSetup): string {
  // 속도에서 모델로 가는 표는 도메인이 쥐고 있다
  return modelForSpeed(setup.speed);
}
