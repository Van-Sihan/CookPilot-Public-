/**
 * 어댑터 · 고른 목소리·속도를 브라우저에 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 CookSetupStore 약속을 localStorage 로 채워 준다.
 * 나중에 계정에 따라다니게 만들려면 이 파일만 갈아 끼우면 된다.
 */

import { resolveAnswerSpeed } from "@/lib/domain/gemini-model";
import { resolveVoiceGender, resolveVoiceTone } from "@/lib/domain/voice-tone";
import type { CookSetup, CookSetupStore } from "@/lib/usecase/choose-cook-setup";

/** 담아 둘 때 붙이는 이름표. 키와 섞이지 않게 서비스 이름을 앞에 붙였다 */
const STORAGE_KEY = "cookpilot.cook-setup";

/** "바뀌면 알려 줘" 하고 부탁한 쪽들의 명단. 같은 탭 안에서 생긴 변화를 전하는 길이다 */
const listeners = new Set<() => void>();

/**
 * 마지막으로 읽은 글자와, 그 글자를 풀어 만든 객체.
 *
 * 이 두 줄이 없으면 화면이 멈추지 않는다. React 는 load() 가 돌려준 값을
 * 지난번 값과 `===` 로 견줘 보는데, 부를 때마다 JSON.parse 로 새 객체를 만들면
 * 내용이 같아도 늘 "다른 값" 이 되어 다시 그리기를 끝없이 되풀이한다.
 * 그래서 글자가 그대로면 만들어 둔 객체를 그대로 돌려준다.
 */
let cachedRaw: string | null = null;
let cachedSetup: CookSetup | null = null;

/** 명단에 있는 모두에게 한 번씩 알린다 */
function notify() {
  // 알리는 도중에 누가 명단에서 빠질 수도 있지만 Set 은 그 정도는 견딘다
  listeners.forEach((fn) => fn());
}

/** 담아 둔 글자를 고른 값으로 푼다. 손상됐으면 null 로 본다 */
function parse(raw: string): CookSetup | null {
  try {
    // 사람이 개발자 도구로 아무 글자나 넣어 뒀을 수도 있다
    const parsed: unknown = JSON.parse(raw);

    // 객체가 아니면 더 볼 것이 없다
    if (typeof parsed !== "object" || parsed === null) return null;

    // 안쪽 칸을 꺼내 보려고 이름 있는 자루로 옮긴다
    const bag = parsed as Record<string, unknown>;

    // 칸마다 도메인에 물어본다. 모르는 값이면 도메인이 기본값으로 돌려준다
    return {
      gender: resolveVoiceGender(bag.gender),
      tone: resolveVoiceTone(bag.tone),
      speed: resolveAnswerSpeed(bag.speed),
    };
  } catch {
    // JSON 이 아니면 담아 둔 적 없는 것과 같이 본다
    return null;
  }
}

export const browserCookSetupStore: CookSetupStore = {
  save(setup: CookSetup) {
    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));

    /* storage 신호는 다른 탭에만 간다. 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  load() {
    // 서버에서 화면을 그리는 동안에는 window 가 아예 없다
    if (typeof window === "undefined") return null;

    // 이름표로 찾아 꺼낸다. 없으면 null 이 온다
    const raw = window.localStorage.getItem(STORAGE_KEY);

    // 글자가 지난번과 똑같으면 만들어 둔 객체를 그대로 돌려준다 — 위에 적어 둔 까닭이다
    if (raw !== cachedRaw) {
      // 새 글자를 기억해 두고
      cachedRaw = raw;
      // 그 글자로 만든 객체도 함께 기억해 둔다
      cachedSetup = raw === null ? null : parse(raw);
    }

    // 기억해 둔 객체를 그대로 넘긴다. 같은 글자인 동안에는 늘 같은 값이 나간다
    return cachedSetup;
  },

  clear() {
    // 빈 값으로 덮지 않고 아예 지운다. 남아 있으면 "골라 뒀다" 로 잘못 읽힌다
    window.localStorage.removeItem(STORAGE_KEY);

    /* 넣을 때와 마찬가지로 지금 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 값을 바꾸면 이 신호로 온다 */
    window.addEventListener("storage", onChange);

    // 화면이 사라질 때 이 함수를 부르면 걸어 둔 것을 모두 거둔다
    return () => {
      // 명단에서 빼서 같은 탭 알림을 끊고
      listeners.delete(onChange);

      // 다른 탭 알림도 함께 거둔다. 하나만 거두면 나머지가 계속 살아남는다
      window.removeEventListener("storage", onChange);
    };
  },
};
