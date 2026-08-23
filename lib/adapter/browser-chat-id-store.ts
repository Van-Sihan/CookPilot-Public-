/**
 * 어댑터 · 지금 이어 붙이는 대화 id 를 브라우저에 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 ChatIdStore 약속을 localStorage 로 채워 준다.
 * 로그인이 붙어 계정에 따라다니게 만들려면 이 파일만 갈아 끼우면 된다.
 *
 * 담는 값이 글자 하나뿐이라 다른 저장소들처럼 캐시를 두지 않아도 된다 —
 * 글자는 `===` 로 견주면 그대로 같은 값이다. 객체였다면 매번 새로 만들어져
 * 화면이 끝없이 다시 그려졌을 것이다.
 */

import type { ChatIdStore } from "@/lib/usecase/ask-kitchen";

/** 담아 둘 때 붙이는 이름표. 다른 값과 섞이지 않게 서비스 이름을 앞에 붙였다 */
const STORAGE_KEY = "cookpilot.chat-id";

/** "바뀌면 알려 줘" 하고 부탁한 쪽들의 명단. 같은 탭 안에서 생긴 변화를 전하는 길이다 */
const listeners = new Set<() => void>();

/** 명단에 있는 모두에게 한 번씩 알린다 */
// [F1][함수] notify(): 명단에 있는 모두에게 '바뀌었다' 고 알린다
function notify() {
  listeners.forEach((fn) => fn());
}

// [F2][함수] browserChatIdStore: ChatIdStore 약속을 localStorage 로 채운다
// 로그인이 없어서 '내 대화' 를 가리는 방법이 이 id 하나다
export const browserChatIdStore: ChatIdStore = {
  // [F3][함수] load(): 이어 붙일 대화 id 를 꺼낸다 → 출력: id 또는 null
  load() {
    // 서버에서 화면을 그리는 동안에는 window 가 아예 없다
    if (typeof window === "undefined") return null;

    return window.localStorage.getItem(STORAGE_KEY);
  },

  // [F4][함수] save(id): 새로 열린 대화 id 를 담는다 → 처리: localStorage 기록 후 notify
  save(id: string) {
    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, id);

    /* storage 신호는 다른 탭에만 간다. 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F5][함수] clear(): 담아 둔 대화 id 를 지운다 (대화 비우기)
  clear() {
    // 빈 글자로 덮지 않고 아예 지운다. 남아 있으면 "대화가 있다" 로 잘못 읽힌다
    window.localStorage.removeItem(STORAGE_KEY);

    notify();
  },

  // [F6][함수] subscribe(onChange): 바뀌면 알려 달라고 명단에 올린다 → 출력: 해제 함수
  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 값을 바꾸면 이 신호로 온다 */
    window.addEventListener("storage", onChange);

    // 화면이 사라질 때 이 함수를 부르면 걸어 둔 것을 모두 거둔다
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  },
};
