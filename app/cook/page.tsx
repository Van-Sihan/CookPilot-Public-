import type { Metadata } from "next";
import Link from "next/link";
import { CookShell } from "@/components/cook/cook-shell";
import { StepTrack } from "@/components/start/start-head";
import { site } from "@/lib/site-content";

/* 요리 중인 사람만 보는 자리라 검색 결과에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "요리 · 쿡파일럿" 이 된다
  title: "요리",
  description: "말로 물어보며 요리합니다.",
  robots: { index: false, follow: true },
};

/**
 * /cook — 장을 보고 나서 오는 곳. 네 걸음 중 마지막(요리)이다.
 *
 * 이 파일은 서버에서 한 번 그려지고 끝난다. 마이크도 타이머도 CookShell 안에 있다.
 */
export default function CookPage() {
  return (
    <>
      <a className="skip" href="#cook-head">
        본문으로 건너뛰기
      </a>

      <div className="cookpage">
        <header className="pick-head" id="cook-head">
          {/* 이름을 누르면 홈으로 간다. 요리 도중에도 빠져나갈 길이 있어야 한다 */}
          <Link className="pick-brand" href="/community">
            {site.nameKo}
            <span className="pick-brand-en">{site.name}</span>
          </Link>

          {/* 네 걸음 중 네 번째에 서 있다 */}
          <StepTrack now={3} />
        </header>

        <CookShell />
      </div>
    </>
  );
}
