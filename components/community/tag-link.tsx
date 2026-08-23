/**
 * 글에 붙은 카테고리 딱지 하나. 누르면 같은 태그가 붙은 글만 모아 본다.
 *
 * 전에는 그냥 글자였다. 카드마다 "한 그릇", "베이킹" 이 붙어 있는데 눌러도
 * 아무 일이 없어서, 분류라기보다 장식에 가까웠다. 옆 기둥의 "자주 찾는 태그"
 * 도 마찬가지로 `href="#"` 였다.
 *
 * 태그 전용 화면을 따로 만들지 않고 **검색으로 보낸다.** 검색이 이미
 * 제목·글쓴이·카테고리·설명을 함께 훑기 때문이다([[postsByQuery]]).
 * 화면을 하나 더 만들면 "태그로 찾기" 와 "검색" 이 서로 다른 결과를 내게 되고,
 * 그때부터 사람은 어느 쪽이 맞는지 알 수 없다.
 *
 * 움직이지 않아서 서버에서만 그려진다.
 */

import Link from "next/link";

type Props = {
  /** 태그 글자. 카드에 적힌 그대로다 */
  tag: string;
  /** 우물 정 자를 앞에 붙일지. 옆 기둥의 태그 목록에서만 붙인다 */
  hash?: boolean;
  /** 겉모습. 카드 딱지와 옆 기둥 태그가 서로 다르게 생겼다 */
  className?: string;
  /** 태그 글자 뒤에 붙일 것. 옆 기둥에서 "2.1k" 같은 숫자를 붙인다 */
  children?: React.ReactNode;
};

// [F1][함수] TagLink({tag, hash, className, children}): 카테고리 딱지를 태그 링크로 만든다
// 입력: tag(카드에 적힌 글자) → 처리: encodeURIComponent 로 주소에 실음
// 출력: /community?q=<태그> 로 가는 링크(JSX) — 검색과 같은 길로 보낸다
export function TagLink({ tag, hash, className, children }: Props) {
  return (
    <Link
      className={className ?? "cm-badge"}
      /* 검색칸에 그대로 친 것과 같은 주소가 된다.
         encodeURIComponent 를 쓰는 까닭 — 태그에 빈칸("한 그릇")이나
         우물 정 자가 들어가면 주소가 거기서 끊긴다 */
      href={`/community?q=${encodeURIComponent(tag)}`}
      // 그림이 아니라 글자라 따로 이름을 붙이지 않아도 되지만, 무엇이 일어날지는 알려 준다
      title={`#${tag} 글 모아 보기`}
    >
      <span className="cm-tag-label">{hash ? `#${tag}` : tag}</span>
      {children}
    </Link>
  );
}
