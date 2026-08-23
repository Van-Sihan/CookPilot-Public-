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
import {
  livePost,
  postAuthorId,
  postComments,
} from "@/lib/adapter/supabase-post-reader";
import { myReactions } from "@/lib/adapter/supabase-reaction-gateway";
import { LivePostView } from "@/components/post/live-post-view";
import { LiveTalk } from "@/components/post/live-talk";
import { PostActions } from "@/components/post/post-actions";
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
// [F1][함수] generateMetadata(props): 링크를 붙였을 때 딸려 나갈 제목·그림
// 입력: props.params.id → 처리: 예시 글에서 찾고 없으면 표에서 → 출력: Metadata
export async function generateMetadata(
  props: PageProps<"/posts/[id]">,
): Promise<Metadata> {
  /* Next.js 16 에서 params 는 기다려야 하는 값이다.
     주소는 요청이 와야 알 수 있는 것이라 미리 만들어 둘 수 없기 때문이다 */
  const { id } = await props.params;

  // [F2][호출] id → findPost(site-content) → card (예시 글 열여섯 편 중에서)
  const card = findPost(id);

  /* 예시 글이 아니면 사람이 쓴 글일 수 있다. 표에도 없으면 아래 본문이 404 를 낸다 */
  // [F3][분기] 예시 글이 아님 → true: ▷ livePost(id) 로 표에서 찾아본다 / false: 예시 값 사용
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

// [F4][함수] PostPage(props): 글 하나를 여는 화면 (/posts/[id])
// 입력: props.params.id → 처리: 예시 글·사람이 쓴 글 두 갈래 → 반응·댓글 조회
// 출력: 화면(JSX) 또는 404
export default async function PostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;

  // 목록에서 쓰던 값과 열어야 보이는 값을 따로 찾는다
  // [F5][호출] id → findPost(site-content) → card / findPostDetail(domain/post:F6) → detail
  const card = findPost(id);
  const detail = findPostDetail(postDetails, id);

  /* 예시 글이 아니면 사람이 쓴 글을 찾아본다.
     둘 다 없을 때만 404 다 — 탭과 달리 다른 글로 바꿔 보여 주지 않는다 */
  // [F6][분기] 예시 글이 아님 → true: ▷ livePost(reader:F11) 로 표에서 읽어 온다 / false: null
  const live = card && detail ? null : await livePost(id);

  // [F7][분기] 둘 다 없음 → true: ▷ notFound()(404) / false: F8
  if (!live && (!card || !detail)) notFound();

  /* 댓글에 붙일 이름. 서버에서 물어본다 —
     키가 없는 기계에서도 화면은 떠야 하므로 실패는 "손님" 으로 본다 */
  // [F8][외부] ▷ currentUserEmail(supabase-auth-gateway:F12) → email → me(골뱅이 앞만)
  const email = await currentUserEmail().catch(() => null);

  // 이메일을 통째로 띄우지 않는다. 골뱅이 앞만 딴다
  const me = email ? email.split("@")[0] : "손님";

  /* 사람이 쓴 글에만 딸려 오는 것들 — 내가 눌러 둔 반응과, 표에 담긴 댓글.
     예시 글에는 표에 걸어 둘 자리가 없어서 안 물어본다.
     셋을 한꺼번에 물어보는 까닭 — 서로 상관이 없는 물음이라 차례로 기다릴 까닭이 없다 */
  // [F9][분기] 사람이 쓴 글인가?
  // [true]  → ▷ Promise.all([myReactions(reaction-gateway:F6), postAuthorId→postComments(reader:F14)])
  // [false] → 예시 글에는 표에 걸어 둘 자리가 없다. 빈 값으로 둔다
  // [F9][반환] reactions → PostActions 의 처음 상태 / comments → LiveTalk 목록
  const [reactions, comments] = live
    ? await Promise.all([
        myReactions(live.id),
        postAuthorId(live.id).then((authorId) =>
          postComments(live.id, authorId ?? undefined),
        ),
      ])
    : [{ liked: false, saved: false }, []];

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

              {/* 좋아요·저장과, 내 글이면 고치기·지우기.
                  본문 바로 아래 둔다 — 다 읽고 나서 누르는 자리다 */}
              <PostActions
                postId={live.id}
                likes={live.likeCount}
                liked={reactions.liked}
                saved={reactions.saved}
                signedIn={Boolean(email)}
                mine={live.mine}
              />
            </div>
          ) : (
            /* 예시 글. 본문과 레시피를 가로로 나란히 놓는다 */
            <div className="pd-body">
              <PostArticle card={card!} detail={detail!} />

              <PostRecipe recipe={detail!.recipe} />
            </div>
          )}

          {/* 댓글은 본문 아래에 폭을 좁혀 놓는다. 글줄이 길면 눈이 줄을 놓친다.
              사람이 쓴 글은 표에 담기고, 예시 글은 브라우저에만 쌓인다 —
              그 차이는 [[discuss-post]] 에 적어 두었다 */}
          {live ? (
            <LiveTalk postId={live.id} comments={comments} signedIn={Boolean(email)} />
          ) : (
            <PostTalk postId={id} given={detail?.comments ?? []} me={me} />
          )}
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
