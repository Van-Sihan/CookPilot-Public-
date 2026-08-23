/**
 * 프레임워크 계층 · 모든 요청이 화면에 닿기 전에 먼저 들르는 곳.
 *
 * Next.js 16 부터 이 파일의 이름은 `middleware.ts` 가 아니라 `proxy.ts` 다.
 * 이름과 내보내는 함수 이름만 바뀌었고 하는 일은 같다.
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md)
 *
 * 여기서 하는 일은 하나 — **로그인 표를 갱신하는 것**이다.
 *
 * 수파베이스의 로그인 표는 한 시간쯤 지나면 만료된다. 만료되기 전에 새 표로
 * 바꿔 두지 않으면, 한참 쓰다가 갑자기 로그아웃된 것처럼 튕긴다.
 * getUser() 를 한 번 부르면 수파베이스가 알아서 새 표를 건네주고,
 * 우리는 그걸 응답 쿠키에 실어 보낸다.
 *
 * 화면을 그리는 도중에는 쿠키를 심을 수 없어서([[supabase-server-client]] 참고)
 * 이 일을 할 수 있는 자리가 여기뿐이다.
 *
 * 주의 — 이 파일은 요청마다 돌기 때문에 무거운 일을 하면 모든 페이지가 느려진다.
 * 다녀오는 곳이 하나뿐인 것은 그래서다.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  /* 아무것도 안 바꾸고 그냥 통과시키는 응답을 먼저 만들어 둔다.
     아래에서 쿠키가 바뀌면 이 값을 새 응답으로 갈아 끼운다 */
  let response = NextResponse.next({ request });

  // 주소와 열쇠. 없으면 갱신은 건너뛰고 요청만 통과시킨다
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /* 열쇠가 아직 없다고 사이트 전체를 멈추면 안 된다.
     로그인이 필요 없는 소개 페이지까지 못 보게 되기 때문이다 */
  if (!url || !key) return response;

  /* 손잡이를 여기서 새로 만든다. [[supabase-server-client]] 를 가져다 쓰지 않는 이유는
     그쪽이 next/headers 의 cookies() 를 쓰는데, 이 자리에서는 쿠키를 요청·응답
     양쪽에서 직접 다뤄야 하기 때문이다. Next.js 문서도 이 파일은 다른 모듈에
     기대지 말라고 못 박고 있다 */
  const supabase = createServerClient(url, key, {
    cookies: {
      // 브라우저가 들고 온 쿠키를 그대로 넘겨준다
      getAll() {
        return request.cookies.getAll();
      },

      // 표가 갱신되면 수파베이스가 새 쿠키를 이쪽으로 건네준다
      setAll(cookiesToSet) {
        // 먼저 요청 쪽에 심는다. 뒤에 이어질 화면이 새 표를 보게 하려는 것이다
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        // 바뀐 요청으로 응답을 새로 만든다
        response = NextResponse.next({ request });

        // 그리고 브라우저가 저장하도록 응답에도 심는다. 이래야 다음 요청에 딸려 온다
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /* 이 한 줄이 이 파일의 전부다. 돌려주는 값은 쓰지 않는다 —
     부르는 것만으로 표가 갱신되고 위 setAll 이 불린다.
     getSession() 이 아니라 getUser() 를 쓰는 것이 중요하다.
     getSession() 은 쿠키를 그냥 믿기만 해서 갱신이 일어나지 않는다 */
  await supabase.auth.getUser();

  return response;
}

export const config = {
  /*
   * 어디에 적용할지 고른다. 고르지 않으면 그림·글꼴·CSS 파일 하나하나까지
   * 전부 여기를 거치게 되어 사이트가 눈에 띄게 느려진다.
   *
   * 아래 규칙은 "이것들만 빼고 전부" 라는 뜻이다.
   *   _next/static  — 만들어 둔 자바스크립트와 CSS
   *   _next/image   — Next.js 가 줄여 놓은 그림
   *   favicon.ico   — 탭에 뜨는 아이콘
   *   마지막 줄     — png·svg 처럼 확장자로 끝나는 파일들
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
