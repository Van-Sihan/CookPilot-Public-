import { Cta, SiteFooter } from "@/components/closing";
import { Faq } from "@/components/faq";
import { Features, Statement } from "@/components/features";
import { Hero } from "@/components/hero";
import { Pricing } from "@/components/pricing";
import { Showcase } from "@/components/showcase";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site-content";

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>

      <div className="band" id="top">
        {site.band}
      </div>

      <SiteHeader />

      <main id="main">
        <Hero />
        <hr className="rule" />
        <Statement />
        <Features />
        <Showcase />
        <Pricing />
        <Faq />
        <Cta />
      </main>

      <SiteFooter />
    </>
  );
}
