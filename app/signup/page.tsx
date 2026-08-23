import type { Metadata } from "next";
import Link from "next/link";
import { LoginFoot, LoginTop } from "@/components/login/login-chrome";
import { SignupForm } from "@/components/signup/signup-form";
import { signupCopy } from "@/lib/site-content";

/* 가입 화면도 검색 결과에 나올 이유가 없다. 소개나 로그인을 거쳐 오는 자리다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "회원가입 · 쿡파일럿" 이 된다
  title: "회원가입",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "쿡파일럿 계정을 만듭니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다
  robots: { index: false, follow: true },
};

/** /signup — 로그인 화면의 "회원가입" 을 누르면 오는 곳 */
export default function SignupPage() {
  return (
    <>
      {/* 탭 키를 쓰는 사람을 곧장 카드로 데려다준다 */}
      <a className="skip" href="#signup-main">
        본문으로 건너뛰기
      </a>

      {/* 위아래 테두리는 로그인 화면 것을 그대로 쓴다.
          두 화면은 한 흐름이라 테두리가 달라지면 딴 사이트에 온 것처럼 보인다 */}
      <LoginTop />

      {/* login 클래스를 그대로 쓴다. 여백도 가운데 정렬도 로그인과 같아야 한다 */}
      <main className="login glow" id="signup-main">
        <div className="login-wrap">
          {/* 이 화면에서 진짜 해야 할 일 */}
          <SignupForm />

          {/* 카드 밖에 두어 "지금 할 일" 과 헷갈리지 않게 한다 */}
          <p className="login-signup">
            {signupCopy.haveAccount}{" "}
            <Link href="/login">{signupCopy.signIn}</Link>
          </p>
        </div>
      </main>

      <LoginFoot />
    </>
  );
}
