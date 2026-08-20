import { plans } from "@/lib/site-content";

/** 요금제 세 장. 좁은 화면에서는 추천 요금제가 맨 위로 올라온다. */
export function Pricing() {
  return (
    <section className="pricing glow" id="pricing">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow hot">요금제</span>
          <h2>한 달에 커피 두 잔</h2>
          <p>맛보기로 충분히 써 보시고 정하세요. 약정도 위약금도 없습니다.</p>
        </div>

        <div className="plans">
          {plans.map((p) => (
            <article
              className={`plan${p.recommended ? " plan-rec" : ""}`}
              key={p.name}
            >
              {p.recommended && (
                <span className="plan-badge">가장 많이 고르는 요금제</span>
              )}
              <h3>{p.name}</h3>
              <p className="price">
                <span className="price-num">{p.price}</span>
                <span className="price-per">{p.per}</span>
              </p>
              <ul>
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <a
                className={`btn ${p.recommended ? "btn-fill" : "btn-line"}`}
                href="#"
              >
                {p.cta}
              </a>
            </article>
          ))}
        </div>

        <p className="plan-foot">
          직접 발급받은 Gemini API 키를 넣어 쓰실 수도 있습니다. 그때는 대화
          한도가 없습니다.
        </p>
      </div>
    </section>
  );
}
