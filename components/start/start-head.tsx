/**
 * 시작 화면의 위쪽 — 로고, 이름, 한 줄 약속, 네 걸음, 접어 둔 사용법.
 * 전부 서버에서 미리 그려 놓는 것이라 브라우저가 따로 할 일이 없다.
 */

import { Logo } from "@/components/brand";
import { Icon } from "@/components/icons";
import { aiStudioUrl, site, startHowTo, startSteps } from "@/lib/site-content";

/** 로고와 이름. 홈보다 크게 놓아서 "여기가 출발점" 이라는 느낌을 준다 */
export function StartMast() {
  return (
    <div className="start-mast">
      {/* 그림 시안에 있던 큰 로고 자리. 홈의 작은 로고와 같은 그림을 키워서 쓴다 */}
      <Logo size={104} id="start" />

      {/* 한글 이름. 이 화면에서 가장 큰 제목이다 */}
      <h1 className="start-name">{site.nameKo}</h1>

      {/* 글자 사이를 넓게 벌린 영어 이름. 한글 이름 밑에서 도장처럼 받쳐 준다 */}
      <p className="start-name-en">{site.name}</p>

      {/* 홈에서 본 것과 같은 한 줄 약속. 엉뚱한 데 온 게 아니라고 알려 주는 셈이다 */}
      <p className="start-tagline">손은 요리에, 레시피는 AI에게</p>

      {/* 무슨 물건인지 한 번 더 쉽게 풀어 준다 */}
      <p className="start-sub">요리하는 내내 옆에서 말해주는 AI 음성 요리비서</p>
    </div>
  );
}

/**
 * 네 걸음. 지금은 첫 번째 걸음에 서 있다.
 * 뒤 세 화면은 아직 안 만들었지만, 키 넣는 일이 전체에서 어디쯤인지 먼저 보여 주려고 놓았다.
 */
export function StepTrack({ now }: { now: number }) {
  return (
    // 메뉴가 여러 개인 문서라서, 읽어 주는 기계가 구분할 수 있게 이름을 붙인다
    <nav className="start-steps" aria-label="시작 단계">
      {/* 순서가 정해진 걸음이라 번호가 붙는 목록을 쓴다 */}
      <ol>
        {startSteps.map((s, i) => (
          <li
            key={s.n}
            /* 지금 서 있는 걸음에만 불이 들어오고, 나머지는 흐린 글씨로 물러난다 */
            className={i === now ? "on" : undefined}
            /* 읽어 주는 기계에도 지금 어디쯤인지 알려 준다 */
            aria-current={i === now ? "step" : undefined}
          >
            {/* 몇 번째 걸음인지 */}
            <span className="st-n">{s.n}</span>
            {/* 걸음 이름 */}
            <span className="st-t">{s.title}</span>
            {/* 그 걸음에서 실제로 뭘 하는지 */}
            <span className="st-s">{s.sub}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 자세한 사용법. 자주 묻는 질문처럼 <details> 라서 자바스크립트 없이 열고 닫힌다 */
export function HowTo() {
  return (
    <details className="start-how">
      {/* 접혀 있을 때 보이는 줄 */}
      <summary>
        {/* 열리면 이 화살표가 아래쪽을 보도록 돌아간다 */}
        <i className="start-how-arrow" aria-hidden="true" />
        자세한 사용법 보기
      </summary>

      {/* 펼쳐지는 내용 */}
      <div className="start-how-body">
        {/* 질문 글이 서로 안 겹치니 그대로 이름표로 쓴다 */}
        {startHowTo.map((h) => (
          <div className="start-how-item" key={h.q}>
            {/* 질문. 이 화면의 큰 제목 아래 단계라서 작은 제목으로 둔다 */}
            <h3>{h.q}</h3>
            {/* 답 */}
            <p>{h.a}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

/** 아직 키가 없는 사람에게 어디서 받는지 알려 준다. 카드 밖에 둬서 "지금 할 일" 과 헷갈리지 않게 한다 */
export function KeyHelp() {
  return (
    <div className="start-help">
      {/* 키 받는 게 오래 걸리는 일이 아니라는 걸 먼저 알려 준다 */}
      <p className="start-note">
        키가 없으신가요? 구글 계정만 있으면 1분 안에 무료로 받을 수 있습니다.
      </p>

      {/* 구글 쪽으로 나가는 링크라 새 탭에서 연다. 적던 키가 날아가지 않게 하려는 것이다 */}
      <a
        // 이 화면에서 꼭 해야 할 일은 아니니까 테두리만 있는 작은 단추로 둔다
        className="btn btn-line btn-sm start-getkey"
        href={aiStudioUrl}
        target="_blank"
        // 새로 열린 탭이 이 페이지를 건드리지 못하게 막고, 어디서 왔는지도 알려 주지 않는다
        rel="noreferrer noopener"
      >
        {/* 열쇠 그림. 무슨 뜻인지는 옆 글씨가 알려 주니 읽어 주는 기계에는 숨긴다 */}
        <span className="start-getkey-ico" aria-hidden="true">
          {/* 작은 단추 안이라 18픽셀로 줄여서 그린다 */}
          <Icon name="key" size={18} />
        </span>
        Google AI Studio에서 키 받기
      </a>
    </div>
  );
}
