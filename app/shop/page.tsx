import type { Metadata } from "next";
import Link from "next/link";
import { ShopShell } from "@/components/shop/shop-shell";
import { StepTrack } from "@/components/start/start-head";
import { site } from "@/lib/site-content";

/* 요리를 정한 사람만 오는 자리라 검색 결과에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "장보기 · 쿡파일럿" 이 된다
  title: "장보기",
  // 링크를 붙였을 때 같이 나오는 설명
  description: "레시피에 필요한 재료를 확인하고 장바구니에 담습니다.",
  // 검색에는 안 나오게 막되, 여기서 나가는 링크는 따라가게 둔다
  robots: { index: false, follow: true },
};

/**
 * /shop — 요리를 정한 뒤 오는 곳. 네 걸음 중 세 번째(장보기)다.
 *
 * 이 파일은 서버에서 한 번 그려지고 끝난다. 움직이는 것은 전부 ShopShell 안에 있다.
 */
export default function ShopPage() {
  return (
    <>
      {/* 다른 화면과 마찬가지로 탭 키를 쓰는 사람을 본문으로 곧장 데려다준다 */}
      <a className="skip" href="#shop-head">
        본문으로 건너뛰기
      </a>

      <div className="cookpage">
        {/* 가운데 맨 위 — 이름과 지금 어느 걸음인지 */}
        <header className="pick-head" id="shop-head">
          {/* 이름을 누르면 홈으로 간다. 요리 도중에도 빠져나갈 길이 있어야 한다 */}
          <Link className="pick-brand" href="/community">
            {site.nameKo}
            <span className="pick-brand-en">{site.name}</span>
          </Link>

          {/* 네 걸음 중 세 번째에 서 있다 */}
          <StepTrack now={2} />
        </header>

        {/* 진짜 장보기. 여기만 브라우저가 움직인다 */}
        <ShopShell />
      </div>
    </>
  );
}
