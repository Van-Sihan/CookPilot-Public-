import Link from "next/link";
import { Waveform } from "@/components/brand";
import { heroTalk } from "@/lib/site-content";

/** 첫 화면. 왼쪽은 우리가 하는 약속, 오른쪽은 그게 실제로 어떤 모습인지 보여 준다. */
// [F1][함수] Hero(): 소개 페이지 맨 위의 큰 자리
// 입력: 없음(site-content) → 처리: 제목·설명·말풍선 배치 → 출력: 화면(JSX)
export function Hero() {
  return (
    // glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다
    <section className="hero glow">
      {/* 화면이 넓으면 글과 그림을 좌우로 나눠 놓는 틀 */}
      <div className="wrap hero-grid">
        <div>
          {/* 제목 위 작은 글씨. 이게 무슨 물건인지 한 줄로 밝힌다 */}
          <span className="eyebrow">음성으로 따라 하는 AI 요리 비서</span>
          <h1>
            손은 요리에,
            {/* 세 마디로 끊어 읽히도록 줄 바뀌는 자리를 직접 정한다 */}
            <br />
            레시피는
            <br />
            {/* 서비스 이름만 다른 글꼴과 색으로 도드라지게 한다 */}
            <em>쿡파일럿</em>에.
          </h1>
          {/* 제목을 풀어서 설명해 주는 두 문장 */}
          <p className="lead">
            재료가 묻은 손으로 화면을 만질 일이 없습니다.
            다음 단계도, 분량도, 타이머도 음성으로 불러주세요.
          </p>
          {/* 단추 두 개를 한 줄에 놓는다 */}
          <div className="hero-cta">
            {/* 로그인 화면으로 넘어간다. Link 를 쓰면 누르기 전에 미리 받아 둬서 빠르다 */}
            <Link className="btn btn-fill" href="/login">
              무료로 시작하기
            </Link>
            {/* 같은 페이지 안에서 아래로 내려가는 것뿐이라 보통 링크로 둔다 */}
            <a className="btn btn-line" href="#how">
              1분 시연 보기
            </a>
          </div>
          {/* 카드도 설치도 필요 없다는 안심 문구. 지금은 말을 다듬는 중이라 잠깐 접어 두었다
          <p className="proof">
            <span className="flame" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            카드 등록 없이 바로 · 설치할 앱 없음
          </p> */}
        </div>

        {/* 오른쪽 그림 자리 */}
        <div className="hero-art">
          {/* 휴대폰 화면처럼 보이게 하는 테두리 */}
          <div className="frame">
            {/* 화면 맨 위 띠 — 지금 켜져 있고 몇 번째 단계인지 알려 준다 */}
            <div className="frame-head">
              {/* 깜빡이는 점. 무슨 뜻인지는 옆 글씨가 알려 주니 읽어 주는 기계에는 숨긴다 */}
              <span className="fh-live" aria-hidden="true" />
              {/* 앱 이름 */}
              <span className="fh-t">쿡파일럿</span>
              {/* 지금 만드는 요리와 몇 번째 단계인지 */}
              <span className="fh-r">토마토 파스타 · 3/7 단계</span>
            </div>

            {/* 주고받는 말이 쌓이는 자리 */}
            <div className="talk">
              {/* 미리 정해 둔 대사라 순서가 절대 안 바뀐다. 그래서 몇 번째인지를 이름표로 써도 된다 */}
              {/* [F2][반복] heroTalk 을 훑어 주고받는 말풍선을 그린다 */}
              {heroTalk.map((t, i) => (
                // 내가 한 말은 오른쪽에, 쿡파일럿이 한 말은 왼쪽에 붙인다
                <div key={i} className={`turn ${t.side}`}>
                  {/* 누가 한 말인지 */}
                  <span className="who">{t.who}</span>
                  {/* 말풍선 안의 말 */}
                  <p className="bubble">{t.text}</p>
                  {/* 그 말 때문에 실제로 뭔가 일어났으면(타이머 켜짐 같은 것) 알약 모양으로 붙인다 */}
                  {t.chip && (
                    <span className="chip">
                      {/* 알약 앞의 작은 점. 꾸미기용이라 읽어 주는 기계에는 숨긴다 */}
                      <span className="dot" aria-hidden="true" />
                      {t.chip}
                    </span>
                  )}
                  {/* "말을 끊어도 된다" 같은 곁다리 설명 */}
                  {t.note && <span className="cut">{t.note}</span>}
                </div>
              ))}
            </div>

            {/* 화면 맨 아래 띠 — 지금도 듣고 있다는 표시 */}
            <div className="frame-foot">
              <span className="listening">
                {/* 숨 쉬듯 커졌다 작아지는 점. 무슨 뜻인지는 옆 글씨가 알려 준다 */}
                <span className="live" aria-hidden="true" />
                듣고 있습니다
              </span>
              {/* 작은 물결무늬는 막대가 움직인다. 이 자리에 쓸 색깔 이름을 같이 넘겨준다 */}
              <Waveform variant="sm" id="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
