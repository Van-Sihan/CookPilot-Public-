import type { Metadata } from "next";
import Link from "next/link";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { AskLink } from "@/components/community/ask-link";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunitySide } from "@/components/community/community-side";
import { HomeMe } from "@/components/community/home-me";
import {
  EmptyPosts,
  FeaturedCard,
  PostCard,
} from "@/components/community/post-cards";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { livePosts } from "@/lib/adapter/supabase-post-reader";
import { matchesQuery, resolveQuery, resolveTab } from "@/lib/domain/community-tab";
import {
  communityCopy,
  postsByQuery,
  postsByTab,
  type CommunityPost,
} from "@/lib/site-content";

/* 커뮤니티는 로그인 화면과 달리 검색에 나와도 되는 자리다. 남의 요리를 보러 오는 곳이다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "커뮤니티 · 쿡파일럿" 이 된다
  title: "커뮤니티",
  // 링크를 붙였을 때 같이 나오는 설명. 제목 아래 한 줄을 그대로 쓴다
  description: communityCopy.lead,
};

/**
 * /community — 다른 사람이 올린 요리를 모아 보는 곳.
 *
 * "use client" 가 없다. 이 화면은 통째로 서버에서 그려진다 —
 * 탭이 단추가 아니라 링크라서 브라우저가 할 일이 없다. [[community-side]] 참고.
 *
 * PageProps 는 `next dev`·`next build` 가 만들어 주는 전역 타입이라 import 하지 않는다.
 * '/community' 를 글자 그대로 적어 두면 그 경로에 맞는 params·searchParams 가 붙는다.
 */
export default async function CommunityPage(props: PageProps<"/community">) {
  /* Next.js 16 에서 searchParams 는 기다려야 하는 값이다.
     주소는 요청이 와야 알 수 있는 것이라 미리 만들어 둘 수 없기 때문이다 */
  const params = await props.searchParams;

  // 주소에 뭐가 적혀 있든 아는 탭으로 걸러 낸다. 판단은 도메인이 한다
  const tab = resolveTab(params.tab);

  // 검색칸에 친 글자. 주소에 실려 온다
  const query = resolveQuery(params.q);

  /* 사람이 쓴 글. 표가 아직 없거나 못 다녀오면 빈 목록이 와서 예시 글만 보인다 */
  const live = await livePosts();

  /* 표에서 온 글을 카드가 아는 모양으로 옮긴다.
     "최신" 탭에만 걸어 두는 까닭 — 인기는 좋아요 순이고 브랜드·유행은
     갈래가 정해져 있다. 갓 쓴 글이 갈 자리는 최신이 맞다 */
  const liveCards: CommunityPost[] = live.map((p) => ({
    id: p.id,
    tabs: ["recent"],
    badge: p.badge,
    minutes: p.minutes ?? undefined,
    title: p.title,
    summary: p.summary ?? undefined,
    chef: p.chef,
    hearts: String(p.likeCount),
    tone: p.tone,
    photo: p.imageUrl ?? undefined,
  }));

  /* 찾는 중이면 갈래를 안 보고 전부에서 찾는다.
     "인기" 탭에서 찾았다고 최신 글을 빼면 사람은 없는 줄 안다 */
  const sample = query ? postsByQuery(query) : postsByTab(tab);

  /* 사람이 쓴 글을 앞에 세운다. 방금 쓴 글이 스무 번째에 있으면
     올라간 줄 모르고 다시 쓴다 */
  const shown = query
    ? [...liveCards.filter((p) => matchesQuery([p.title, p.chef, p.badge, p.summary ?? ""], query)), ...sample]
    : tab === "recent"
      ? [...liveCards, ...sample]
      : sample;

  const posts = shown;

  /* 지금 들어와 있는 사람. 서버에서 물어본다 —
     브라우저에 담아 둔 값을 믿으면 로그아웃한 사람도 로그인한 것처럼 보인다.
     키가 없는 기계에서도 화면은 떠야 하므로 실패는 "손님" 으로 본다 */
  const email = await currentUserEmail().catch(() => null);

  /* 맨 앞 글은 크게, 나머지는 작게 놓는다.
     글이 없을 수도 있어서 at(0) 로 꺼낸다 — posts[0] 는 없을 때도 있다고 알려 주지 않는다 */
  const lead = posts.at(0);
  const rest = posts.slice(1);

  return (
    <>
      {/* 탭 키를 쓰는 사람을 곧장 글 목록으로 데려다준다 */}
      <a className="skip" href="#cm-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      {/* glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다. 소개 페이지와 같은 것을 쓴다 */}
      <main className="cm glow" id="cm-main">
        <div className="cm-wrap">
          <CommunityHero query={query} />

          {/* 왼쪽 기둥과 글 목록을 가로로 나란히 놓는 틀 */}
          <div className="cm-body">
            {/* 지금 어느 탭인지 알려 줘야 그 자리에 불이 들어온다 */}
            <div className="cm-side-stack">
            {/* 홈의 첫머리 — 내가 누구인지와, 부엌으로 들어가는 문 */}
            <HomeMe email={email} />

            {/* 올라온 글에 물어보는 문. 부엌으로 가는 문 바로 아래 둔다 */}
            <AskLink />

            <CommunitySide now={tab} />
          </div>

            {/* 목록이 바뀌는 자리. 읽어 주는 기계가 건너뛸 수 있게 이름을 붙인다 */}
            <section className="cm-list" aria-label="올라온 글">
              {/* 찾는 중이면 몇 개를 찾았는지와 그만두는 길을 알려 준다.
                  이게 없으면 목록이 왜 줄었는지 모른 채로 헤맨다 */}
              {query && (
                <p className="cm-found">
                  <strong>{query}</strong> 로 찾은 글 {posts.length}개
                  <Link href="/community">검색 지우기</Link>
                </p>
              )}

              {/* 글이 하나도 없으면 빈 화면 대신 안내를 놓는다 */}
              {!lead && <EmptyPosts searching={Boolean(query)} />}

              {/* 맨 앞 글 하나는 가로로 눕혀 크게 */}
              {lead && <FeaturedCard post={lead} />}

              {/* 나머지는 두 칸씩 깔린다. 없으면 이 틀도 그리지 않는다 */}
              {rest.length > 0 && (
                <div className="cm-grid">
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
