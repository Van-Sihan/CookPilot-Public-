import type { Metadata } from "next";
import Link from "next/link";
import { ApiKeyForm } from "@/components/start/api-key-form";
import {
  HowTo,
  KeyHelp,
  StartMast,
  StepTrack,
} from "@/components/start/start-head";

/* 시작 페이지는 검색 결과에 나올 이유가 없다. 홈에 먼저 들러서 단추로 오는 자리다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "시작하기 · 쿡파일럿" 이 된다
  title: "시작하기",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "구글 Gemini 키를 넣고 쿡파일럿을 시작합니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다. 그것까지 막을 이유는 없다
  robots: { index: false, follow: true },
};

/** /start — 홈의 "무료로 시작하기" 를 누르면 오는 곳. 구역을 위에서 아래로 늘어놓기만 한다 */
// [F1][함수] StartPage(): API 키를 넣는 화면 (/start) — 네 걸음 중 첫째
// 입력: 없음 → 처리: StepTrack(1) + ApiKeyForm 배치 → 출력: 화면(JSX)
// 폼이 눌리면 components/start/api-key-form.tsx → enterWithApiKey(usecase:F1)
export default function StartPage() {
  return (
    <>
      {/* 홈과 마찬가지로 탭 키를 쓰는 사람을 본문으로 곧장 데려다준다 */}
      <a className="skip" href="#start-main">
        본문으로 건너뛰기
      </a>

      {/* 홈처럼 메뉴를 다 두지 않고 돌아가는 길만 남긴다. 여기서는 딴 데로 새지 않는 편이 낫다 */}
      <div className="start-top">
        {/* 홈은 이미 받아 둔 화면이라 이 링크로 가면 처음부터 다시 그리지 않는다 */}
        <Link className="start-back" href="/">
          ← 소개로 돌아가기
        </Link>
      </div>

      {/* glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다 */}
      <main className="start glow" id="start-main">
        {/* 내용을 가운데로 모으고 너무 넓어지지 않게 잡아 주는 껍데기 */}
        <div className="start-wrap">
          {/* 로고와 이름, 한 줄 약속 */}
          <StartMast />

          {/* 위쪽 소개와 걸음 표시 사이를 나누는 선 */}
          <hr className="rule start-rule" />

          {/* 네 걸음 중 첫 번째(준비)에 서 있다 */}
          <StepTrack now={0} />

          {/* 접어 둔 자세한 사용법 */}
          <HowTo />

          {/* 이 페이지에서 진짜 해야 할 일 — 키 넣기 */}
          <ApiKeyForm />

          {/* 키가 없는 사람을 위한 안내. 카드 밖에 둬서 할 일과 헷갈리지 않게 한다 */}
          <KeyHelp />
        </div>
      </main>
    </>
  );
}
