/**
 * 어댑터 · 수파베이스로 진짜 다녀오는 곳.
 *
 * [[pending-auth-gateway]] 가 자리만 지키고 있던 그 약속을 여기서 실제로 지킨다.
 * 유스케이스가 적어 둔 AuthGateway·SignUpGateway 를 그대로 구현할 뿐,
 * 화면이 무엇을 보여 줄지도 검사 규칙이 무엇인지도 여기서는 모른다.
 *
 * 이 파일이 하는 일은 사실상 통역이다.
 * 수파베이스가 돌려주는 오류 코드를 우리가 쓰기로 한 낱말
 * (rejected · taken · weak …) 로 바꿔 준다.
 * 이 통역을 여기서 해 두면, 나중에 다른 인증 서비스로 갈아타도
 * 갈아 끼울 파일은 이것 하나다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { Email, Password } from "@/lib/domain/credentials";
import type { DisplayName } from "@/lib/domain/display-name";
import type { AuthGateway, GatewayAnswer } from "@/lib/usecase/sign-in";
import type { SignUpAnswer, SignUpGateway } from "@/lib/usecase/sign-up";

/**
 * 수파베이스가 오류에 붙여 보내는 코드.
 *
 * 문구가 아니라 코드로 갈래를 나눈다. 문구는 수파베이스가 언제든 고칠 수 있고
 * 영어라서, 문구를 비교하도록 짜 두면 어느 날 조용히 안 맞게 된다.
 */
type SupabaseErrorish = { code?: string; status?: number } | null;

/** 로그인·가입 양쪽에서 똑같이 "잠깐 쉬었다 오라" 는 뜻인 코드 */
function isRateLimited(error: SupabaseErrorish): boolean {
  // 429 는 "너무 자주 두드린다" 는 뜻으로 정해진 번호다
  return error?.status === 429 || error?.code === "over_request_rate_limit";
}

/** 로그인을 맡는다 */
export const supabaseAuthGateway: AuthGateway & SignUpGateway = {
  async signIn(email: Email, password: Password): Promise<GatewayAnswer> {
    // 요청마다 새 손잡이를 만든다. 돌려쓰면 남의 로그인 표가 섞인다
    const supabase = await createSupabaseServerClient();

    /* 이메일과 비밀번호로 들어간다.
       성공하면 수파베이스가 쿠키에 로그인 표를 심어 준다 — 우리가 따로 할 일이 없다 */
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 오류가 없으면 들어간 것이다
    if (!error) return { ok: true };

    /* 가입 확인 메일을 아직 안 누른 경우.
       수파베이스 대시보드에서 [Confirm Email] 을 켜 두면 여기로 온다.
       "비밀번호가 틀렸다" 로 뭉뚱그리면 사용자가 영영 못 들어오므로 따로 알린다 */
    if (error.code === "email_not_confirmed") {
      return { ok: false, reason: "unconfirmed" };
    }

    // 너무 자주 시도했다. 값이 틀린 것과는 다른 실패다
    if (isRateLimited(error)) return { ok: false, reason: "unreachable" };

    /* 남은 것은 대개 이메일이나 비밀번호가 안 맞는 경우다.
       어느 쪽이 틀렸는지는 수파베이스도 알려 주지 않는다 —
       그걸 알려 주면 남의 계정이 있는지 없는지 떠보는 데 쓰인다 */
    return { ok: false, reason: "rejected" };
  },

  async signUp(
    email: Email,
    password: Password,
    name: DisplayName,
  ): Promise<SignUpAnswer> {
    const supabase = await createSupabaseServerClient();

    // 계정을 새로 만든다
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        /* 여기 담은 값은 auth.users 의 raw_user_meta_data 로 들어간다.
           그 표에 계정이 만들어지는 순간 우리 트리거(handle_new_user)가 돌면서
           이 칸을 꺼내 public.profiles 의 이름으로 옮겨 적는다.
           그래서 앱이 프로필을 따로 만들 필요가 없다 — 계정과 프로필이
           같은 트랜잭션 안에서 생기므로 둘이 어긋날 틈이 없다.

           칸 이름을 display_name 으로 맞춰야 한다. 트리거가 이 이름으로 찾는다 */
        data: { display_name: name },
      },
    });

    if (error) {
      // 이미 그 주소로 만들어진 계정이 있다
      if (error.code === "user_already_exists") {
        return { ok: false, reason: "taken" };
      }

      /* 수파베이스 기준으로도 비밀번호가 약하다.
         우리 도메인 규칙(8글자)이 수파베이스 기본값(6글자)보다 깐깐해서
         평소에는 여기까지 오지 않는다. 대시보드에서 기준을 더 올린 경우에만 온다 */
      if (error.code === "weak_password") {
        return { ok: false, reason: "weak" };
      }

      // 가입 메일 보내기에도 횟수 제한이 있다
      if (isRateLimited(error) || error.code === "over_email_send_rate_limit") {
        return { ok: false, reason: "too-many" };
      }

      // 뜻을 알아내지 못한 오류. 아는 척하지 않고 "다녀오지 못했다" 로 넘긴다
      return { ok: false, reason: "unreachable" };
    }

    /* [Confirm Email] 이 꺼져 있으면 가입과 동시에 로그인까지 되어 session 이 온다.
       켜져 있으면 session 이 null 이고, 메일함의 링크를 눌러야 들어올 수 있다.
       이 한 줄로 화면이 "바로 시작" 과 "메일함을 봐 주세요" 로 갈린다 */
    return { ok: true, needsConfirm: data.session === null };
  },
};

/**
 * 로그아웃. 유스케이스를 거칠 만한 규칙이 없어서 어댑터에 바로 둔다.
 *
 * 검사할 값도 없고 갈래도 없다. 이런 일까지 유스케이스로 감싸면
 * 아무 판단도 안 하는 파일만 하나 늘어난다.
 */
export async function supabaseSignOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // 쿠키에 있던 로그인 표를 지운다
  await supabase.auth.signOut();
}

/**
 * 지금 들어와 있는 사람의 이메일을 알려 준다. 아무도 없으면 null.
 *
 * getSession() 이 아니라 getUser() 를 쓰는 것이 중요하다.
 * getSession() 은 쿠키에 적힌 내용을 그냥 믿는데, 쿠키는 브라우저 쪽에 있는 값이라
 * 손댈 수 있다. getUser() 는 수파베이스에 한 번 물어봐서 진짜인지 확인한다.
 */
export async function currentUserEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  // 물어보러 다녀온다
  const { data, error } = await supabase.auth.getUser();

  // 로그인 안 한 사람은 오류로 온다. 그건 잘못된 상황이 아니라 그냥 "없음" 이다
  if (error) return null;

  // 이메일이 없는 계정도 있을 수 있어서(전화 가입 등) 없으면 null 로 맞춰 준다
  return data.user?.email ?? null;
}
