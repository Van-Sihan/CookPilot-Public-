import { Icon } from "@/components/icons";
import { features } from "@/lib/site-content";

/** 큰 글씨 한 줄. 앞뒤 구역 사이에서 잠깐 숨을 고르는 자리. */
// [F1][함수] Statement(): 소개 페이지의 한 문장 선언 묶음
// 입력: 없음(site-content) → 출력: 화면(JSX)
export function Statement() {
  return (
    // 첫 화면의 "1분 시연 보기" 를 누르면 이 이름표를 찾아 내려온다
    <section className="statement glow" id="how">
      <div className="wrap">
        <h2>
          레시피를 보지 말고,
          {/* 화면이 좁아져도 꼭 이 자리에서만 줄이 바뀌도록 직접 끊어 준다 */}
          <br />
          들으세요
        </h2>
        <p>화면을 들여다보느라 냄비를 태우는 일은 이제 없습니다.</p>
      </div>
    </section>
  );
}

/** 기능 여섯 칸. 화면이 넓어질수록 1줄 → 2줄 → 3줄로 늘어난다. */
// [F2][함수] Features(): 기능 카드 묶음
// 입력: 없음(site-content 의 features) → 처리: 카드로 늘어놓기 → 출력: 화면(JSX)
export function Features() {
  return (
    // 위쪽 메뉴의 "기능" 을 누르면 이 이름표를 찾아 내려온다
    <section className="features glow" id="features">
      <div className="wrap">
        {/* 작은 글씨·제목·설명을 묶은 구역 머리 */}
        <div className="sec-head">
          <span className="eyebrow hot">기능</span>
          <h2>주방에서 실제로 벌어지는 일들</h2>
          <p>
            있어 보이는 기능이 아니라, 요리하다 손이 멈추는 순간만 골라
            담았습니다.
          </p>
        </div>
        {/* 칸을 바둑판처럼 늘어놓는다. 몇 줄로 놓을지는 화면 너비를 보고 CSS 가 정한다 */}
        <div className="feats">
          {/* 번호가 칸마다 다르니 그걸 이름표로 쓴다 */}
          {/* [F3][반복] features 를 훑어 카드를 하나씩 그린다 */}
          {features.map((f) => (
            <article className="feat" key={f.n}>
              {/* 아이콘과 번호를 한 줄에 놓고 양쪽 끝으로 벌린다 */}
              <div className="feat-top">
                {/* 아이콘 뒤에 동그란 바탕을 깔아 주는 자리 */}
                <span className="feat-ico">
                  {/* 어떤 그림을 그릴지는 데이터가 이름으로 정해 준다 */}
                  <Icon name={f.icon} />
                </span>
                {/* 01, 02 … 같은 번호. 눈으로 훑을 때 자리를 잡아 준다 */}
                <span className="feat-n">{f.n}</span>
              </div>
              {/* 기능 이름 */}
              <h3>{f.title}</h3>
              {/* 기능 설명 */}
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
