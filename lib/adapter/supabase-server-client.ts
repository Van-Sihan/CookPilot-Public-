/**
 * 어댑터 · 수파베이스로 들어가는 문.
 *
 * 이 파일은 **서버에서만** 불린다. 브라우저에서 부르면 안 된다.
 * 교재가 짚은 대로(9장 「RLS 정책」) 데이터베이스 일은 서버에서 하는 편이 안전하다.
 * 브라우저에서 직접 다녀오면 우리 서버를 거치지 않아 무슨 일이 오갔는지 볼 수도,
 * 막을 수도 없다. 그래서 수파베이스와 이야기하는 자리를 여기 한 군데로 모았다.
 *
 * 로그인 표(세션)는 쿠키에 담긴다. 그래서 이 문을 열 때마다
 * 지금 요청에 딸려 온 쿠키를 통째로 넘겨준다.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 수파베이스 주소.
 *
 * `.env.local` 에서 읽는다. 값이 없으면 여기서 바로 멈춘다 —
 * 없는 채로 넘어가면 "fetch failed" 같은 엉뚱한 말로 실패해서
 * 무엇이 빠졌는지 알아내는 데 한참 걸린다.
 */
// [F1][함수] readEnv(): 환경 변수에서 수파베이스 주소와 키를 읽는다
// 입력: process.env → 처리: 없으면 바로 오류 → 출력: {url, key}
function readEnv(): { url: string; key: string } {
  // 프로젝트마다 다른 주소. [Connect] 창에서 복사한 그 값이다
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  /* 공개해도 되는 열쇠. 수파베이스가 이름을 바꾸는 중이라 둘 다 받아 준다.
     교재 188쪽도 같은 이야기를 한다 — Publishable Key 와 Anon Key 는 서로 호환된다 */
  /* ?? 가 아니라 || 를 쓴다. 버셀에 빈 칸으로 등록된 변수는 undefined 가 아니라
     빈 문자열로 들어와서, ?? 로는 걸러지지 않고 그대로 열쇠 자리에 앉는다 */
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 둘 중 하나라도 비었으면 무엇이 없는지 이름을 대며 멈춘다
  // [F2][에러] 주소나 키가 없음 → 여기서 던진다(없는 채로 부르면 'fetch failed' 만 나온다)
  if (!url || !key) {
    throw new Error(
      ".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣어 주세요. " +
        "수파베이스 대시보드 맨 위 [Connect] 에서 복사할 수 있습니다.",
    );
  }

  return { url, key };
}

/**
 * 서버에서 쓰는 수파베이스 손잡이를 하나 만들어 준다.
 *
 * 만들어 두고 돌려쓰지 않고 부를 때마다 새로 만드는 것이 중요하다.
 * 하나를 여러 요청이 나눠 쓰면 A가 로그인한 표를 B가 들고 다니게 된다.
 */
// [F3][함수] createSupabaseServerClient(): 서버에서 쓰는 수파베이스 손잡이를 만든다
// 입력: 없음 → 처리: readEnv(F1) + 쿠키 저장소 연결 → 출력: SupabaseClient (비동기)
export async function createSupabaseServerClient() {
  const { url, key } = readEnv();

  // Next.js 16 에서 cookies() 는 기다려야 하는 함수다. 예전처럼 그냥 부르면 안 된다
  // [F4][외부] ▷ next/headers cookies() 로 요청의 쿠키를 읽어 온다 → cookieStore
  const cookieStore = await cookies();

  // [F5][반환] 손잡이 → 모든 supabase-* 어댑터가 이 함수 하나로 손잡이를 얻는다
  return createServerClient(url, key, {
    cookies: {
      // 수파베이스가 "지금 쿠키가 뭐뭐 있냐" 고 물을 때 답해 준다
      getAll() {
        return cookieStore.getAll();
      },

      // 로그인·로그아웃으로 표가 바뀌면 수파베이스가 이쪽으로 새 쿠키를 건네준다
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* 화면을 그리는 도중에는 쿠키를 심을 수 없어서 여기로 온다.
             HTTP 는 내용을 보내기 시작한 뒤에 쿠키를 붙이지 못하기 때문이다.
             그래도 괜찮다 — 표를 새로 발급하는 일은 proxy.ts 가 맡고 있다.
             여기서 막지 않고 넘어가야 화면이 멀쩡히 그려진다 */
        }
      },
    },
  });
}
