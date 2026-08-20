import { Icon } from "@/components/icons";
import { features } from "@/lib/site-content";

/** 큰 문장 한 줄. 앞뒤 구역 사이에서 숨을 고르는 자리. */
export function Statement() {
  return (
    <section className="statement glow" id="how">
      <div className="wrap">
        <h2>
          레시피를 보지 말고,
          <br />
          들으세요
        </h2>
        <p>화면을 들여다보느라 냄비를 태우는 일은 이제 없습니다.</p>
      </div>
    </section>
  );
}

/** 기능 여섯 칸. 1 → 2 → 3 열로 늘어난다. */
export function Features() {
  return (
    <section className="features glow" id="features">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow hot">기능</span>
          <h2>주방에서 실제로 벌어지는 일들</h2>
          <p>
            있어 보이는 기능이 아니라, 요리하다 손이 멈추는 순간만 골라
            담았습니다.
          </p>
        </div>
        <div className="feats">
          {features.map((f) => (
            <article className="feat" key={f.n}>
              <div className="feat-top">
                <span className="feat-ico">
                  <Icon name={f.icon} />
                </span>
                <span className="feat-n">{f.n}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
