import Link from "next/link";
import { plans } from "@/lib/site-content";

/** 요금제 세 장. 화면이 좁으면 가장 권하는 요금제가 맨 위로 올라온다. */
// [F1][함수] Pricing(): 요금제 카드 묶음
// 입력: 없음(site-content 의 plans) → 출력: 화면(JSX)
export function Pricing() {
  return (
    // 위쪽 메뉴의 "요금제" 를 누르면 이 이름표를 찾아 내려온다
    <section className="pricing glow" id="pricing">
      <div className="wrap">
        {/* 작은 글씨·제목·설명을 묶은 구역 머리 */}
        <div className="sec-head">
          <span className="eyebrow hot">요금제</span>
          {/* 얼마인지 숫자로 말하는 대신 얼마나 싼지 느껴지는 말로 바꿔 둔다 */}
          <h2>한 달에 커피 한 잔</h2>
          {/* 돈 내기 전에 망설이게 하는 걱정부터 먼저 덜어 준다 */}
          <p>맛보기로 충분히 써 보시고 결정하세요. 약정도 위약금도 없습니다.</p>
        </div>

        {/* 요금제 카드를 나란히 늘어놓는 틀 */}
        <div className="plans">
          {/* 요금제 이름이 서로 겹치지 않으니 그걸 이름표로 쓴다 */}
          {/* [F2][반복] plans 를 훑어 요금제 카드를 그린다 */}
          {plans.map((p) => (
            <article
              // 가장 권하는 요금제만 테두리와 놓이는 자리가 달라진다
              className={`plan${p.recommended ? " plan-rec" : ""}`}
              key={p.name}
            >
              {/* 가장 권하는 요금제 위에만 딱지가 붙는다 */}
              {p.recommended && (
                <span className="plan-badge">가장 많이 고르는 요금제</span>
              )}
              {/* 요금제 이름 */}
              <h3>{p.name}</h3>
              {/* 값과 단위를 한 줄로 묶는다 */}
              <p className="price">
                {/* 값만 크게 */}
                <span className="price-num">{p.price}</span>
                {/* "/ 월" 은 작게 붙인다 */}
                <span className="price-per">{p.per}</span>
              </p>
              {/* 이 요금제로 할 수 있는 일들 */}
              <ul>
                {/* 글이 서로 겹치지 않으니 그대로 이름표로 쓴다 */}
                {/* [F3][반복] 카드마다 perks 를 훑어 딸린 줄을 그린다 (F2 안의 반복) */}
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              {/* 갈 곳이 정해진 요금제만 진짜로 넘어간다.
                  나머지는 아직 화면을 안 만들어서 자리만 지키고 있다 */}
              {p.href ? (
                <Link
                  // 가장 권하는 요금제만 꽉 찬 단추로 만들어 눈에 띄게 한다
                  className={`btn ${p.recommended ? "btn-fill" : "btn-line"}`}
                  href={p.href}
                >
                  {p.cta}
                </Link>
              ) : (
                <a
                  // 생김새는 똑같이 맞춰 둔다. 나중에 주소만 채우면 끝나도록
                  className={`btn ${p.recommended ? "btn-fill" : "btn-line"}`}
                  href="#"
                >
                  {p.cta}
                </a>
              )}
            </article>
          ))}
        </div>

        {/* 자기 키를 쓰는 길도 있다는 걸 카드 밖에 따로 적어 둔다 */}
        <p className="plan-foot">
          직접 발급받은 Gemini API 키를 넣어 쓰실 수도 있습니다.
        </p>
      </div>
    </section>
  );
}
