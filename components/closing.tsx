import { Logo, Waveform } from "@/components/brand";
import { footerLinks, site } from "@/lib/site-content";

/** 마지막 권유. 발치의 큰 파형이 불이 피어오르는 자리를 잡아 준다. */
export function Cta() {
  return (
    <section className="cta glow">
      <div className="wrap">
        <h2>
          오늘 저녁부터,
          <br />
          손 대지 않고 요리하세요.
        </h2>
        <p>준비물은 휴대폰 한 대와 재료뿐입니다.</p>
        <a className="btn btn-fill" href="#pricing">
          무료로 시작하기
        </a>
        <div className="wave">
          <Waveform variant="lg" id="cta" />
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <div className="brand">
            <Logo size={24} id="foot" />
            <span className="name">{site.name}</span>
          </div>
          <p className="copy">
            © {new Date().getFullYear()} {site.name} · {site.tagline}.
          </p>
        </div>
        <nav aria-label="약관 및 문의">
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
