import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { WriteForm } from "@/components/write/write-form";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { livePost } from "@/lib/adapter/supabase-post-reader";
import { writeCopy } from "@/lib/write-content";

/* 내 글을 고치는 자리라 검색에 나올 이유가 없다 */
export const metadata: Metadata = {
  title: writeCopy.titleEdit,
  description: writeCopy.leadEdit,
  robots: { index: false, follow: false },
};

/**
 * /posts/[id]/edit — 내가 쓴 글을 고치는 곳.
 *
 * 글쓰기와 **같은 폼**을 쓴다. 칸도 검사도 똑같은데 두 벌로 두면
 * 한쪽만 고쳐져서 "새로 쓸 때는 되는데 고칠 때는 안 되는" 칸이 생긴다.
 *
 * 여기서 막는 것이 셋이다 — 로그인 안 한 사람, 없는 글, 남의 글.
 * 표(RLS)가 저장할 때 또 막지만, 다 적고 나서 거절당하는 것보다
 * 들어올 때 돌려보내는 편이 낫다.
 */
// [F1][함수] EditPostPage(props): 내 글을 고치는 화면 (/posts/[id]/edit)
// 입력: props.params.id → 처리: 로그인·존재·주인 세 가지를 막고 WriteForm 에 값 전달
// 출력: 화면(JSX) 또는 redirect/404
export default async function EditPostPage(props: PageProps<"/posts/[id]/edit">) {
  const { id } = await props.params;

  // [F2][외부] ▷ currentUserEmail() → email
  const email = await currentUserEmail().catch(() => null);
  // [F3][분기] 로그인 안 함 → true: ▷ redirect('/login?next=…') / false: F4
  if (!email) redirect(`/login?next=/posts/${id}/edit`);

  // [F4][외부] id ▷ livePost(reader:F11) → post (mine 판정이 여기 붙어 온다)
  const post = await livePost(id);

  /* 없는 글이거나 예시 글이면 404.
     예시 글은 파일에 있어서 고칠 자리가 아예 없다 */
  // [F5][분기] 없는 글이거나 예시 글 → true: ▷ notFound()(404) / false: F6
  if (!post) notFound();

  /* 남의 글이면 그 글로 돌려보낸다. 404 로 두지 않는 까닭 —
     글은 실제로 있고 볼 수도 있다. 못 고칠 뿐이다 */
  // [F6][분기] 남의 글 → true: ▷ redirect('/posts/<id>')(볼 수는 있으니 404 가 아니다) / false: F7
  // [F7][반환] post 의 칸들 → WriteForm(editing) → revisePostAction(actions/post:F10)
  if (!post.mine) redirect(`/posts/${id}`);

  return (
    <>
      <a className="skip" href="#wr-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      <main className="ask-page glow" id="wr-main">
        <div className="ask-wrap">
          <header className="ask-head">
            {/* 돌아가는 길은 목록이 아니라 그 글이다. 고치다 그만두면 원래 보던 자리로 */}
            <Link className="pd-back" href={`/posts/${id}`}>
              ← 글로 돌아가기
            </Link>

            <h1 className="ask-title">{writeCopy.titleEdit}</h1>
            <p className="ask-lead">{writeCopy.leadEdit}</p>
          </header>

          <WriteForm
            // 고치는 중에는 방금 만든 요리를 끌어오지 않는다. 적어 둔 것을 덮어쓴다
            fromCook={false}
            editing={{
              id: post.id,
              title: post.title,
              // 표에서는 없는 값이 null 로 온다. 칸에는 빈 글자를 넣어야 한다
              summary: post.summary ?? "",
              body: post.body,
              badge: post.badge,
              minutes: post.minutes ? String(post.minutes) : "",
              tone: post.tone,
              imageUrl: post.imageUrl ?? "",
            }}
          />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
