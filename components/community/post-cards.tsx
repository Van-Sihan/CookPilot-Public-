/**
 * 커뮤니티에 올라온 글 카드.
 *
 * 첫 글은 크게(가로로 눕혀 그림과 글을 나란히), 나머지는 작게 두 줄로 놓인다.
 * 시안(design/blogmain.png)의 배치를 그대로 따랐다.
 *
 * 처음에는 CSS 로 그린 접시를 놓았지만 지금은 **진짜 요리 사진**을 쓴다.
 * 위키미디어 공용에서 받아 온, 허락이 분명한 사진들이다.
 * 찍은 사람과 허락은 글을 열었을 때 사진 밑에 적힌다 — [[post-article]] 참고.
 */

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { photoPath } from "@/lib/domain/post";
import type { CommunityPost } from "@/lib/site-content";

/**
 * 카드에 얹히는 사진.
 *
 * 사진마다 가로세로가 달라서 fill 로 틀을 채우고 넘치는 쪽을 잘라 낸다.
 * 색조(tone) 는 사진이 늦게 올 때 뒤에 깔리는 바탕색으로만 남겨 두었다 —
 * 흰 네모가 번쩍이는 것보다 어두운 색이 잠깐 보이는 편이 낫다.
 */
function Shot({ post, lead }: { post: CommunityPost; lead?: boolean }) {
  return (
    <div className={`cm-shot cm-shot-${post.tone}`}>
      <Image
        className="cm-shot-img"
        /* 사람이 쓴 글은 스토리지 주소가 담겨 온다. 예시 글은 id 로 찾는다 */
        src={post.photo ?? photoPath(post.id)}
        /* 카드에서는 제목이 바로 옆에 있어서 사진 설명을 또 읽어 줄 필요가 없다.
           빈 alt 는 "장식이니 건너뛰라" 는 뜻이다 */
        alt=""
        fill
        /* 화면 폭에 따라 실제로 몇 픽셀이 필요한지 알려 준다.
           안 적으면 넓은 화면 기준으로 큰 파일을 늘 받아 온다 */
        sizes={
          lead
            ? "(max-width: 900px) 100vw, 400px"
            : "(max-width: 900px) 100vw, 340px"
        }
        /* 우리 스토리지 그림은 next/image 가 줄여 주지 못한다.
           호스트를 next.config 에 적어야 하는데, 표지는 우리가 만든 것이라
           크기를 이미 알고 있어 그대로 내보내도 된다 */
        unoptimized={Boolean(post.photo)}
      />
    </div>
  );
}

/** 딱지와 시간. 큰 카드와 작은 카드가 똑같이 쓴다 */
function Meta({ post }: { post: CommunityPost }) {
  return (
    <div className="cm-meta">
      <span className="cm-badge">{post.badge}</span>

      {/* 시간이 없는 글도 있어서 있을 때만 그린다 */}
      {post.minutes && <span className="cm-min">{post.minutes}분</span>}
    </div>
  );
}

/** 올린 사람과 좋아요. 카드 맨 아래 줄 */
function Foot({ post }: { post: CommunityPost }) {
  return (
    <div className="cm-card-foot">
      <span className="cm-chef">
        {/* 이름 첫 글자를 딴 동그란 표시. 사진이 없으니 글자로 대신한다 */}
        <span className="cm-chef-mark" aria-hidden="true">
          {post.chef.slice(0, 1)}
        </span>
        {post.chef}
      </span>

      {/* 하트와 숫자를 한 덩어리로 읽히게 묶는다 */}
      <span className="cm-hearts">
        <Icon name="heart" size={14} />
        {post.hearts}
        {/* 숫자만 있으면 무슨 숫자인지 모른다. 눈에는 안 보이게 뜻을 붙여 준다 */}
        <span className="sr-only">개의 좋아요</span>
      </span>
    </div>
  );
}

/** 맨 위에 크게 놓이는 글 하나. 그림과 글이 가로로 나란히 앉는다 */
export function FeaturedCard({ post }: { post: CommunityPost }) {
  return (
    <article className="cm-card cm-card-lead">
      <Shot post={post} lead />

      <div className="cm-card-body">
        <Meta post={post} />

        {/* 제목 전체를 링크로 감싼다. 누를 자리가 넓어야 손가락으로도 잘 눌린다 */}
        <h2 className="cm-card-title">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </h2>

        {/* 요약은 큰 카드에만 있다. 없는 글도 있어서 있을 때만 그린다 */}
        {post.summary && <p className="cm-card-sum">{post.summary}</p>}

        <Foot post={post} />
      </div>
    </article>
  );
}

/** 아래에 두 줄로 깔리는 작은 글 카드 */
export function PostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="cm-card">
      <Shot post={post} />

      <div className="cm-card-body">
        <Meta post={post} />

        <h2 className="cm-card-title">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </h2>

        <Foot post={post} />
      </div>
    </article>
  );
}

/**
 * 글이 하나도 없는 탭에 놓이는 자리.
 *
 * 빈 화면을 그냥 두면 고장 난 것처럼 보인다. 아직 글이 없을 뿐이라고 말해 준다.
 */
export function EmptyPosts({ searching }: { searching?: boolean }) {
  return (
    <p className="cm-empty">
      {searching
        ? "찾는 글이 없습니다. 다른 말로 찾아 보세요."
        : "아직 이 갈래에 올라온 글이 없습니다. 첫 번째가 되어 보세요."}
    </p>
  );
}
