/**
 * 글 한 편의 윗부분 — 큰 사진, 제목, 쓴 사람, 본문.
 *
 * "use client" 가 없다. 여기 있는 것은 전부 서버에서 한 번 그려지고 끝나는 글자다.
 * 브라우저가 할 일은 댓글 칸([[post-talk]])과 요리 단추([[cook-this]])뿐이라
 * 그 둘만 따로 떼어 두었다.
 */

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { TagLink } from "@/components/community/tag-link";
import { photoPath, type PostDetail } from "@/lib/domain/post";
import { postCopy } from "@/lib/post-copy";
import type { CommunityPost } from "@/lib/site-content";

type Props = {
  /** 목록에서 쓰던 값. 제목·좋아요·딱지가 여기 있다 */
  card: CommunityPost;
  /** 열고 들어와야 보이는 값. 본문과 사진 출처가 여기 있다 */
  detail: PostDetail;
};

// [F1][함수] PostArticle({card, detail}): 예시 글 한 편의 본문을 그린다
// 입력: card(목록에서 쓰던 값) + detail(열어야 보이는 속) → 출력: 화면(JSX)
// 사진 아래에 찍은 사람과 허락(CC)을 반드시 함께 적는다
export function PostArticle({ card, detail }: Props) {
  return (
    <article className="pd">
      {/* 목록으로 돌아가는 길. 맨 위에 둬야 뒤로 가기를 모르는 사람도 나갈 수 있다 */}
      <Link className="pd-back" href="/community">
        {postCopy.back}
      </Link>

      {/* 큰 사진. 세로가 긴 사진도 있어서 틀을 고정하고 잘라 넣는다 */}
      <figure className="pd-shot">
        <Image
          className="pd-img"
          src={photoPath(detail.id)}
          alt={detail.alt}
          /* 틀에 꽉 채운다. 사진마다 가로세로가 달라서 숫자를 못 박을 수 없다 */
          fill
          /* 화면 폭에 따라 실제로 몇 픽셀이 필요한지 알려 준다.
             안 적으면 넓은 화면 기준으로 큰 파일을 늘 받아 온다 */
          sizes="(max-width: 900px) 100vw, 860px"
          /* 이 화면에서 가장 먼저 보이는 그림이다. 늦게 받아 오면 빈 칸부터 보인다 */
          priority
        />
      </figure>

      {/* 찍은 사람과 허락. 남의 사진을 쓰는 이상 빼면 안 되는 줄이다 */}
      <p className="pd-credit">
        {postCopy.photoBy} ·{" "}
        <a href={detail.credit.page} target="_blank" rel="noreferrer noopener">
          {detail.credit.by}
        </a>{" "}
        {/* 퍼블릭 도메인처럼 허락문 주소가 없는 것도 있어서 있을 때만 링크로 만든다 */}
        {detail.credit.licenseUrl ? (
          <a
            href={detail.credit.licenseUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {detail.credit.license}
          </a>
        ) : (
          <span>{detail.credit.license}</span>
        )}
      </p>

      {/* 딱지와 걸리는 시간. 목록 카드에 있던 것을 그대로 가져온다 */}
      <div className="pd-meta">
        <TagLink tag={card.badge} />
        {card.minutes && <span className="cm-min">{card.minutes}분</span>}
        <span className="pd-date">{detail.published}</span>
      </div>

      {/* 이 화면에서 가장 큰 글자. 한 화면에 h1 은 하나여야 한다 */}
      <h1 className="pd-title">{card.title}</h1>

      {/* 쓴 사람과 좋아요를 한 줄에 마주 보게 놓는다 */}
      <div className="pd-by">
        <span className="pd-chef">
          {/* 사진이 없으니 이름 첫 글자를 딴 동그란 표시로 대신한다 */}
          <span className="pd-chef-mark" aria-hidden="true">
            {card.chef.slice(0, 1)}
          </span>
          {card.chef}
        </span>

        <span className="pd-hearts">
          <Icon name="heart" size={16} />
          {card.hearts}
          {/* 숫자만 있으면 무슨 숫자인지 모른다. 눈에는 안 보이게 뜻을 붙인다 */}
          <span className="sr-only">개의 좋아요</span>
        </span>
      </div>

      {/* 제목 바로 밑 몇 줄. 본문보다 크게 둬서 무슨 글인지 먼저 잡히게 한다 */}
      <p className="pd-intro">{detail.intro}</p>

      {/* 소제목이 붙은 본문. 문단은 글자 그대로 나가므로 HTML 을 섞지 않는다 */}
      {/* [F2][반복] sections 를 훑어 소제목과 문단을 그린다 */}
      {detail.sections.map((s) => (
        <section className="pd-sec" key={s.heading}>
          <h2 className="pd-h2">{s.heading}</h2>

          {s.paragraphs.map((p) => (
            <p className="pd-p" key={p}>
              {p}
            </p>
          ))}
        </section>
      ))}

      {/* 꼬리표. 아직 누를 곳이 없어서 링크가 아니라 표시로만 둔다 */}
      <ul className="pd-tags">
        {/* [F3][반복] tags 를 훑어 꼬리표를 그린다 */}
        {detail.tags.map((t) => (
          <li className="pd-tag" key={t}>
            <Icon name="tag" size={13} />
            {t}
          </li>
        ))}
      </ul>
    </article>
  );
}
