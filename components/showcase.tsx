import {
  blocks,
  cartItems,
  recipeSteps,
  shelfBooks,
  type Block,
} from "@/lib/site-content";

/** 삽화 · 영상에서 뽑아낸 단계 목록. 지금 하는 단계에 불이 들어와 있다. */
function StepsArt() {
  return (
    <div className="art art-steps">
      <div className="art-head">
        <span className="src">youtube.com</span>
        <span className="ttl">토마토 파스타</span>
      </div>
      <ul className="steps">
        {recipeSteps.map((s) => (
          <li key={s.n} className={"on" in s && s.on ? "on" : undefined}>
            <span className="n">{s.n}</span>
            <span className="t">{s.t}</span>
            <span className="d">{s.d}</span>
            {"tm" in s && s.tm && <span className="tm">{s.tm}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 삽화 · 해 먹은 요리가 표지째 꽂힌 서재. 마지막 칸은 아직 빈자리. */
function ShelfArt() {
  const rows = [shelfBooks.slice(0, 3), shelfBooks.slice(3)];
  return (
    <div className="art art-shelf">
      {rows.map((row, r) => (
        <div key={r}>
          <div className="shelf-row">
            {row.map((title) => (
              <div className="bk" key={title.join("")}>
                <span>
                  {title[0]}
                  <br />
                  {title[1]}
                </span>
              </div>
            ))}
            {r === 1 && (
              <div className="bk sk" aria-hidden="true">
                <span>+</span>
              </div>
            )}
          </div>
          <div className="shelf-bar" />
        </div>
      ))}
      <p className="shelf-say">“지난주에 만든 그 파스타”</p>
    </div>
  );
}

/** 삽화 · 가진 것은 지우고 없는 것만 남긴 장보기 목록. */
function CartArt() {
  const need = cartItems.filter((i) => !i.have).length;
  return (
    <div className="art art-cart">
      <div className="art-head">
        <span className="src">장보기 목록</span>
        <span className="ttl">토마토 파스타</span>
      </div>
      <ul className="cart">
        {cartItems.map((i) => (
          <li key={i.nm} className={i.have ? "have" : "need"}>
            <span className="bx" aria-hidden="true" />
            <span className="nm">{i.nm}</span>
            <span className="st">{i.have ? "있음" : "없음"}</span>
          </li>
        ))}
      </ul>
      <div className="cart-foot">
        <span>{need}개만 사면 됩니다</span>
        <span className="cart-go">쇼핑몰에서 찾기 →</span>
      </div>
    </div>
  );
}

const arts = {
  steps: StepsArt,
  shelf: ShelfArt,
  cart: CartArt,
} satisfies Record<Block["art"], () => React.ReactElement>;

/** 글과 삽화가 좌우로 번갈아 놓이는 세 덩어리. */
export function Showcase() {
  return (
    <div className="wrap blocks">
      {blocks.map((b) => {
        const Art = arts[b.art];
        const text = (
          <div className="bl-text" key="text">
            <h3>{b.title}</h3>
            <p className="bl-lead">{b.lead}</p>
            <ul className="bl-list">
              {b.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        );
        const art = (
          <div className="bl-art" key="art">
            <Art />
          </div>
        );

        return (
          <section className={`block text-${b.side}`} key={b.id} id={b.id}>
            {/* 좁은 화면에서는 먼저 놓인 쪽이 위로 온다.
                삽화가 먼저인 덩어리는 그림을 보고 설명을 읽는 순서가 된다 */}
            {b.side === "right" ? [art, text] : [text, art]}
          </section>
        );
      })}
    </div>
  );
}
