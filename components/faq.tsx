import { faqs } from "@/lib/site-content";

/** 자주 묻는 질문. <details> 라 자바스크립트 없이도 열리고 닫힌다. */
export function Faq() {
  return (
    <section className="faq-sec" id="faq">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow hot">자주 묻는 질문</span>
          <h2>궁금하실 것들</h2>
        </div>
        <div className="faq">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>
                <span>{f.q}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="ans">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
