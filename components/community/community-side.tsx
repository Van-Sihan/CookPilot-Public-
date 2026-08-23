/**
 * 왼쪽 기둥 — 탭, 이번 주 인기 셰프, 자주 찾는 태그.
 *
 * 탭이 단추가 아니라 **링크**인 것이 중요하다. 그래서 이 파일에 "use client" 가 없다.
 * 탭을 누르면 `?tab=recent` 같은 주소로 넘어가고 서버가 그 탭의 글을 골라 그린다.
 * 이렇게 두면 얻는 것이 셋이다 —
 *   1. 지금 보고 있는 탭 그대로 링크를 복사해 남에게 줄 수 있다
 *   2. 뒤로 가기가 탭 단위로 동작한다
 *   3. 자바스크립트를 기다리지 않아도 눌린다
 * 단추로 만들었다면 셋 다 직접 짜 넣어야 했을 것이다.
 */

import Link from "next/link";
import { Icon } from "@/components/icons";
import { TagLink } from "@/components/community/tag-link";
import {
  COMMUNITY_TABS,
  DEFAULT_TAB,
  type CommunityTab,
} from "@/lib/domain/community-tab";
import {
  communityCopy,
  communityTabLabels,
  popularTags,
  rankedChefs,
} from "@/lib/site-content";

// [F1][함수] CommunitySide({now}): 커뮤니티 왼쪽 기둥(탭·인기 셰프·자주 찾는 태그)
// 입력: now(지금 탭, 서버가 resolveTab 으로 정해 넘긴 값) → 출력: 화면(JSX)
// 탭이 단추가 아니라 링크라 브라우저에서 할 일이 없다 — 서버에서만 그려진다
export function CommunitySide({ now }: { now: CommunityTab }) {
  return (
    <aside className="cm-side">
      {/* --- 탭 --- */}
      <nav aria-label="커뮤니티 분류">
        <p className="cm-side-head">{communityCopy.tabsLabel}</p>

        <ul className="cm-tabs">
          {/* 차례는 도메인이 정한 순서를 그대로 따른다 */}
          {/* [F2][반복] COMMUNITY_TABS 를 훑어 탭 링크를 그린다. tab === now 면 불이 들어온다 */}
          {COMMUNITY_TABS.map((tab) => {
            // 지금 서 있는 탭인지. 색과 왼쪽 띠가 이 값 하나로 갈린다
            const on = tab === now;

            return (
              <li key={tab}>
                <Link
                  className={on ? "cm-tab on" : "cm-tab"}
                  /* 기본 탭은 주소를 깨끗하게 둔다. `?tab=popular` 를 늘 달고 다니면
                     같은 화면에 주소가 둘이 되어 링크를 나눠 줄 때 헷갈린다 */
                  href={tab === DEFAULT_TAB ? "/community" : `/community?tab=${tab}`}
                  /* 색만으로 지금 자리를 알리면 색을 못 보는 사람이 놓친다.
                     읽어 주는 기계에도 "여기가 지금 페이지" 라고 말해 준다 */
                  aria-current={on ? "page" : undefined}
                >
                  <span>{communityTabLabels[tab]}</span>

                  {/* 인기 탭에만 붙는 기세 표시. 시안의 ↗ 자리다 */}
                  {tab === "popular" && (
                    <span className="cm-tab-ico" aria-hidden="true">
                      <Icon name="trend" size={15} />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* --- 이번 주 인기 셰프 --- */}
      <section className="cm-block">
        <p className="cm-side-head">{communityCopy.rankLabel}</p>

        {/* 순서가 곧 등수라 번호 매기는 목록을 쓴다.
            눈에 보이는 숫자만 있고 목록은 그냥 ul 이면, 읽어 주는 기계는 순위인 줄 모른다 */}
        <ol className="cm-rank">
          {/* [F3][반복] rankedChefs 를 훑어 이번 주 인기 셰프를 그린다 */}
          {rankedChefs.map((chef, i) => (
            <li key={chef.name}>
              {/* 등수는 배열 차례에서 뽑는다. 데이터에 적어 두면 순서만 바꿨을 때 어긋난다 */}
              <span className="cm-rank-n">{i + 1}</span>

              <span className="cm-rank-who">
                <span className="cm-rank-name">{chef.name}</span>
                <span className="cm-rank-note">{chef.note}</span>
              </span>

              <span className="cm-rank-hearts">{chef.hearts}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* --- 자주 찾는 태그 --- */}
      <section className="cm-block">
        {/* 머리글 셋이 같은 세로선에서 시작하도록 그림을 뺐다.
            여기에만 꼬리표 그림이 붙어 글자가 혼자 안으로 밀려 있었다 */}
        <p className="cm-side-head">{communityCopy.tagLabel}</p>

        <ul className="cm-tags">
          {/* [F4][반복] popularTags 를 훑어 TagLink 로 그린다 → /community?q=<태그> */}
          {popularTags.map((t) => (
            <li key={t.label}>
              {/* 카드에 붙은 카테고리 딱지와 **같은 곳**으로 간다.
                  태그 전용 화면을 따로 두면 두 길의 결과가 어긋난다 */}
              <TagLink tag={t.label} hash className="">
                <span className="cm-tag-count">{t.count}</span>
              </TagLink>
            </li>
          ))}
        </ul>
      </section>

      {/* --- 지금 몇 사람이 요리 중인지 --- */}
      <p className="cm-live">
        {/* 깜빡이는 점. 뜻은 옆 글자가 다 전한다 */}
        <span className="cm-live-dot" aria-hidden="true" />
        {communityCopy.liveCount}
      </p>
    </aside>
  );
}
