import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import Image from "next/image";
import cacao from "@/public/community2/card-cacao.png";
import carbonara from "@/public/community2/card-carbonara.png";
import ribeye from "@/public/community2/hero-ribeye.png";
import "./community2.css";

/* 시안은 글꼴을 두 가지로 나눠 쓴다. 제목은 좁고 획 대비가 센 Instrument Serif 인데,
   소개글과 카드 요약은 글자 폭을 재 보니 그것보다 30%쯤 넓다 — 보통 폭의 세리프다.
   제목 글꼴로 본문까지 그리면 글자가 좁아 붙어서 시안과 눈에 띄게 달라진다.
   이 화면에서만 쓰는 글꼴이라 app/layout.tsx 가 아니라 여기서 부른다 */
const notoSerif = Noto_Serif({
  // CSS 에서 var(--font-noto-serif) 라고 부를 수 있게 이름을 지어 둔다
  variable: "--font-noto-serif",
  // 본문 굵기 하나면 된다
  weight: ["400"],
  // 영어만 나오는 화면이라 라틴만 받는다
  subsets: ["latin"],
  // 늦게 와도 글씨는 먼저 보이게 한다
  display: "swap",
});

/* 견주어 보려고 만든 화면이라 검색에 걸릴 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "Community 2 · 쿡파일럿" 이 된다
  title: "Community 2",
  // 무엇을 위한 화면인지 밝혀 둔다
  description: "design/blogmain.png 를 그대로 옮긴 견주기용 화면입니다.",
  // 검색에도 안 나오고 여기서 나가는 링크도 따라가지 않게 막는다. 진짜 화면이 아니다
  robots: { index: false, follow: false },
};

/**
 * /community2 — 시안을 그대로 옮긴 화면.
 *
 * 우리 규칙을 일부러 세 가지 어긴다.
 *  1) 문안이 영어다. 시안이 영어라서 그대로 뒀다
 *  2) 사진을 쓴다. 시안에 박혀 있던 그림을 잘라 낸 것이다
 *  3) 색과 자리 값을 globals.css 변수가 아니라 시안 픽셀에서 집어 온 숫자로 적었다
 *
 * `/community` 와 나란히 놓고 무엇이 나아지고 무엇을 잃었는지 보려고 만들었다.
 * 자바스크립트가 움직일 일이 하나도 없어서 통째로 서버에서 그려진다.
 */
