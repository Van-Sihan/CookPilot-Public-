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
import { TagLink } from "@/components/community/tag-link";
import type { CommunityPost } from "@/lib/site-content";

/**
 * 카드에 얹히는 사진.
 *
 * 사진마다 가로세로가 달라서 fill 로 틀을 채우고 넘치는 쪽을 잘라 낸다.
 * 색조(tone) 는 사진이 늦게 올 때 뒤에 깔리는 바탕색으로만 남겨 두었다 —
 * 흰 네모가 번쩍이는 것보다 어두운 색이 잠깐 보이는 편이 낫다.
 *
 * **사진이 없으면 아예 안 그린다.** 전에는 사진이 없을 때 `/food/<id>.jpg` 를
 * 찍어 봤는데, 사람이 쓴 글의 id 는 uuid 라 그런 파일이 있을 리가 없다.
 * 그래서 "최신" 탭이 통째로 깨진 그림 아이콘으로 덮였다.
 * 없는 파일을 찍어 보느니 없다고 그리는 편이 낫다 — 부르는 쪽이 채워 준다.
 */
// [F1][함수] Shot({post, lead}): 카드에 얹히는 사진 자리
// 입력: post(photo·tone) + lead(큰 카드인지) → 처리: photo 가 있으면 그림, 없으면 불꽃
// 출력: 화면(JSX)
function Shot({ post, lead }: { post: CommunityPost; lead?: boolean }) {
  return (
    <div className={`cm-shot cm-shot-${post.tone}`}>
      {/* [F2][분기] post.photo 가 있나? */}
      {/* [true]  → next/image 로 그림 (http 로 시작하면 우리 스토리지라 unoptimized) */}
      {/* [false] → 색조 바탕 + 불꽃 하나 (없는 파일을 찍어 보면 깨진 그림이 뜬다) */}
      {post.photo ? (
        <Image
          className="cm-shot-img"
          src={post.photo}
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
          /* 우리 스토리지에서 오는 그림(표지)만 그대로 내보낸다.
             그쪽은 우리가 만든 것이라 크기를 이미 알고 있고, next/image 가
             줄여 주려면 호스트를 next.config 에 또 적어야 한다.
             public 아래 있는 요리 사진은 줄여 주는 편이 낫다 */
          unoptimized={post.photo.startsWith("http")}
        />
      ) : (
        /* 표지를 안 만든 글. 색조 바탕 위에 불꽃 하나만 얹는다 —
           깨진 그림보다 조용하고, 무엇이 빠졌는지도 드러나지 않는다 */
        <span className="cm-shot-none" aria-hidden="true">
          <Icon name="flame" size={lead ? 34 : 26} />
        </span>
      )}
    </div>
  );
}

/** 딱지와 시간. 큰 카드와 작은 카드가 똑같이 쓴다 */
// [F3][함수] Meta({post}): 카테고리 딱지와 걸리는 시간
// 입력: post → 처리: TagLink(F1 of tag-link) + 분 → 출력: 화면(JSX)
function Meta({ post }: { post: CommunityPost }) {
  return (
    <div className="cm-meta">
      {/* 카테고리는 태그다. 누르면 같은 태그가 붙은 글만 모아 본다 */}
      <TagLink tag={post.badge} />

      {/* 시간이 없는 글도 있어서 있을 때만 그린다 */}
      {post.minutes && <span className="cm-min">{post.minutes}분</span>}
    </div>
  );
}

/** 올린 사람과 좋아요. 카드 맨 아래 줄 */
// [F4][함수] Foot({post}): 카드 맨 아랫줄(글쓴이와 좋아요 수)
// 입력: post → 출력: 화면(JSX)
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
// [F5][함수] FeaturedCard({post}): 맨 위에 크게 놓이는 카드 하나
// 입력: post → 처리: Shot(F1)·Meta(F3)·Foot(F4) 를 가로로 배치 → 출력: 화면(JSX)
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
// [F6][함수] PostCard({post}): 아래에 깔리는 작은 카드
// 입력: post → 처리: Shot(F1)·Meta(F3)·Foot(F4) 를 세로로 배치 → 출력: 화면(JSX)
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
// [F7][함수] EmptyPosts({searching}): 글이 하나도 없을 때 놓이는 자리
// 입력: searching(검색 중인지) → 처리: 문구를 갈라 고름 → 출력: 화면(JSX)
export function EmptyPosts({ searching }: { searching?: boolean }) {
  return (
    <p className="cm-empty">
      {searching
        ? "찾는 글이 없습니다. 다른 말로 찾아 보세요."
        : "아직 이 갈래에 올라온 글이 없습니다. 첫 번째가 되어 보세요."}
    </p>
  );
}
