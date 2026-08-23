/**
 * 유튜브에서 옮겨 온 레시피의 출처 카드.
 *
 * 다른 출처는 한 줄이면 끝난다("쿡파일럿이 만든 기본 레시피입니다").
 * 유튜브만 카드로 크게 두는 까닭이 둘이다.
 *
 *   · **남의 것이다.** 원작자를 작은 글씨로 흘려 두면 옮겨 온 티가 안 난다.
 *   · **사람이 확인해야 한다.** 주소를 붙여넣고 20초를 기다린 사람이 가장 먼저
 *     보고 싶은 것은 "내가 넣은 그 영상이 맞나" 다. 그림과 제목이 있어야 알아본다.
 *
 * 미리보기 그림은 따로 다녀와서 받아 오는 것이 아니다. 주소에서 영상 번호만 뽑으면
 * 그림 주소가 규칙으로 정해진다 — 도메인의 youtubeThumb 이 그 일을 한다.
 */

import Image from "next/image";
import { Icon } from "@/components/icons";
import {
  youtubeThumb,
  YOUTUBE_THUMB_H,
  YOUTUBE_THUMB_W,
  type RecipeSource,
} from "@/lib/domain/recipe";
import { shopCopy } from "@/lib/cook-content";

/** 유튜브 출처만 받는다. 다른 갈래는 부르는 쪽에서 걸러 준다 */
type Props = {
  source: Extract<RecipeSource, { kind: "youtube" }>;
};

// [F1][함수] YoutubeSource({source}): 유튜브에서 옮겨 온 레시피의 출처 카드
// 입력: source(kind:'youtube' 인 RecipeSource) → 처리: 주소에서 미리보기 그림을 셈
// 출력: 화면(JSX) — 그림 + 영상 제목 + 채널 + 링크 + 다짐
export function YoutubeSource({ source }: Props) {
  // 주소가 이상하면 null 이 온다. 그때는 그림 자리를 아예 안 만든다
  // [F2][호출] source.url → youtubeThumb(domain/recipe:F30) → thumb (못 뽑으면 null)
  const thumb = youtubeThumb(source.url);

  return (
    <div className="yt-src">
      {/* 무엇을 보고 옮겼는지부터 말한다 */}
      <p className="yt-src-eyebrow">
        <span className="yt-src-mark" aria-hidden="true">
          <Icon name="play" size={13} />
        </span>
        {shopCopy.youtubeFrom}
      </p>

      {/* 그림째로 누르면 영상이 열린다. 새 창으로 여는 까닭은 요리 중이기 때문이다 —
          같은 창에서 열면 장바구니에 체크해 둔 것이 사라진다 */}
      <a
        className="yt-src-link"
        href={source.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        {/* [F3][분기] thumb 이 있나? [true] 그림 자리를 만든다 / [false] 아예 안 만든다 */}
        {thumb && (
          <span className="yt-src-shot">
            <Image
              src={thumb}
              /* 제목이 바로 아래에 적혀 있어서 그림 설명을 또 읽어 줄 필요가 없다 */
              alt=""
              width={YOUTUBE_THUMB_W}
              height={YOUTUBE_THUMB_H}
              /* 옆 기둥 폭에 맞춰 줄어든다. 실제 파일은 320px 짜리 하나뿐이다 */
              sizes="344px"
            />

            {/* 영상이라는 것을 알려 주는 세모. 그림 위에 얹는다 */}
            <span className="yt-src-play" aria-hidden="true">
              <Icon name="play" size={18} />
            </span>
          </span>
        )}

        {/* 영상 제목. 요리 이름과 다르다 — 원래 영상에 붙어 있던 제목 그대로다 */}
        <span className="yt-src-title">
          {source.videoTitle || shopCopy.youtubeNoTitle}
        </span>
      </a>

      {/* 올린 사람. 저작자 표시는 이 줄이 맡는다 */}
      <p className="yt-src-chef">
        <span className="yt-src-chef-l">{shopCopy.youtubeChannel}</span>
        {source.channel}
      </p>

      {/* 영상으로 가는 길을 글자로도 둔다. 그림을 못 받았을 때 여기밖에 안 남는다 */}
      <a
        className="yt-src-go"
        href={source.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        {shopCopy.youtubeOpen} ↗
      </a>

      {/* 우리가 만든 것이 아니라는 다짐. 작게 두되 빼지는 않는다 */}
      <p className="yt-src-mind">{shopCopy.youtubeMind}</p>
    </div>
  );
}
