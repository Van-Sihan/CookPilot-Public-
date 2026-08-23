/**
 * 어댑터 · 아직 없는 서버를 대신하는 자리.
 *
 * 유스케이스가 적어 둔 AuthGateway 약속을 지키기는 하는데,
 * 하는 일은 "아직 준비 안 됐습니다" 하고 답하는 것뿐이다.
 *
 * 왜 이런 걸 두는가. 화면은 이미 다 만들 수 있고 검사도 다 돌아가는데
 * 서버만 없기 때문이다. 여기에 이 파일이 없으면 화면이 유스케이스를 부를 수 없고,
 * 그러면 화면 쪽에 "아직 서버가 없으니까" 라는 사정을 적어 넣게 된다.
 * 그건 화면이 알 일이 아니다.
 *
 * 서버가 생기면 이 파일 대신 진짜로 다녀오는 어댑터를 만들어
 * [[login-form]] 이 넘겨주는 값만 바꾸면 된다.
 * 도메인과 유스케이스는 한 글자도 안 바뀐다.
 */

import type { AuthGateway } from "@/lib/usecase/sign-in";

/** 서버가 있는 척하지 않는다. 늘 "아직 없다" 고 답한다 */
// [F1][함수] pendingAuthGateway: 아직 서버가 없을 때 자리를 채우는 가짜 게이트웨이
// 입력: 없음 → 처리: 늘 'unavailable' 로 답함 → 출력: GatewayAnswer
export const pendingAuthGateway: AuthGateway = {
  // [F2][반환] 늘 {ok:false, reason:'unavailable'} → 화면이 '아직 준비 중' 으로 알린다
  async signIn() {
    // 값을 받기는 하지만 쓰지 않는다. 보낼 곳이 없기 때문이다.
    // 특히 비밀번호는 어디에도 남기지 않는다 — 담아 둘 이유가 없다
    return { ok: false, reason: "unavailable" };
  },
};
