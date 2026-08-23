/**
 * 커뮤니티 첫 화면 — 큰 제목, 한 줄 설명, 검색칸.
 *
 * 검색은 주소로 한다. 폼을 GET 으로 보내면 `?q=계란찜` 이 붙은 주소가 되고,
 * 서버가 그 주소를 보고 걸러 그린다. 자바스크립트가 한 줄도 안 든다 —
 * 결과를 링크로 복사해 남에게 보낼 수도 있다.
 */

import { Icon } from "@/components/icons";
import { communityCopy } from "@/lib/site-content";

type Props = {
  /** 지금 적혀 있는 검색어. 찾고 나서도 칸에 남아 있어야 고쳐 칠 수 있다 */
  query: string;
};

// [F1][함수] CommunityHero({query}): 커뮤니티 맨 위의 제목과 검색칸
// 입력: query(주소의 ?q= 를 서버가 정리해 넘긴 값) → 처리: 검색칸에 미리 채움
// 출력: 화면(JSX). 폼을 보내면 /community?q=… 로 다시 들어온다(GET)
export function CommunityHero({ query }: Props) {
  return (
    <div className="cm-hero">
      {/* 이 화면에서 가장 큰 제목. 시안이 영어라 그대로 둔다 */}
      <h1 className="cm-title">{communityCopy.title}</h1>

      {/* 제목 아래 한 줄. 이 화면이 무엇을 모아 둔 곳인지 못 박는다 */}
      <p className="cm-lead">{communityCopy.lead}</p>

      {/* role="search" 를 붙이면 읽어 주는 기계가 "검색 영역" 으로 건너뛸 수 있다 */}
      {/* action 을 비워 두면 지금 주소로 보낸다. ?tab= 이 그대로 남아 버려서,
          검색은 갈래와 상관없이 찾는다는 뜻이 어긋난다. 그래서 못 박아 둔다 */}
      <form className="cm-search" role="search" action="/community">
        {/* 이름표를 눈에는 안 보이게 숨긴다. 흐린 예시 글씨는 이름표를 대신하지 못한다 */}
        <label className="sr-only" htmlFor="cm-q">
          커뮤니티 검색
        </label>

        {/* 그림은 뜻을 옆 칸이 전하므로 읽어 주는 기계에는 숨긴다 */}
        <span className="cm-search-ico" aria-hidden="true">
          <Icon name="search" size={18} />
        </span>

        <input
          id="cm-q"
          // 서버가 이 이름으로 값을 꺼내게 된다. 붙일 때 이름을 다시 정하지 않아도 되게 미리 둔다
          name="q"
          className="cm-search-input"
          // search 로 두면 휴대폰 자판의 엔터가 "검색" 으로 바뀐다
          type="search"
          /* 찾고 나서도 친 글자가 칸에 남아야 한다. 비어 있으면 무엇으로
             찾았는지 잊어버리고 처음부터 다시 친다 */
          defaultValue={query}
          placeholder={communityCopy.searchPlaceholder}
          // 요리 이름에 맞춤법 검사가 붙으면 빨간 줄만 늘어난다
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