export default function Community2Page() {
  return (
    // 제목 글꼴(Instrument Serif)은 app/layout.tsx 가 이미 문서 전체에 걸어 뒀고,
    // 본문 글꼴만 여기서 걸어 준다. 이 덩어리 밖으로는 새어 나가지 않는다
    <div className={`c2 ${notoSerif.variable}`}>
      {/* ---------- 머리말 ---------- */}
      {/* 시안의 머리말에는 냄비 로고가 없다. 글씨만 있는 것이 우리 화면과 크게 다른 점이다 */}
      <header className="c2-top">
        <div className="c2-top-in">
          {/* 화면에서 가장 눈에 띄는 글씨. 살구빛 두꺼운 세리프다 */}
          <p className="c2-logo">CookPilot</p>

          {/* 오른쪽 끝의 설정·도움말. 시안에는 눌러도 갈 곳이 없어서 그림만 둔다 */}
          <div className="c2-top-icons" aria-hidden="true">
            {/* 톱니바퀴 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2.6v2.4M12 19v2.4M21.4 12H19M5 12H2.6M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7M18.6 18.6l-1.7-1.7M7.1 7.1 5.4 5.4" strokeLinecap="round" />
            </svg>
            {/* 물음표 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9.2" />
              <path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.6" strokeLinecap="round" />
              <path d="M12 17h.01" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </header>

      {/* ---------- 큰 제목과 검색 ---------- */}
      <section className="c2-hero">
        {/* 시안 그대로 영어 한 낱말 */}
        <h1 className="c2-title">Community</h1>

        {/* 시안의 소개글. 우리 화면에서는 "쿡파일럿과 만들어낸 우리의 맛있는 순간들" 로 바꿨던 자리다 */}
        <p className="c2-lead">
          Discover high-performance recipes engineered by culinary pilots
          worldwide. Calibrate your next meal.
        </p>

        {/* 검색칸. 아직 아무 일도 안 하지만 시안에 있으니 그대로 놓는다 */}
        <div className="c2-search">
          {/* 칸 안 왼쪽에 앉는 돋보기. 뜻은 안내 글씨가 알려 주니 숨긴다 */}
          <span className="c2-search-ico" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="6.4" />
              <path d="m16 16 4.4 4.4" strokeLinecap="round" />
            </svg>
          </span>

          {/* 이름표를 눈에는 안 보이게 숨긴다. 시안에 이름표 자리가 없다 */}
          <label className="sr-only" htmlFor="c2-q">
            Search
          </label>
          <input id="c2-q" placeholder="Search parameters, ingredients, or pilots..." />
        </div>
      </section>

      {/* ---------- 왼쪽 기둥 + 카드 ---------- */}
      <div className="c2-wrap">
        <div className="c2-body">
          {/* 시안의 왼쪽 기둥은 탭 셋과 접속자 수뿐이다.
              우리 화면에 있는 셰프 랭킹과 태그 목록이 여기에는 없다 */}
          <aside>
            {/* 탭 묶음의 이름 */}
            <p className="c2-side-head">Signals</p>

            <ul className="c2-tabs">
              {/* 지금 서 있는 탭 */}
              <li>
                <a className="c2-tab on" href="#">
                  Popular
                  {/* 오른쪽 끝의 상승 화살표. 인기 탭에만 붙는다 */}
                  <span className="c2-tab-ico" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 16.5 9 11l3.5 3.5L20 7" />
                      <path d="M15 7h5v5" />
                    </svg>
                  </span>
                </a>
              </li>
              <li>
                <a className="c2-tab" href="#">
                  Recent
                </a>
              </li>
              <li>
                <a className="c2-tab" href="#">
                  Following
                </a>
              </li>
            </ul>

            {/* 접속자 수 묶음 */}
            <div className="c2-side-block">
              {/* 묶음 이름 */}
              <p className="c2-side-head">Telemetry</p>

              <p className="c2-live">
                {/* 켜져 있다는 표시. 시안에서는 깜빡이지 않는다 */}
                <span className="c2-live-dot" aria-hidden="true" />
                1,204 Pilots Active
              </p>
            </div>
          </aside>

          {/* 카드 세 장 — 위에 큰 것 하나, 아래에 작은 것 둘 */}
          <div className="c2-list">
            {/* 대표 글. 사진이 왼쪽 60%, 글이 오른쪽 40% */}
            <article className="c2-feature">
              <div className="c2-feature-photo">
                {/* 시안에 박혀 있던 그림을 잘라 낸 것이다.
                    크기를 미리 아니까 next/image 가 자리를 먼저 잡아 준다 */}
                <Image src={ribeye} alt="Charred ribeye resting on a slate board" priority />
              </div>

              <div className="c2-feature-body">
                {/* 분류와 걸리는 시간 */}
                <p className="c2-badges">
                  {/* 대표 글에만 붙는 살구빛 딱지 */}
                  <span className="c2-badge prime">PRIME</span>
                  <span className="c2-badge">45 MIN</span>
                </p>

                {/* 시안은 이 자리에서 줄을 두 번 끊는다. 글자 수가 같아야 견주기가 된다 */}
                <h2 className="c2-card-title">
                  Charred Ribeye with
                  <br />
                  Smoked Ember Butter
                </h2>

                {/* 시안처럼 세 줄에서 잘리고 말줄임표로 끝난다 */}
                <p className="c2-card-sum">
                  Precision sear techniques applied to prime cuts. The smoked
                  butter utilizes actual hardwood embers to infuse a…
                </p>

                {/* 글쓴이와 좋아요 */}
                <p className="c2-card-foot">
                  {/* 이름 첫 글자를 딴 동그란 딱지 */}
                  <span className="c2-avatar" aria-hidden="true">
                    AK
                  </span>
                  Chef A. Kael
                  <span className="c2-hearts">
                    {/* 하트. 숫자가 옆에 있으니 읽어 주는 기계에는 숨긴다 */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
                    </svg>
                    3.2k
                  </span>
                </p>
              </div>
            </article>

            {/* 아래 두 장 */}
            <div className="c2-pair">
              <article className="c2-card">
                {/* 시안의 이 자리는 요리 사진이 아니라 휴대폰 앱 화면을 찍은 그림이다.
                    그대로 옮기는 것이 목적이라 잘라 내지 않고 통째로 둔다 */}
                <span className="c2-card-shot">
                  <Image src={carbonara} alt="Carbonara plated in a black bowl, shown in the app" />
                </span>

                <div className="c2-card-body">
                  <p className="c2-badges">
                    <span className="c2-badge">PASTA</span>
                  </p>

                  <h2 className="c2-card-title">Carbonara Matrix</h2>

                  <p className="c2-card-foot">
                    R. Vance
                    <span className="c2-hearts">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
                      </svg>
                      892
                    </span>
                  </p>
                </div>
              </article>

              <article className="c2-card">
                <span className="c2-card-shot">
                  <Image src={cacao} alt="Cacao sphere dessert on a stone slab, shown in the app" />
                </span>

                <div className="c2-card-body">
                  <p className="c2-badges">
                    {/* 디저트만 금빛 딱지다 */}
                    <span className="c2-badge gold">DESSERT</span>
                  </p>

                  <h2 className="c2-card-title">Obsidian Cacao Sphere</h2>

                  <p className="c2-card-foot">
                    E. Thorne
                    <span className="c2-hearts">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
                      </svg>
                      1.5k
                    </span>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 꼬리말 ---------- */}
      <footer className="c2-foot">
        <div className="c2-foot-in">
          {/* 머리말 로고를 작게 줄인 것 */}
          <p className="c2-foot-logo">CookPilot</p>

          {/* 시안에 적힌 해와 문구를 그대로 옮긴다. 2024 도 시안 그대로다 */}
          <p className="c2-foot-copy">
            © 2024 CookPilot AI. Atmospheric Precision Engine.
          </p>

          <nav>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
