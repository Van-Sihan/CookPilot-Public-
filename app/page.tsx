import { Cta, SiteFooter } from "@/components/closing";
import { Faq } from "@/components/faq";
import { Features, Statement } from "@/components/features";
import { Hero } from "@/components/hero";
import { Pricing } from "@/components/pricing";
import { Showcase } from "@/components/showcase";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site-content";

/** 홈페이지. 각 구역을 위에서 아래로 늘어놓기만 하고, 안에 뭘 그릴지는 저마다에게 맡긴다 */
// [F1][함수] Home(): 소개 페이지 (/)
// 입력: 없음 → 처리: site-content 의 값을 각 조각에 넘김 → 출력: 화면(JSX)
// 서버에서 한 번 그려지고 끝난다. 움직이는 것이 없다
export default function Home() {
  return (
    <>
      {/* 탭 키로 화면을 옮겨 다니는 사람이 위쪽 메뉴를 다 지나지 않고 본문으로 건너뛰게 해 준다.
          평소에는 화면 밖에 숨어 있다가 탭이 닿을 때만 나타난다 */}
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>

      {/* 맨 위 띠. 로고를 누르면 여기로 돌아오기 때문에 이름표를 붙여 둔다 */}
      <div className="band" id="top">
        {site.band}
      </div>

      {/* 로고와 메뉴, 시작 단추가 들어 있는 윗부분 */}
      <SiteHeader />

      {/* 건너뛰기 링크가 데려다주는 자리. 읽어 주는 기계도 여기부터를 본문으로 본다 */}
      <main id="main">
        {/* 첫 화면 — 한 줄 약속과 대화 보여 주기 */}
        <Hero />
        {/* 첫 화면과 다음 이야기 사이를 나누는 가느다란 선 */}
        <hr className="rule" />
        {/* 큰 글씨 한 줄로 잠깐 숨을 고른다 */}
        <Statement />
        {/* 기능 여섯 칸 */}
        <Features />
        {/* 글과 그림이 번갈아 놓이는 세 덩어리 */}
        <Showcase />
        {/* 요금제 세 장 */}
        <Pricing />
        {/* 자주 묻는 질문 */}
        <Faq />
        {/* 마지막으로 한 번 더 권하는 자리 */}
        <Cta />
      </main>

      {/* 로고와 저작권, 약관 링크가 들어 있는 맨 아랫부분 */}
      <SiteFooter />
    </>
  );
}
