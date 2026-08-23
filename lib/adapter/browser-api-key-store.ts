/**
 * 어댑터 · 브라우저에 키를 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 ApiKeyStore 약속을 브라우저 기능으로 채워 준다.
 * localStorage 를 아는 파일은 여기 하나뿐이다 — 나중에 서버에 담는 방식으로 바꾸더라도
 * 이 파일만 갈아 끼우면 되고 도메인과 유스케이스는 건드릴 일이 없다.
 */

import type { ApiKey } from "@/lib/domain/api-key";
import type { ApiKeyStore } from "@/lib/usecase/enter-with-api-key";

/** 담아 둘 때 붙이는 이름표. 다른 값과 섞이지 않게 서비스 이름을 앞에 붙였다 */
const STORAGE_KEY = "cookpilot.gemini-key";

/** "키 바뀌면 알려 줘" 하고 부탁한 쪽들의 명단. 같은 탭 안에서 생긴 변화를 전하는 길이다 */
const listeners = new Set<() => void>();

/** 명단에 있는 모두에게 한 번씩 알린다 */
// [F1][함수] notify(): 명단에 있는 모두에게 '바뀌었다' 고 알린다
// 입력: 없음(모듈의 listeners) → 처리: 하나씩 호출 → 출력: 없음
function notify() {
  // 알리는 도중에 누가 명단에서 빠질 수도 있지만 Set 은 그 정도는 견딘다
  // [F2][반복] listeners 전체를 훑으며 각 콜백 호출 → useSyncExternalStore 가 다시 그린다
  listeners.forEach((fn) => fn());
}

/**
 * 키는 이 브라우저 안에만 있고 서버로 보내지 않는다 — 요금제 안내에 그렇게 적어 두었다.
 * 그래서 쿠키가 아니라 localStorage 를 쓴다. 쿠키는 요청할 때마다 서버로 따라가 버린다.
 */
// [F3][함수] browserApiKeyStore: 유스케이스의 ApiKeyStore 약속을 localStorage 로 채운다
// save/load/clear/subscribe 네 가지를 아래에서 하나씩 구현한다
export const browserApiKeyStore: ApiKeyStore = {
  // [F4][함수] save(key): 키를 담아 둔다
  // 입력: key → 처리: localStorage 기록 후 notify → 출력: 없음
  save(key: ApiKey) {
    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, key);

    /* storage 신호는 다른 탭에만 간다. 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F5][함수] load(): 담아 둔 키를 꺼낸다
  // 입력: 없음 → 처리: localStorage 읽기 → 출력: ApiKey 또는 null
  load() {
    // 서버에서 화면을 그리는 동안에는 window 가 아예 없다. 그래서 먼저 막는다
    if (typeof window === "undefined") return null;

    // 이름표로 찾아 꺼낸다. 없으면 null 이 온다
    const saved = window.localStorage.getItem(STORAGE_KEY);

    // 여기 담긴 값은 넣을 때 이미 검사를 거친 것이라 그대로 키로 본다
    return saved ? (saved as ApiKey) : null;
  },

  // [F6][함수] clear(): 담아 둔 키를 지운다
  // 입력: 없음 → 처리: localStorage 삭제 후 notify → 출력: 없음
  clear() {
    // 빈 값으로 덮지 않고 아예 지운다. 남아 있으면 "키가 있다" 로 잘못 읽힌다
    window.localStorage.removeItem(STORAGE_KEY);

    /* 넣을 때와 마찬가지로 지금 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F7][함수] subscribe(onChange): 바뀌면 알려 달라고 명단에 올린다
  // 입력: onChange → 처리: listeners 등록 + storage 이벤트 연결 → 출력: 해제 함수
  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 키를 넣거나 지우면 이 신호로 온다 */
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
