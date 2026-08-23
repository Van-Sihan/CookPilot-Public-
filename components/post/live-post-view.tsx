/**
 * 사람이 쓴 글 한 편.
 *
 * 예시 글([[post-article]])과 나눠 둔 까닭 — 예시 글에는 구조가 잡힌
 * 레시피(재료 배열, 순서 배열)가 붙어 있지만 사람이 쓴 글에는 본문 하나뿐이다.
 * 한 컴포넌트에 둘을 다 넣으면 "있을 수도 없을 수도 있는 값" 이 늘어서,
 * 어느 쪽을 그리는 중인지 매번 확인해야 한다.
 *
 * "use client" 가 없다. 여기 있는 것은 전부 서버에서 그려지고 끝나는 글자다.
 */

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import type { LivePost } from "@/lib/adapter/supabase-post-reader";
import { postCopy } from "@/lib/post-copy";

export function LivePostView({ post }: { post: LivePost }) {
  return (
    <article className="pd">
      <Link className="pd-back" href="/community">
        {postCopy.back}
      </Link>

      {/* 그림은 있을 때만. 쿡파일럿이 그려 준 레시피 카드가 붙는다 */}
      {post.imageUrl && (
        <figure className="pd-shot pd-shot-card">
          <Image
            className="pd-img"
            src={post.imageUrl}
            alt={`${post.title} 레시피 카드`}
            fill
            sizes="(max-width: 900px) 100vw, 860px"
            priority
            /* 우리 스토리지 주소라 next/image 가 줄여 주지 못한다.
               줄이려면 next.config 에 호스트를 적어야 하는데, 표지는
               이미 1080px 짜리라 그대로 내보내도 된다 */
            unoptimized
          />
        </figure>
      )}

      <div className="pd-meta">
        <span className="cm-badge">{post.badge}</span>
        {post.minutes && <span className="cm-min">{post.minutes}분</span>}
        <span className="pd-date">{post.published}</span>
      </div>

      <h1 className="pd-title">{post.title}</h1>

      <div className="pd-by">
        <span className="pd-chef">
          <span className="pd-chef-mark" aria-hidden="true">
            {post.chef.slice(0, 1)}
          </span>
          {post.chef}
        </span>

        <span className="pd-hearts">
          <Icon name="heart" size={16} />
          {post.likeCount}
          <span className="sr-only">개의 좋아요</span>
        </span>
      </div>

      {/* 요약은 적었을 때만 */}
      {post.summary && <p className="pd-intro">{post.summary}</p>}

      {/* 본문. 사람이 나눈 줄을 그대로 살린다. HTML 로 해석하지 않으므로 안전하다 */}
      <p className="pd-p pd-body">{post.body}</p>
    </article>
  );
}
