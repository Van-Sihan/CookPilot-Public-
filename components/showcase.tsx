import { Icon } from "@/components/icons";
import {
  blocks,
  cartItems,
  cookNow,
  shelfBooks,
  type Block,
} from "@/lib/site-content";

/** 그림 · 실제 요리 화면(/cook)의 "지금 할 일" 카드를 줄여 그린 것. */
// [F1][함수] StepsArt(): 요리 화면의 지금 걸음 카드를 흉내 낸 그림 조각
// 입력: 없음(site-content 의 cookNow) → 출력: 화면(JSX)
function StepsArt() {
  return (
    <div className="art art-steps">
      {/* 실제 화면이 카드 위에 다는 그 제목 */}
      <p className="ct-h2">
        <span aria-hidden="true">🔥</span> 지금 할 일
      </p>

      {/* 지금 걸음 카드 */}
      <div className="ct-card">
        {/* 걸음마다 한 칸씩 차오르는 막대. 지금 걸음까지 불이 들어온다 */}
        <div className="ct-track" aria-hidden="true">
          {/* 칸이 넷뿐이고 순서도 안 바뀌니 몇 번째인지를 이름표로 쓴다 */}
          {[0, 1, 2, 3].map((i) => (
            <span key={i} data-on={i <= cookNow.at ? "" : undefined} />
          ))}
        </div>

        {/* 몇 번째 걸음인지 */}
        <p className="ct-step-n">
          {/* 첫단계·마지막처럼 지금 어디쯤인지 말로도 알려 주는 딱지 */}
          <span className="ct-step-tag">{cookNow.tag}</span>
          {cookNow.count}
        </p>

        {/* 이 화면에서 가장 크게 보여야 하는 글. 불 앞에서 멀리서도 읽혀야 한다 */}
        <p className="ct-step-t">{cookNow.text}</p>

        {/* 시간이 걸리는 걸음이라 타이머를 한 번에 걸 수 있게 해 준다 */}
        <span className="ct-btns">
          {/* 실제 화면에서는 누르면 타이머가 걸리는 단추다 */}
          <span className="ct-timer">
            <Icon name="timer" size={14} /> {cookNow.minutes}분 타이머 걸기
          </span>
          {/* 손이 젖어 화면을 못 볼 때 눌러 읽어 주는 단추. 글자 없이 그림 하나다 */}
          <span className="ct-read" aria-hidden="true">
            <Icon name="speaker" size={16} />
          </span>
        </span>
      </div>

      {/* 앞뒤로 옮기는 단추 둘. 실제 화면에서는 말로도 넘어간다 */}
      <div className="ct-move" aria-hidden="true">
        <span>← 앞 단계</span>
        <span>다음 단계 →</span>
      </div>
    </div>
  );
}

/** 그림 · 해 먹은 요리가 잡지 표지처럼 세워져 있는 서재. 마지막 칸은 아직 비어 있다. */
// [F2][함수] ShelfArt(): 실제 /shelf 가판대를 줄여 그린 그림 조각
// 입력: 없음(site-content 의 shelfBooks) → 처리: 표지를 늘어놓기 → 출력: 화면(JSX)
function ShelfArt() {
  return (
    <div className="art art-shelf">
      {/* 실제 서재 화면이 맨 위에 몇 권인지 적어 두는 그 줄 */}
      <div className="art-head">
        <span className="src">내 서재</span>
        <span className="ttl">{shelfBooks.length}권</span>
      </div>
      {/* 표지를 세워 늘어놓는 가판대. 실제 화면과 같은 3:4 표지다 */}
      <div className="sh-rack">
        {/* 요리 이름이 서로 안 겹치니 그걸 이름표로 쓴다 */}
        {shelfBooks.map((b) => (
          // 색은 CSS 가 이 이름표를 보고 고른다. /shelf 의 표지와 같은 네 가지다
          <div className="sh-cover" key={b.title} data-tone={b.tone}>
            {/* 잡지 이름표. 표지 맨 위에 글자 사이를 벌려 얹는다 */}
            <span className="sh-brand">COOKPILOT</span>
            {/* 표지에 사진이 없으니 이 불꽃이 그림 몫을 한다 */}
            <span className="sh-pot" aria-hidden="true">
              <Icon name="flame" size={20} />
            </span>
            {/* 요리 이름 */}
            <span className="sh-title">{b.title}</span>
            {/* 몇 인분에 몇 단계인지 */}
            <span className="sh-serv">{b.serv}</span>
            {/* 아래쪽 띠. 잡지 표지의 바코드 자리쯤이다 */}
            <span className="sh-band" aria-hidden="true">
              {b.band}
            </span>
          </div>
        ))}
        {/* 끝에 빈자리를 하나 남긴다. "다음엔 뭘 만들까" 하는 마음이 들게 하려는 것이다 */}
        <div className="sh-cover sk" aria-hidden="true">
          <span>+</span>
        </div>
      </div>
      {/* 서재가 왜 필요한지 한마디로 보여 주는 혼잣말 */}
      <p className="shelf-say">“지난주에 만든 그 파스타”</p>
    </div>
  );
}

