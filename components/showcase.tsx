import {
  blocks,
  cartItems,
  recipeSteps,
  shelfBooks,
  type Block,
} from "@/lib/site-content";

/** 그림 · 영상에서 뽑아낸 요리 순서. 지금 하는 단계에만 불이 들어와 있다. */
function StepsArt() {
  return (
    <div className="art art-steps">
      {/* 어디서 가져온 레시피이고 무슨 요리인지 알려 주는 윗줄 */}
      <div className="art-head">
        {/* 어디서 왔는지. 유튜브 영상을 옮겨 온 거라는 걸 한눈에 알 수 있다 */}
        <span className="src">youtube.com</span>
        {/* 요리 이름 */}
        <span className="ttl">토마토 파스타</span>
      </div>
      {/* 요리 순서 목록 */}
      <ul className="steps">
        {/* 단계 번호가 서로 다 다르니 그걸 이름표로 쓴다 */}
        {recipeSteps.map((s) => (
          // 지금 하는 단계에만 불이 들어온다. on 이라는 표시는 그 단계에만 붙어 있어서 먼저 있는지부터 살핀다
          <li key={s.n} className={"on" in s && s.on ? "on" : undefined}>
            {/* 단계 번호 */}
            <span className="n">{s.n}</span>
            {/* 단계 이름 */}
            <span className="t">{s.t}</span>
            {/* 실제로 뭘 하면 되는지 */}
            <span className="d">{s.d}</span>
            {/* 타이머가 돌고 있는 단계에만 남은 시간이 붙는다 */}
            {"tm" in s && s.tm && <span className="tm">{s.tm}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 그림 · 해 먹은 요리가 책처럼 꽂혀 있는 책장. 마지막 칸은 아직 비어 있다. */
function ShelfArt() {
  /* 책 다섯 권을 두 칸에 나눠 꽂는다. 위 칸에 셋, 아래 칸에 둘이라 아래에 자리가 하나 남는다 */
  const rows = [shelfBooks.slice(0, 3), shelfBooks.slice(3)];
  return (
    <div className="art art-shelf">
      {/* 칸이 두 개뿐이고 순서도 안 바뀌니 몇 번째인지를 이름표로 쓴다 */}
      {rows.map((row, r) => (
        <div key={r}>
          {/* 책이 나란히 서 있는 줄 */}
          <div className="shelf-row">
            {/* 제목이 두 조각으로 나뉘어 있어서, 이어 붙인 글자를 이름표로 쓴다 */}
            {row.map((title) => (
              <div className="bk" key={title.join("")}>
                <span>
                  {/* 책 표지 첫째 줄 */}
                  {title[0]}
                  {/* 책 옆면이 좁아서 두 줄로 끊어 적는다 */}
                  <br />
                  {/* 책 표지 둘째 줄 */}
                  {title[1]}
                </span>
              </div>
            ))}
            {/* 아래 칸 끝에만 빈자리를 남긴다. "다음엔 뭘 만들까" 하는 마음이 들게 하려는 것이다 */}
            {r === 1 && (
              <div className="bk sk" aria-hidden="true">
                <span>+</span>
              </div>
            )}
          </div>
          {/* 책을 받쳐 주는 선반 */}
          <div className="shelf-bar" />
        </div>
      ))}
      {/* 책장이 왜 필요한지 한마디로 보여 주는 혼잣말 */}
      <p className="shelf-say">“지난주에 만든 그 파스타”</p>
    </div>
  );
}

/** 그림 · 집에 있는 건 흐리게 지우고 없는 것만 남긴 장보기 목록. */
function CartArt() {
  /* 아래 글에 쓸 "사야 할 개수". 집에 없는 재료만 센다 */
  const need = cartItems.filter((i) => !i.have).length;
  return (
    <div className="art art-cart">
      {/* 무슨 목록이고 어느 요리에 쓸 건지 알려 주는 윗줄 */}
      <div className="art-head">
        <span className="src">장보기 목록</span>
        <span className="ttl">토마토 파스타</span>
      </div>
      {/* 재료 목록 */}
      <ul className="cart">
        {/* 재료 이름이 서로 안 겹치니 그걸 이름표로 쓴다 */}
        {cartItems.map((i) => (
          // 집에 있는 건 흐리게 지우고, 없는 것만 눈에 띄게 한다
          <li key={i.nm} className={i.have ? "have" : "need"}>
            {/* 체크 상자 그림. 무슨 뜻인지는 옆 글씨가 알려 주니 읽어 주는 기계에는 숨긴다 */}
            <span className="bx" aria-hidden="true" />
            {/* 재료 이름 */}
            <span className="nm">{i.nm}</span>
            {/* 있는지 없는지를 글씨로도 적는다. 색만으로는 구분 못 하는 사람도 있기 때문이다 */}
            <span className="st">{i.have ? "있음" : "없음"}</span>
          </li>
        ))}
      </ul>
      {/* 목록 아래 마지막 줄 */}
      <div className="cart-foot">
        {/* 살 게 몇 개 안 된다고 세어 준다. 그래야 장보기가 덜 부담스럽다 */}
        <span>{need}개만 사면 됩니다</span>
        {/* 다음에 할 일. 아직 그 화면을 안 만들어서 글씨로만 둔다 */}
        <span className="cart-go">쇼핑몰에서 찾기 →</span>
      </div>
    </div>
  );
}

/** 데이터에 적힌 이름과 진짜 그림을 이어 주는 표. 하나라도 빠뜨리면 컴퓨터가 미리 알려 준다 */
const arts = {
  steps: StepsArt,
  shelf: ShelfArt,
  cart: CartArt,
} satisfies Record<Block["art"], () => React.ReactElement>;

/** 글과 그림이 좌우로 번갈아 놓이는 세 덩어리. */
export function Showcase() {
  return (
    <div className="wrap blocks">
      {blocks.map((b) => {
        /* 이 덩어리에 쓸 그림. 이름을 대문자로 시작해야 React 가 "그려야 할 것" 으로 알아본다 */
        const Art = arts[b.art];
        /* 글 쪽. 아래에서 놓는 순서를 바꿀 거라서 미리 만들어 둔다 */
        const text = (
          // 아래에서 목록으로 묶어 넣기 때문에 React 가 이름표를 붙이라고 한다
          <div className="bl-text" key="text">
            {/* 덩어리 제목 */}
            <h3>{b.title}</h3>
            {/* 제목을 풀어서 설명해 주는 글 */}
            <p className="bl-lead">{b.lead}</p>
            {/* 짧게 끊어 적은 요점 */}
            <ul className="bl-list">
              {/* 글이 서로 안 겹치니 그대로 이름표로 쓴다 */}
              {b.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        );
        /* 그림 쪽. 글과 똑같이 미리 만들어 둔다 */
        const art = (
          <div className="bl-art" key="art">
            <Art />
          </div>
        );

        return (
          // 화면이 넓을 때 글이 왼쪽에 갈지 오른쪽에 갈지를 이 이름표가 정한다
          <section className={`block text-${b.side}`} key={b.id} id={b.id}>
            {/* 화면이 좁아지면 먼저 놓인 것이 위로 간다.
                그림을 먼저 넣은 덩어리는 그림을 보고 나서 설명을 읽는 순서가 된다 */}
            {b.side === "right" ? [art, text] : [text, art]}
          </section>
        );
      })}
    </div>
  );
}
