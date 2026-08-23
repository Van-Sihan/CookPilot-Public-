import type { Metadata } from "next";
import Link from "next/link";
import { PickShell } from "@/components/pick/pick-shell";
import { StepTrack } from "@/components/start/start-head";
import { site } from "@/lib/site-content";

/* 키를 넣고 목소리를 고른 사람만 오는 자리라 검색 결과에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "요리 정하기 · 쿡파일럿" 이 된다
  title: "요리 정하기",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "말로 요리를 정하고, 유튜브 영상이나 냉장고 재료에서 레시피를 가져옵니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다
  robots: { index: false, follow: true },
};

/**
 * /pick — 목소리를 고른 뒤 오는 곳. 네 걸음 중 두 번째(고르기)다.
 *
 * 이 파일은 서버에서 한 번 그려지고 끝난다. 움직이는 것은 전부 PickShell 안에 있다.
 * 머리말은 바뀔 일이 없어서 여기서 그려 껍데기 안으로 넣어 준다 —
 * 그러면 이 부분은 브라우저가 받을 자바스크립트에 끼지 않는다.
 */
// [F1][함수] PickPage(): 무엇을 만들지 정하는 화면 (/pick) — 네 걸음 중 둘째
// 입력: 없음 → 처리: 머리말 + PickShell 배치 → 출력: 화면(JSX)
// 실제 흐름은 components/pick/pick-shell.tsx 안에 있다 —
// 마이크(voice-console) → planFromSpeech, 카드(pick-cards) → planFromYoutube·findFridgeIdeas
export default function PickPage() {
  return (
    <>
      {/* 다른 화면과 마찬가지로 탭 키를 쓰는 사람을 본문으로 곧장 데려다준다 */}
      <a className="skip" href="#pick-head">
        본문으로 건너뛰기
      </a>

      <PickShell>
        {/* 가운데 맨 위 — 이름과 지금 어느 걸음인지 */}
        <header className="pick-head" id="pick-head">
          {/* 한글 이름과 영어 이름을 한 덩어리로 붙인다 */}
          {/* 이름을 누르면 홈으로 간다. 요리 도중에도 빠져나갈 길이 있어야 한다 */}
          <Link className="pick-brand" href="/community">
            {/* 한글 이름 */}
            {site.nameKo}
            {/* 그 옆에 작게 붙는 영어 이름 */}
            <span className="pick-brand-en">{site.name}</span>
          </Link>

          {/* 네 걸음 중 두 번째에 서 있다. 시작 화면과 같은 것을 그대로 쓴다 */}
          <StepTrack now={1} />
        </header>
      </PickShell>
    </>
  );
}
