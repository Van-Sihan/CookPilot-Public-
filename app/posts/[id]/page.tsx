import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { PostArticle } from "@/components/post/post-article";
import { PostRecipe } from "@/components/post/post-recipe";
import { PostTalk } from "@/components/post/post-talk";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { livePost } from "@/lib/adapter/supabase-post-reader";
import { LivePostView } from "@/components/post/live-post-view";
import { findPostDetail, photoPath } from "@/lib/domain/post";
import { postDetails } from "@/lib/post-content";
import { findPost } from "@/lib/site-content";

/**
 * /posts/[id] — 카드를 눌러 들어오는 곳.
 *
 * "use client" 가 없다. 브라우저가 움직이는 곳은 후기 칸과 요리 단추뿐이고
 * 둘 다 따로 떼어 두었다. 본문 열여섯 편은 서버에만 남는다.
 *
 * 값 두 벌을 합쳐 그린다 — 목록에서 쓰던 카드(제목·좋아요)와,
 * 열어야 보이는 속(본문·레시피·댓글). 나뉘어 있는 까닭은 [[post]] 에 적어 두었다.
 */

/** 링크를 붙였을 때 딸려 나가는 제목과 그림. 글마다 달라서 함수로 만든다 */
export async function generateMetadata(
  props: PageProps<"/posts/[id]">,
): Promise<Metadata> {
  /* Next.js 16 에서 params 는 기다려야 하는 값이다.
     주소는 요청이 와야 알 수 있는 것이라 미리 만들어 둘 수 없기 때문이다 */
  const { id } = await props.params;

  const card = findPost(id);

  /* 예시 글이 아니면 사람이 쓴 글일 수 있다. 표에도 없으면 아래 본문이 404 를 낸다 */
  if (!card) {
    const live = await livePost(id);

    return live
      ? { title: live.title, description: live.summary ?? `${live.chef} 님이 올린 글입니다.` }
      : { title: "없는 글" };
  }

  return {
    // 위쪽 설정을 타고 "제목 · 쿡파일럿" 이 된다
    title: card.title,
    description: card.summary ?? `${card.chef} 님이 올린 레시피입니다.`,
    // 카카오톡이나 슬랙에 붙였을 때 요리 사진이 같이 뜬다
    openGraph: { images: [photoPath(id)] },
  };
}

export default async function PostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;

  // 목록에서 쓰던 값과 열어야 보이는 값을 따로 찾는다
  const card = findPost(id);
  const detail = findPostDetail(postDetails, id);

  /* 예시 글이 아니면 사람이 쓴 글을 찾아본다.
     둘 다 없을 때만 404 다 — 탭과 달리 다른 글로 바꿔 보여 주지 않는다 */
  const live = card && detail ? null : await livePost(id);

  if (!live && (!card || !detail)) notFound();

  /* 후기에 붙일 이름. 서버에서 물어본다 —
     키가 없는 기계에서도 화면은 떠야 하므로 실패는 "손님" 으로 본다 */
  const email = await currentUserEmail().catch(() => null);

  // 이메일을 통째로 띄우지 않는다. 골뱅이 앞만 딴다
  const me = email ? email.split("@")[0] : "손님";

  return (
    <>
      {/* 탭 키를 쓰는 사람을 곧장 본문으로 데려다준다 */}
      <a className="skip" href="#pd-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      {/* glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다. 목록 화면과 같은 것을 쓴다 */}
      <main className="pd-page glow" id="pd-main">
        <div className="pd-wrap">
          {live ? (
            /* 사람이 쓴 글. 구조가 잡힌 레시피가 없어 옆 칸을 안 세운다 */
            <div className="pd-body pd-body-one">
              <LivePostView post={live} />
            </div>
          ) : (
            /* 예시 글. 본문과 레시피를 가로로 나란히 놓는다 */
            <div className="pd-body">
              <PostArticle card={card!} detail={detail!} />

              <PostRecipe recipe={detail!.recipe} />
            </div>
          )}

          {/* 후기는 본문 아래에 폭을 좁혀 놓는다. 글줄이 길면 눈이 줄을 놓친다 */}
          <PostTalk postId={id} given={detail?.comments ?? []} me={me} />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
