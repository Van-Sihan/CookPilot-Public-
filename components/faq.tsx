import { faqs } from "@/lib/site-content";

/** 자주 묻는 질문. <details> 라서 자바스크립트 없이도 눌러서 열고 닫을 수 있다. */
// [F1][함수] Faq(): 소개 페이지의 자주 묻는 말 묶음
// 입력: 없음(lib/site-content 의 faqs) → 처리: 목록을 접이칸으로 → 출력: 화면(JSX)
export function Faq() {
  return (
    // 위쪽 메뉴의 "자주 묻는 질문" 을 누르면 이 이름표를 찾아 내려온다
    <section className="faq-sec" id="faq">
      {/* 내용을 가운데로 모으고 너무 넓어지지 않게 잡아 주는 껍데기 */}
      <div className="wrap">
        {/* 작은 글씨와 제목을 한 덩어리로 묶어 가운데에 놓는다 */}
        <div className="sec-head">
          {/* hot 은 불빛 색으로 칠하라는 이름표다 */}
          <span className="eyebrow hot">자주 묻는 질문</span>
          <h2>궁금하실 것들</h2>
        </div>
        {/* 질문 목록. 칸 사이 간격과 줄은 CSS 가 맡는다 */}
        <div className="faq">
          {/* 질문 글이 서로 겹치지 않으니 그걸 그대로 이름표로 쓴다 */}
          {/* [F2][반복] faqs 를 훑어 물음·답 접이칸을 하나씩 그린다 */}
          {faqs.map((f) => (
            <details key={f.q}>
              {/* 접혀 있을 때 보이는 줄. 누르면 답이 펼쳐진다 */}
              <summary>
                {/* 질문 글. 옆 표시와 양쪽 끝으로 벌리려고 한 겹 감싼다 */}
                <span>{f.q}</span>
                {/* 열렸는지 닫혔는지 알려 주는 +/− 표시. 그림은 CSS 가 그려서 안이 비어 있다 */}
                <i aria-hidden="true" />
              </summary>
              {/* 펼쳐지는 답. 열고 닫힐 때 높이가 부드럽게 변하도록 한 겹 더 감쌌다 */}
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
