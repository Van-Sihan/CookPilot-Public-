import { Waveform } from "@/components/brand";
import { heroTalk } from "@/lib/site-content";

/** 첫 화면. 왼쪽은 약속, 오른쪽은 그 약속이 실제로 어떻게 들리는지 보여 준다. */
export function Hero() {
  return (
    <section className="hero glow">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow">음성으로 따라 하는 AI 요리 비서</span>
          <h1>
            손은 요리에,
            <br />
            레시피는
            <br />
            <em>쿡파일럿</em>에.
          </h1>
          <p className="lead">
            재료가 묻은 손으로 화면을 만질 일이 없습니다. 다음 단계도, 분량도,
            타이머도 말로 부르면 됩니다.
          </p>
          <div className="hero-cta">
            <a className="btn btn-fill" href="#pricing">
              무료로 시작하기
            </a>
            <a className="btn btn-line" href="#how">
              1분 시연 보기
            </a>
          </div>
          <p className="proof">
            <span className="flame" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            카드 등록 없이 바로 · 설치할 앱 없음
          </p>
        </div>

        <div className="hero-art">
          <div className="frame">
            <div className="frame-head">
              <span className="fh-live" aria-hidden="true" />
              <span className="fh-t">쿡파일럿</span>
              <span className="fh-r">토마토 파스타 · 3/7 단계</span>
            </div>

            <div className="talk">
              {heroTalk.map((t, i) => (
                <div key={i} className={`turn ${t.side}`}>
                  <span className="who">{t.who}</span>
                  <p className="bubble">{t.text}</p>
                  {t.chip && (
                    <span className="chip">
                      <span className="dot" aria-hidden="true" />
                      {t.chip}
                    </span>
                  )}
                  {t.note && <span className="cut">{t.note}</span>}
                </div>
              ))}
            </div>

            <div className="frame-foot">
              <span className="listening">
                <span className="live" aria-hidden="true" />
                듣고 있습니다
              </span>
              <Waveform variant="sm" id="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
