"use server";

/**
 * 프레임워크 계층 · 폼이 서버로 건네지는 자리.
 *
 * 맨 위 "use server" 한 줄이 이 파일의 성격을 정한다.
 * 여기 적힌 함수들은 **브라우저로 내려가지 않는다.** 브라우저에는 "이 함수를
 * 불러 달라" 는 쪽지만 가고, 실행은 늘 서버에서 된다.
 * 그래서 비밀번호가 자바스크립트 번들에 섞여 나갈 일이 없다.
 * 교재 188쪽이 "보안 인증을 위한 Server Actions" 라고 부른 것이 이것이다.
 *
 * 이 파일이 하는 일은 셋뿐이다.
 *   1. 폼에서 온 FormData 에서 글자를 꺼낸다
 *   2. 유스케이스를 부른다
 *   3. 잘됐으면 다음 화면으로 보내고, 안 됐으면 까닭만 화면에 돌려준다
 *
 * 검사 규칙도(도메인) 수파베이스도(어댑터) 여기서는 모른다.
 *
 * 주의 — Server Action 은 누구나 그 주소로 POST 를 보낼 수 있는 입구다.
 * 그래서 화면에서 이미 걸렀더라도 유스케이스가 서버에서 한 번 더 검사한다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  supabaseAuthGateway,
  supabaseSignOut,
} from "@/lib/adapter/supabase-auth-gateway";
import { signIn } from "@/lib/usecase/sign-in";
import { signUp } from "@/lib/usecase/sign-up";
/* 쪽지의 생김새는 옆 파일에 있다. 여기 두면 안 된다 —
   "use server" 파일은 async 함수 말고는 내보낼 수 없다. [[auth-state]] 참고 */
import type { AuthFormState } from "@/app/actions/auth-state";

/**
 * FormData 에서 글자 하나를 꺼낸다.
 *
 * 폼에서 오는 값은 파일일 수도 있고 아예 없을 수도 있어서 타입이 넉넉하다.
 * 글자가 아니면 빈 글자로 바꿔 둔다 — 그러면 뒤쪽 검사가 알아서 걸러 준다.
 */
// [F1][함수] field(formData, name): FormData 에서 글자 하나를 꺼낸다
// 입력: FormData + 칸 이름 → 처리: 글자가 아니면 빈 글자로 → 출력: string
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * 로그인 단추가 눌렸을 때.
 *
 * 첫 번째 인자 prev 는 쓰지 않지만 자리를 비울 수 없다.
 * useActionState 가 "지난번 상태" 를 늘 첫 번째로 넘겨주기 때문이다.
 */
// [F2][함수] signInAction(prev, formData): 로그인 단추가 눌렸을 때 (Server Action)
// 입력: prev(지난 쪽지, 안 씀) + formData(로그인 폼) → 처리: 유스케이스 호출 → 성공 시 이동
// 출력: SignInFormState 또는 redirect
export async function signInAction(
  prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // 폼에 적힌 두 값을 꺼낸다
  // [F3][호출] formData → field(F1) 두 번 → email, password
  const email = field(formData, "email");
  const password = field(formData, "password");

  // 검사와 로그인은 통째로 유스케이스에 맡긴다. 수파베이스는 게이트웨이 뒤에 있다
  // [F4][호출] email, password, supabaseAuthGateway → signIn(usecase/sign-in) → result
  const result = await signIn(email, password, supabaseAuthGateway);

  // 안 됐으면 까닭과 이메일만 돌려준다. 비밀번호는 절대 되돌려주지 않는다
  // [F5][분기] result.ok → false: 까닭 + 적었던 이메일을 폼에 돌려줌 / true: F6
  if (!result.ok) return { reason: result.reason, email };

  /* 들어왔다. 이제 화면 곳곳의 "로그인 / 로그아웃" 표시가 달라져야 하는데,
     Next.js 가 만들어 둔 화면을 그대로 다시 보여 주면 옛 모습이 남는다.
     그래서 통째로 다시 그리라고 알려 준다 */
  // [F6][외부] ▷ revalidatePath('/', 'layout') — 로그인 여부가 바뀌었으니 캐시를 비운다
  revalidatePath("/", "layout");

  /* 시작 페이지로 보낸다. redirect 는 값을 돌려주는 대신 던져서 흐름을 끊는다.
     그래서 이 줄 아래로는 아무것도 실행되지 않는다 —
     try/catch 안에 넣으면 catch 가 이걸 오류로 잘못 붙잡으니 넣지 않는다 */
  // [F7][반환] ▷ redirect('/start') — 예외를 던져 흐름을 끊는다(try 안에 두면 안 된다)
  redirect("/start");
}

/** 가입 단추가 눌렸을 때 */
// [F8][함수] signUpAction(prev, formData): 가입 단추가 눌렸을 때 (Server Action)
// 입력: prev + formData(가입 폼) → 처리: signUp 호출 → 메일 확인 여부로 갈림
// 출력: SignUpFormState 또는 redirect
export async function signUpAction(
  prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // 가입 폼에만 있는 칸 — 남에게 보일 이름
  // [F9][호출] formData → field(F1) 네 번 → name, email, password, confirm
  const name = field(formData, "name");

  const email = field(formData, "email");
  const password = field(formData, "password");

  // 같은 비밀번호를 한 번 더 적는 자리
  const confirm = field(formData, "confirm");

  // [F10][호출] 네 값 + supabaseAuthGateway → signUp(usecase/sign-up) → result
  const result = await signUp(
    name,
    email,
    password,
    confirm,
    supabaseAuthGateway,
  );

  // 안 됐으면 까닭과 함께 다시 적을 필요 없는 값들을 돌려준다.
  // 비밀번호는 절대 되돌려주지 않는다
  // [F11][분기] result.ok → false: 까닭 + 적었던 값을 폼에 돌려줌 / true: F12
  if (!result.ok) return { reason: result.reason, email, name };

  /* 계정은 만들어졌는데 메일함을 확인해야 하는 경우.
     아직 들어온 것이 아니므로 다음 화면으로 보내지 않고 안내만 띄운다 */
  // [F12][분기] 메일 확인이 필요함 → true: checkMail 쪽지를 돌려줌(이동 안 함) / false: F13
  if (result.needsConfirm) return { reason: null, email, name, checkMail: true };

  // 가입과 동시에 들어왔다. 로그인했을 때와 똑같이 처리한다
  revalidatePath("/", "layout");
  // [F13][반환] ▷ redirect('/start') — 바로 쓸 수 있는 계정이면 키 넣는 화면으로
  redirect("/start");
}

/**
 * 로그아웃.
 *
 * 폼에서 부르므로 FormData 를 받게 되어 있지만 볼 것이 없다.
 * 로그아웃을 링크가 아니라 폼(POST)으로 두는 이유가 있다 —
 * 링크로 두면 남의 페이지에 그 주소를 심어 두는 것만으로 남을 로그아웃시킬 수 있다.
 */
// [F14][함수] signOutAction(): 로그아웃 단추가 눌렸을 때 (Server Action)
// 입력: 없음 → 처리: ▷ supabaseSignOut() → 캐시 비우기 → 출력: redirect('/login')
export async function signOutAction(): Promise<void> {
  // 어댑터를 직접 부른다. 판단할 것이 없어 유스케이스를 거치지 않는다
  await supabaseSignOut();

  // 나갔으니 화면도 다시 그려야 한다
  revalidatePath("/", "layout");

  // 로그인 화면으로 돌려보낸다
  redirect("/login");
}
