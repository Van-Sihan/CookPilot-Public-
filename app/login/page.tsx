import type { Metadata } from "next";
import Link from "next/link";
import { LoginFoot, LoginTop } from "@/components/login/login-chrome";
import { LoginForm } from "@/components/login/login-form";
import { loginCopy } from "@/lib/site-content";

/* 로그인 화면은 검색 결과에 나올 이유가 없다. 소개를 보고 단추로 오는 자리다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "로그인 · 쿡파일럿" 이 된다
  title: "로그인",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "쿡파일럿에 로그인합니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다
  robots: { index: false, follow: true },
};

/** /login — 소개 페이지의 시작 단추들이 닿는 곳. 구역을 위에서 아래로 늘어놓기만 한다 */
// [F1][함수] LoginPage(): 로그인 화면 (/login)
// 입력: 없음 → 처리: 테두리(LoginTop) + 폼(LoginForm) 배치 → 출력: 화면(JSX)
// 폼이 눌리면 components/login/login-form.tsx → signInAction(app/actions/auth.ts:F2)
export default function LoginPage() {
  return (
    <>
      {/* 탭 키를 쓰는 사람을 곧장 카드로 데려다준다 */}
      <a className="skip" href="#login-main">
        본문으로 건너뛰기
      </a>

      {/* 로고와 계정 표시만 있는 맨 윗줄 */}
      <LoginTop />

      {/* 화면 높이가 남으면 카드가 가운데에 오도록 이 자리가 늘어난다 */}
      <main className="login glow" id="login-main">
        {/* 카드와 그 아래 회원가입 줄을 한 덩어리로 묶어 가운데에 놓는다 */}
        <div className="login-wrap">
          {/* 이 화면에서 진짜 해야 할 일 */}
          <LoginForm />

          {/* 카드 밖에 두어 "지금 할 일" 과 헷갈리지 않게 한다 */}
          <p className="login-signup">
            {loginCopy.noAccount}{" "}
            <Link href="/signup">{loginCopy.signUp}</Link>
          </p>
        </div>
      </main>

      {/* 로고와 저작권, 약관 링크가 든 맨 아랫줄 */}
      <LoginFoot />
    </>
  );
}
