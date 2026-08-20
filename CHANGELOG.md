# 변경 기록

작업을 요청받아 코드를 고칠 때마다 여기에 한 항목씩 쌓습니다.
최신 항목이 위로 옵니다.

각 항목은 이렇게 적습니다.

- **요청** — 무엇을 해 달라고 했는지
- **한 일** — 실제로 바뀐 것
- **건드린 파일** — 새로 만듦 / 고침 / 지움
- **확인** — 어떻게 검증했는지
- **남긴 것** — 일부러 안 한 부분, 다음에 이어서 할 일

---

## 2026-08-21 — README 를 프로젝트 문서로 교체

**요청**
다른 기계에서 시작할 때 필요한 git 세 줄을 저장소가 알려주게 할 것.

**한 일**
create-next-app 기본 README (없어진 Geist 글꼴을 안내하고 있었음) 를 지우고
프로젝트 문서로 새로 썼습니다. 맨 위에 clone → cd → npm install 세 줄을 두고,
새 기계에서는 `claude -c` 가 아니라 `claude` 로 시작해야 하는 이유
(대화 기록은 저장소가 아니라 `~/.claude/projects/` 에 로컬로 쌓임) 를 적었습니다.
그 아래에 폴더 구조, 문서 안내, 명령 목록.

**건드린 파일**
- `README.md` — 전면 교체

**확인**
`.gitignore` 로 `node_modules`·`.next`·`next-env.d.ts` 가 빠지는 것,
`process.env` 사용처가 없어 `.env` 가 필요 없는 것 확인 후 문서에 반영.

---

## 2026-08-21 — FAQ 항목 하나 내림

**요청**
직접 수정 (사용자가 편집기에서 고침).

**한 일**
"제 목소리가 저장되나요?" 문답을 주석 처리해 화면에서 뺐습니다.
지우지 않고 주석으로 남겼으니 되살리기 쉽습니다. 자주 묻는 질문이 6개 → 5개.

**건드린 파일**
- `lib/site-content.ts` — `faqs` 배열

**확인**
렌더된 HTML 에서 `<details>` 5개, "제 목소리가" 문구 사라진 것 확인.

---

## 2026-08-21 — 디자인 시안을 홈페이지로 구현

**요청**
`design/index_dark_2.html` 와 `design/logo.svg` 를 바탕으로 홈페이지 구성.

**한 일**

정적 HTML 한 장을 Next.js 16 App Router 구조로 옮겼습니다. 시안의 색·여백·반응형
분기는 값 그대로 유지했고, 마크업만 구역별 컴포넌트로 쪼갰습니다.

- 시안의 `<style>` 블록을 `app/globals.css` 로 이식 (숯불 팔레트, 잉걸불 후광,
  양끝이 사라지는 구분선, 반응형 분기 전부 원본 값)
- Tailwind v4 는 남겨 두고 `@theme inline` 으로 팔레트·글꼴을 유틸리티에 연결
- 시안에 박혀 있던 문구·요금·FAQ 를 `lib/site-content.ts` 한 곳으로 분리
- 글꼴은 `next/font/google` 로 셀프호스팅 (Instrument Serif / Noto Serif KR /
  Roboto Mono). 한글 파일은 수가 많아 `preload: false`. Pretendard 만 CDN
- 로고를 `app/icon.svg` · `app/apple-icon.png` 로 넣고 create-next-app 기본
  `favicon.ico` 삭제
- 시안에서 동작하지 않던 햄버거 버튼을 실제 서랍 메뉴로 구현
  (Esc 로 닫기, 링크 누르면 자동 닫힘, `aria-expanded`, 열리면 X 자로 변형)
- 본문 바로가기 링크와 `:focus-visible` 테두리 추가
- 장바구니 삽화의 "3개만 사면 됩니다" 를 데이터에서 자동 계산

**건드린 파일**

새로 만듦
- `lib/site-content.ts` — 문구·요금·FAQ·기능 목록
- `components/brand.tsx` — 로고, 파형 (그라데이션 id 를 prop 으로 받음)
- `components/icons.tsx` — 기능 칸 선 아이콘 6종
- `components/site-header.tsx` — 머리말 + 모바일 서랍 (유일한 클라이언트 컴포넌트)
- `components/hero.tsx` — 첫 화면
- `components/features.tsx` — 큰 문장 + 기능 6칸
- `components/showcase.tsx` — 좌우로 번갈아 놓인 3덩어리와 삽화 3종
- `components/pricing.tsx` — 요금제 3장
- `components/faq.tsx` — 자주 묻는 질문
- `components/closing.tsx` — 마무리 권유 + 꼬리말
- `app/icon.svg`, `app/apple-icon.png` — 로고

고침
- `app/page.tsx` — 구역 조립
- `app/layout.tsx` — 글꼴, 메타데이터, `lang="ko"`, `themeColor`
- `app/globals.css` — 디자인 시스템 전체

지움
- `app/favicon.ico` — create-next-app 기본 아이콘

**확인**
`tsc --noEmit` · `next build` · `eslint` 통과. 렌더된 HTML 에서 기능 6칸 /
요금제 3장 / FAQ 6개 / 쇼케이스 3덩어리 / 글꼴 변수 3종 확인.

브라우저 스크린샷은 못 찍었습니다. 연결된 Chrome 이 개발 머신이 아닌 다른
기기라 그쪽 `localhost:3000` 의 다른 프로젝트 페이지가 떴습니다.

**남긴 것**
- 로그인·이용약관 등 링크는 시안과 같은 `href="#"` 자리표시자.
  주요 CTA 만 `#pricing` 으로 연결
- OG 이미지 파일 없음 (필요하면 `app/opengraph-image` 로 추가)
- `public/` 의 create-next-app 기본 SVG 는 손대지 않음
