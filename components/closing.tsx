import Link from "next/link";
import { Logo, Waveform } from "@/components/brand";
import { footerLinks, site } from "@/lib/site-content";

/** 마지막으로 한 번 더 권하는 자리. 발밑의 큰 물결무늬가 불이 피어오르는 느낌을 만든다. */
// [F1][함수] Cta(): 소개 페이지 맨 아래 '시작하기' 자리
// 입력: 없음(site-content) → 출력: 화면(JSX)
export function Cta() {
  return (
    // glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다
    <section className="cta glow">
      <div className="wrap">
        <h2>
          오늘 저녁부터,
          {/* 두 마디로 끊어 읽히도록 이 자리에서 줄을 바꾼다 */}
          <br />
          AI와 함께 요리하세요.
        </h2>
        {/* 시작하기가 어렵지 않다는 걸 한 줄로 못 박는다 */}
        <p>준비물은 휴대폰 한 대와 재료뿐입니다.</p>
        {/* 이 페이지에서 가장 눌러 주길 바라는 단추 */}
        <Link className="btn btn-fill" href="/login">
          무료로 시작하기
        </Link>
        {/* 물결무늬를 아래로 붙여서 구역 바닥에 걸치게 하는 자리 */}
        <div className="wave">
          {/* 그림 속 색깔 이름이 다른 그림과 겹치면 안 돼서, 이 자리 이름을 같이 넘겨준다 */}
          <Waveform variant="lg" id="cta" />
        </div>
      </div>
    </section>
  );
}

/** 맨 아랫부분. 로고와 저작권 한 줄, 그리고 약관·문의 링크. */
// [F2][함수] SiteFooter(): 소개 페이지 맨 아랫줄
// 입력: 없음(site-content 의 footerLinks) → 출력: 화면(JSX)
export function SiteFooter() {
  return (
    <footer>
      {/* 화면이 넓으면 좌우로, 좁으면 위아래로 놓인다 */}
      <div className="wrap foot">
        <div>
          {/* 로고와 이름을 한 줄로 묶는다 */}
          <div className="brand">
            {/* 맨 아랫부분에 쓰는 색깔 이름 */}
            <Logo size={24} id="foot" />
            <span className="name">{site.name}</span>
          </div>
          {/* 해가 바뀌어도 고칠 일이 없게, 올해가 몇 년인지 그때그때 물어본다 */}
          <p className="copy">
            © {new Date().getFullYear()} {site.name} · {site.tagline}.
          </p>
        </div>
        {/* 메뉴가 여러 개라서, 읽어 주는 기계가 구분할 수 있게 이름을 붙인다 */}
        <nav aria-label="약관 및 문의">
          {/* 링크 주소가 아직 다 "#" 이라 겹친다. 그래서 겹치지 않는 글자를 이름표로 쓴다 */}
          {/* [F3][반복] footerLinks 를 훑어 링크를 하나씩 그린다 */}
          {footerLinks.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