/** 그림 · 실제 장보기 화면(/shop)의 재료 목록을 줄여 그린 것. */
// [F3][함수] CartArt(): 장보기 화면을 흉내 낸 그림 조각
// 입력: 없음(site-content 의 cartItems) → 출력: 화면(JSX)
function CartArt() {
  /* 아래 줄에 쓸 "담긴 개수". 실제 화면도 체크된 것만 센다 */
  const picked = cartItems.filter((i) => i.pick).length;
  return (
    <div className="art art-cart">
      {/* 무슨 요리를 얼마나 만드는지 알려 주는 머리. 실제 화면과 같은 불빛 테두리다 */}
      <div className="sp-head">
        <p className="sp-badges">
          {/* 이 화면에서 유일하게 색을 채운 딱지 */}
          <span className="sp-ready">레시피 준비 완료</span>
          {/* 인분 · 걸음 수 · 재료 수 */}
          <span className="sp-meta">2인분 · 04단계 · 재료 5가지</span>
        </p>
        {/* 이 화면에서 가장 큰 글씨 */}
        <p className="sp-title">토마토 파스타</p>
      </div>

      {/* 재료 묶음의 제목 */}
      <p className="ct-h2">
        <span className="sp-h2-ico" aria-hidden="true">
          <Icon name="fridge" size={15} />
        </span>
        재료 챙기기
      </p>

      {/* 재료 목록 */}
      <ul className="sp-items">
        {/* 재료 이름이 서로 안 겹치니 그걸 이름표로 쓴다 */}
        {cartItems.map((i) => (
          // 집에 이미 있는 것은 체크를 빼 둔다. 실제 화면도 그렇게 시작한다
          <li className="sp-row" key={i.nm}>
            {/* 체크 상자 그림. 뜻은 옆 글씨가 알려 주니 읽어 주는 기계에는 숨긴다 */}
            <span className="sp-bx" data-on={i.pick ? "" : undefined} aria-hidden="true" />
            {/* 재료 이름 */}
            <span className="sp-name">{i.nm}</span>
            {/* 얼마나 필요한지 */}
            <span className="sp-amount">{i.amt}</span>
            {/* 고른 쇼핑몰에서 찾아 주는 작은 단추 */}
            <span className="sp-go" aria-hidden="true">
              <Icon name="search" size={13} />
            </span>
          </li>
        ))}
      </ul>

      {/* 지금 몇 개가 담겼는지 */}
      <p className="sp-cart">
        <span>장바구니</span>
        <span className="sp-cart-n">{picked}개</span>
      </p>
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
// [F4][함수] Showcase(): 위 세 그림 조각을 늘어놓는 묶음
// 입력: 없음 → 처리: StepsArt(F1)·ShelfArt(F2)·CartArt(F3) 배치 → 출력: 화면(JSX)
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
