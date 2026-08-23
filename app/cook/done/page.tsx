import type { Metadata } from "next";
import Link from "next/link";
import { DoneShell } from "@/components/cook/done-shell";
import { StepTrack } from "@/components/start/start-head";
import { site } from "@/lib/site-content";

/* 요리를 마친 사람만 보는 자리라 검색 결과에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "요리 완성 · 쿡파일럿" 이 된다
  title: "요리 완성",
  description: "만든 요리의 표지를 만들고 레시피북에 꽂습니다.",
  robots: { index: false, follow: true },
};

/**
 * /cook/done — 요리를 마치고 오는 곳.
 *
 * 걸음 표시는 여전히 네 번째(요리)에 둔다. 다섯 번째 걸음을 새로 만들면
 * 앞 화면들의 "네 걸음" 이 모두 거짓말이 된다.
 */
export default function DonePage() {
  return (
    <>
      <a className="skip" href="#done-head">
        본문으로 건너뛰기
      </a>

      <div className="cookpage">
        <header className="pick-head" id="done-head">
          {/* 이름을 누르면 홈으로 간다. 요리 도중에도 빠져나갈 길이 있어야 한다 */}
          <Link className="pick-brand" href="/community">
            {site.nameKo}
            <span className="pick-brand-en">{site.name}</span>
          </Link>

          <StepTrack now={3} />
        </header>

        <DoneShell />
      </div>
    </>
  );
}
