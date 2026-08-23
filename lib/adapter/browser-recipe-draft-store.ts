/**
 * 어댑터 · 지금 하려는 요리를 브라우저에 담아 두는 진짜 방법.
 *
 * 고르기 → 장보기 → 요리 세 화면이 같은 레시피를 봐야 한다.
 * 주소에 실어 나르기엔 레시피가 너무 크고, 화면 상태로 들고 다니면
 * 새로 고침 한 번에 사라진다. 그래서 브라우저에 담아 둔다.
 */

import { readRecipe, type Recipe } from "@/lib/domain/recipe";
import type { RecipeDraftStore } from "@/lib/usecase/plan-recipe";

/** 담아 둘 때 붙이는 이름표 */
const STORAGE_KEY = "cookpilot.recipe-draft";

/** "바뀌면 알려 줘" 하고 부탁한 쪽들의 명단 */
const listeners = new Set<() => void>();

/**
 * 마지막으로 읽은 글자와, 그 글자를 풀어 만든 레시피.
 *
 * 다른 저장소와 같은 까닭이다 — 부를 때마다 JSON.parse 로 새 객체를 만들면
 * 내용이 같아도 React 가 "바뀌었다" 고 오해해서 다시 그리기를 되풀이한다.
 */
let cachedRaw: string | null = null;
let cachedRecipe: Recipe | null = null;

/** 명단에 있는 모두에게 한 번씩 알린다 */
function notify() {
  listeners.forEach((fn) => fn());
}

export const browserRecipeDraftStore: RecipeDraftStore = {
  save(recipe: Recipe) {
    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipe));

    /* storage 신호는 다른 탭에만 간다. 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  load() {
    // 서버에서 화면을 그리는 동안에는 window 가 아예 없다
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(STORAGE_KEY);

    // 글자가 지난번과 똑같으면 만들어 둔 값을 그대로 돌려준다
    if (raw !== cachedRaw) {
      cachedRaw = raw;

      if (raw === null) {
        cachedRecipe = null;
      } else {
        try {
          /* 담을 때 이미 검사를 거친 값이지만 여기서 한 번 더 본다.
             사람이 개발자 도구로 고쳐 놨을 수도 있고, 예전 판에서 담아 둔
             모양이 다른 값이 남아 있을 수도 있다 */
          const read = readRecipe(JSON.parse(raw), 2);
          cachedRecipe = read.ok ? read.recipe : null;
        } catch {
          // JSON 이 아니면 담아 둔 적 없는 것과 같이 본다
          cachedRecipe = null;
        }
      }
    }

    return cachedRecipe;
  },

  clear() {
    // 빈 값으로 덮지 않고 아예 지운다
    window.localStorage.removeItem(STORAGE_KEY);
    notify();
  },

  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 바꾸면 이 신호로 온다 */
    window.addEventListener("storage", onChange);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  },
};
