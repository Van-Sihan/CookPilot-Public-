import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { SetupPicker } from "@/components/setup/setup-picker";
import { setupCopy, site } from "@/lib/site-content";

/* 키를 넣은 사람만 오는 자리라 검색 결과에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "목소리 고르기 · 쿡파일럿" 이 된다
  title: "목소리 고르기",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "안내 목소리와 답변 속도를 골라 둡니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다
  robots: { index: false, follow: true },
};

/** /start/model — 키를 넣고 나서 오는 곳. 고를 것을 다 고르면 /pick 으로 간다 */
// [F1][함수] ModelPage(): 목소리·속도를 고르는 화면 (/start/model) — 네 걸음 중 둘째
// 입력: 없음 → 처리: StepTrack(2) + SetupPicker 배치 → 출력: 화면(JSX)
// 고른 값은 components/setup/setup-picker.tsx → keepCookSetup(usecase:F1) → localStorage
export default function ModelPage() {
  return (
    <>
      {/* 다른 화면과 마찬가지로 탭 키를 쓰는 사람을 본문으로 곧장 데려다준다 */}
      <a className="skip" href="#setup-main">
        본문으로 건너뛰기
      </a>

      {/* 앞 걸음으로 돌아가는 길만 남긴다. 여기서 딴 데로 샐 일은 없다 */}
      <div className="start-top">
        {/* 키를 다시 보거나 바꾸러 갈 수 있게 시작 화면으로 이어 둔다 */}
        <Link className="start-back" href="/start">
          ← 준비로 돌아가기
        </Link>
      </div>

      {/* glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다 */}
      <main className="setup glow" id="setup-main">
        {/* 내용을 가운데로 모으고 너무 넓어지지 않게 잡아 주는 껍데기 */}
        <div className="setup-wrap">
          {/* 로고와 영어 이름. 시작 화면보다 작게 놓아 카드가 주인공이 되게 한다 */}
          <div className="setup-mast">
            {/* 이름이 겹치지 않게 이 화면 이름을 넘겨준다 */}
            <Logo size={44} id="setup" />
            {/* 글자 사이를 넓게 벌린 영어 이름 */}
            <p className="setup-mark">{site.name}</p>
          </div>

          {/* 이 화면에서 던지는 하나뿐인 물음 */}
          <h1 className="setup-title">{setupCopy.title}</h1>

          {/* 왜 지금 이걸 고르는지 한 줄로 */}
          <p className="setup-lead">{setupCopy.lead}</p>

          {/* 위쪽 물음과 카드 사이를 나누는 선 */}
          <hr className="rule setup-rule" />

          {/* 진짜 고르는 자리. 여기만 브라우저가 움직인다 */}
          <SetupPicker />
        </div>
      </main>
    </>
  );
}
