# 아키텍처 안내

이 문서는 지금 저장소에 **실제로 들어 있는** 파일과 그 역할을 적은 것입니다.
무엇이 언제 바뀌었는지는 `CHANGELOG.md`, 막혔던 오류와 그 까닭은 `ERRORS.md`,
처음 실행하는 법은 `README.md` 에 있습니다.

작성 기준: 2026-09-09.

---

## 1. 한 줄 요약

**음성으로 요리를 따라 하게 하는 Next.js 앱**입니다. 화면 17장, API 라우트 3개,
서버 액션 4개, Supabase 표 다섯 갈래로 이루어져 있습니다.

세 가지 바깥 서비스에 붙어 있습니다.

- **Gemini** — 레시피를 만들고(REST), 요리 중에 말을 주고받습니다(Live API,
  WebSocket). 키는 서버가 아니라 **방문자 브라우저**에 있습니다
- **Supabase** — 로그인·게시글·댓글·좋아요·프로필·상담 기록. RLS 정책까지 SQL 로 관리합니다
- **Pinecone + LangChain** — 요리 후기를 벡터로 찾아 근거로 삼는 상담(RAG)

가장 특징적인 부분은 **키를 서버에 두지 않는 구조**입니다. 방문자가 `/start` 에서
자기 Gemini 키를 넣으면 브라우저에만 담기고, 거기서 구글로 바로 나갑니다.
서버를 거치는 것은 `/ask` 하나뿐인데, Pinecone 키가 서버 것이라 체인을 서버에서
돌려야 하기 때문입니다. 그 경우에도 키는 그 요청 안에서만 쓰이고 저장하지 않습니다.

## 2. 관심사를 나눈 세 축

무엇을 고칠지 정할 때 이 표에서 출발하면 됩니다.

| 고치고 싶은 것 | 가야 할 곳 |
|---|---|
| **글** — 문구, 요금, FAQ, 화면 안내 | `lib/*-content.ts` (8개 파일) |
| **배치** — 마크업, 무엇이 어떤 순서로 | `components/**/*.tsx` |
| **모양** — 색, 여백, 글꼴, 반응형 | `app/globals.css` 한 파일 |
| **규칙** — 무엇이 올바른가 | `lib/domain/` |
| **흐름** — 무슨 일이 어떤 차례로 벌어지는가 | `lib/usecase/` |
| **바깥** — 저장소, 외부 API, 브라우저 기능 | `lib/adapter/` |

컴포넌트는 자기 안에 글을 들고 있지 않고 `lib/` 의 카피 파일에서 가져다 씁니다.
스타일은 컴포넌트가 클래스 이름만 붙이고 실제 규칙은 전부 `globals.css` 안에
있습니다. 그래서 카피만 바꾸는 작업은 `.tsx` 를 열 필요가 없고, 색만 바꾸는
작업은 `.ts` 를 열 필요가 없습니다.

## 3. 계층과 의존 방향

```
   바깥                                                        안쪽
┌──────────────┐   ┌──────────────┐   ┌────────────┐   ┌────────────┐
│ app/         │ → │ lib/adapter/ │ → │ lib/usecase│ → │ lib/domain │
│ components/  │   │              │   │            │   │            │
│ proxy.ts     │   │    23개      │   │    12개    │   │    17개    │
└──────────────┘   └──────────────┘   └────────────┘   └────────────┘
  화면·라우트        Supabase·Gemini      흐름 조립       규칙·엔티티
  서버 액션          Pinecone·브라우저
```

지키는 규칙은 셋입니다.

1. **의존 방향은 항상 안쪽으로만.** `lib/domain/` 은 유스케이스를 모릅니다.
   `lib/usecase/` 는 React·Next.js·DB·`fetch` 를 모릅니다.
2. **바깥 것은 인터페이스로 뒤집는다.** 유스케이스가 저장소나 외부 API 를 쓸 때는
   그 계층에 인터페이스를 두고, 구현은 `lib/adapter/` 에 두어 주입합니다.
3. **컴포넌트는 얇게.** React 컴포넌트와 라우트 핸들러는 입력을 받아 유스케이스를
   부르고 결과를 그리는 일만 합니다. 비즈니스 규칙을 컴포넌트 안에 쓰지 않습니다.

## 4. 파일별 설명

### 4.1 `app/` — 라우트

화면 17장입니다.

| 경로 | 파일 | 줄 | 하는 일 |
|---|---|---|---|
| `/` | `page.tsx` | 55 | 소개. 구역 컴포넌트를 쌓기만 하는 조립 파일 |
| `/start` | `start/page.tsx` | 66 | Gemini 키 입력 |
| `/start/model` | `start/model/page.tsx` | 64 | 답변 속도(모델) 고르기 |
| `/pick` | `pick/page.tsx` | 54 | 요리 정하기 — 음성 · 유튜브 · 냉장고 |
| `/shop` | `shop/page.tsx` | 51 | 재료 확인과 장보기 |
| `/cook` | `cook/page.tsx` | 46 | **음성으로 요리 진행** |
| `/cook/done` | `cook/done/page.tsx` | 47 | 마무리 |
| `/shelf` | `shelf/page.tsx` | 55 | 저장한 레시피 서재 |
| `/ask` | `ask/page.tsx` | 65 | 후기 기반 AI 상담(RAG) |
| `/community` | `community/page.tsx` | 192 | 글 목록 · 검색 · 태그 |
| `/posts/[id]` | `posts/[id]/page.tsx` | 160 | 글 읽기 · 댓글 · 좋아요 |
| `/posts/[id]/edit` | `posts/[id]/edit/page.tsx` | 96 | 글 고치기 |
| `/write` | `write/page.tsx` | 75 | 글 쓰기 (로그인 필요) |
| `/account` | `account/page.tsx` | 98 | 프로필 (로그인 필요) |
| `/login` `/signup` | 각 `page.tsx` | 51 · 50 | 로그인 · 가입 |
| `/community2` | `community2/page.tsx` | 281 | **디자인 시안 재현 화면.** 서비스에서 링크하지 않습니다. 글꼴과 CSS(`community2.css`, 363줄)를 이 화면 안에서만 따로 씁니다 |

**API 라우트 3개**

| 경로 | 줄 | 하는 일 |
|---|---|---|
| `POST /api/chat` | 108 | 브라우저가 보낸 Gemini 키 + 질문으로 RAG 체인을 서버에서 돌린다. **실패도 200 + `reason` 코드**로 돌려준다 — 화면이 원인을 구분해 안내하게 하려고 |
| `GET /api/chat/[id]` | 28 | 저장된 상담 대화를 읽는다. 없는 대화도 빈 배열을 준다 (존재 여부를 흘리지 않으려고) |
| `POST · GET /api/kitchen/index` | 76 | `samples/reviews.csv` 를 Pinecone 에 색인한다. GET 은 색인 없이 몇 건 읽히는지만 본다 |

**서버 액션 4개** — `app/actions/`
`auth.ts`(148) 로그인·가입·로그아웃, `auth-state.ts`(58) 그 폼 상태,
`post.ts`(314) 글 쓰기·고치기·지우기, `post-state.ts`(62) 그 폼 상태.

**`app/layout.tsx`** (156줄)
- `next/font/google` 로 글꼴을 셀프호스팅합니다. 제목용 **Instrument Serif**(라틴),
  **Noto Serif KR**(한글, 자소 파일이 많아 `preload: false`), 숫자용 **Roboto Mono**.
- 본문 **Pretendard** 만 구글 글꼴에 없어 `<head>` 에서 jsdelivr CDN 을 직접
  `<link>` 합니다. 여기가 유일한 외부 글꼴 의존입니다.
- `viewport` — `themeColor: "#FBF7F1"`, `colorScheme: "light"`. **밝은 판 전용**입니다.
- 링크 미리보기(og) 주소는 `NEXT_PUBLIC_SITE_URL` → 버셀이 넣어 주는 운영 도메인 →
  `localhost:3000` 순으로 고릅니다.

**`app/globals.css`** (3,476줄)
저장소에서 가장 큰 파일이자 디자인의 본체입니다. 구성 순서는 이렇습니다.

1. `@import "tailwindcss"` — Tailwind v4. 유틸리티는 거의 쓰지 않고 손으로 쓴
   클래스가 대부분을 처리합니다.
2. `:root` **토큰** — 종이 팔레트. 값 옆에 명암비가 주석으로 적혀 있습니다.
   바탕 `--bg:#FBF7F1`(따뜻한 종이) · `--bg-2:#FFFFFF`(카드) · `--bg-3:#F2EBE0`(눌린 면),
   글자 `--paper:#221C18`(15.8:1) · `--paper-2`(7.2:1) · `--paper-3`(5.5:1),
   강조 `--fire-1:#C0431F`(단추 바탕 전용, 흰 글자로 5.2:1) ·
   `--fire-2:#A8371A`(글자용, 6.1:1) · `--fire-3:#8A5A00`(하이라이트).
   `--pad`(반응형 여백), `--maxw:1180px`.
3. `@theme inline` — 같은 토큰을 Tailwind 쪽에도 노출합니다.
4. 접근성 — `:focus-visible` 테두리, 탭하면 나오는 `.skip` 본문 바로가기, `.sr-only`.
5. 화면별 규칙 — 소개 · 시작 · 고르기 · 장보기 · 요리 · 서재 · 상담 · 커뮤니티 · 글.
6. `@keyframes` 와 `prefers-reduced-motion` — 움직임을 끌 수 있게 합니다.

### 4.2 `components/` — 화면별 마크업

폴더 14개와 공통 컴포넌트 9개입니다.

| 폴더 | 개수 | 폴더 | 개수 |
|---|---|---|---|
| `community/` | 7 | `post/` | 7 |
| `pick/` | 5 | `cook/` | 4 |
| `shop/` `write/` | 각 3 | `login/` `start/` | 각 2 |
| `ask/` `auth/` `setup/` `shelf/` `signup/` | 각 1 | (루트 공통) | 9 |

### 4.3 `lib/` — 규칙과 글

**`lib/domain/` (17개)** — 순수 규칙. 바깥을 모릅니다.
`api-key` · `credentials` · `recipe` · `recipe-shelf` · `cook-progress` · `shopping` ·
`measure` · `post` · `post-draft` · `review` · `ask` · `community-tab` ·
`display-name` · `avatar` · `voice-tone` · `gemini-model` · `recipe-to-post`

**`lib/usecase/` (12개)** — 흐름 조립. React·DB·`fetch` 를 모릅니다.
`enter-with-api-key` · `choose-cook-setup` · `plan-recipe` · `cook-along` ·
`keep-recipe-shelf` · `ask-kitchen` · `sign-in` · `sign-up` · `rename-me` ·
`write-post` · `discuss-post` · `react-to-post`

**`lib/adapter/` (23개)** — 바깥세상. 세 갈래로 나뉩니다.

| 갈래 | 파일 |
|---|---|
| 브라우저 | `browser-api-key-store` · `browser-audio` · `browser-speech` · `browser-cook-setup-store` · `browser-recipe-draft-store` · `browser-recipe-shelf-store` · `browser-comment-store` · `browser-chat-id-store` · `browser-avatar-upload` · `browser-cover-upload` |
| Supabase | `supabase-server-client` · `supabase-auth-gateway` · `supabase-post-gateway` · `supabase-post-reader` · `supabase-comment-gateway` · `supabase-reaction-gateway` · `supabase-profile-gateway` · `supabase-chat-log` · `pending-auth-gateway` |
| AI · 데이터 | `gemini-recipe-gateway`(REST) · `gemini-live-gateway`(WebSocket) · `langchain-rag`(Pinecone) · `csv-reviews` |

**`lib/` 루트 (8개)** — 화면에 나갈 글만 모은 파일입니다.
`site-content` · `ask-content` · `cook-content` · `shelf-content` ·
`post-content` · `post-copy` · `write-content` · `recipe-card`

### 4.4 `supabase/` — 표와 정책

마이그레이션 5개(합계 약 1,070줄)를 **파일 이름 순서대로** 한 번씩 실행합니다.

| 파일 | 만드는 것 |
|---|---|
| `..._create_profiles.sql` | 프로필 |
| `..._create_posts.sql` | 게시글 |
| `..._create_reviews_and_chats.sql` | 후기 · 상담 기록 (`chat_messages` 함수 포함) |
| `..._post_images_and_covers.sql` | 글 이미지 · 표지, 스토리지 버킷 `post-covers` |
| `..._likes_bookmarks_comments_avatars.sql` | 좋아요 · 즐겨찾기 · 댓글, 버킷 `avatars` |

표·RLS 정책·트리거·함수에 더해 **스토리지 버킷까지 SQL 이 만듭니다.**
시드는 `seed.sql`(예시 글)과 `seed.reviews.sql`(후기)입니다.

### 4.5 `proxy.ts` — 세션 갱신

Next.js 16 에서 **`middleware.ts` 의 새 이름**입니다. 요청마다
`supabase.auth.getUser()` 를 한 번 불러 세션 쿠키를 갱신합니다.

이 파일이 필요한 이유가 분명합니다. **렌더 도중에는 쿠키를 심을 수 없어**
(`supabase-server-client.ts` 의 빈 `catch` 가 그 자리입니다) 갱신할 수 있는 자리가
여기뿐입니다. 없으면 한 시간쯤 뒤 세션이 만료되어 갑자기 로그아웃됩니다.
버셀에서는 Edge Middleware 로 자동 배포됩니다.

### 4.6 그 밖

| 경로 | 내용 |
|---|---|
| `public/audio/pcm-worklet.js` | **AudioWorklet 프로세서.** 마이크 입력을 오디오 스레드에서 PCM 으로 바꿉니다 |
| `public/food/` | 요리 사진. 위키미디어 공용에서 온 것이라 `CREDITS.md` 에 출처가 있습니다 |
| `samples/reviews.csv` | RAG 색인용 후기 101건 |
| `design/` | 원본 디자인 시안과 로고. 클래스 이름을 `index_dark_2.html` 시안과 같게 두어, 시안에서 클래스를 찾아 `components/` 를 grep 하면 대응되는 자리가 나옵니다 |
| `next.config.ts` | `images.remotePatterns` 에 `i.ytimg.com` 하나(유튜브 섬네일) |
| `tsconfig.json` | `strict: true`. 타입 오류를 무시하는 설정은 없습니다 |

### 4.7 문서

| 파일 | 내용 |
|---|---|
| `README.md` | 무엇을 하는 앱인지, 직접 돌리는 법, 배포하는 법 |
| `ARCHITECTURE.md` | 이 문서 |
| `CHANGELOG.md` | 요청 / 한 일 / 건드린 파일 / 확인 / 남긴 것. 최신이 위 |
| `ERRORS.md` | 막혔던 오류 원문과 **왜 그것이 문제였는지** |
| `docs/flow/` | 기능별 실행 흐름 FN01–FN13, 배치도·단계도 PDF |
| `docs/spec/` | HIPO 기능명세서 xlsx |
| `docs/usecase/` | 유스케이스 다이어그램 |
| `docs/deploy/vercel.md` | 배포 절차와 점검 기록 |

`docs/*/_build/` 의 파이썬 스크립트가 위 PDF·xlsx·다이어그램을 실제로 만들어 낸
코드입니다.

## 5. 클린 아키텍처가 실제로 적용된 곳

규칙이 말뿐인지 확인하려면 이 세 갈래를 따라가면 됩니다.

**키를 넣고 들어가기**
`lib/domain/api-key.ts` 가 "올바른 키 꼴"을 정하고,
`lib/usecase/enter-with-api-key.ts` 가 검사→저장 흐름을 짜고,
`lib/adapter/browser-api-key-store.ts` 가 실제로 `localStorage` 에 씁니다.
유스케이스는 `localStorage` 라는 말을 모릅니다 — 저장소 인터페이스만 압니다.

**요리 진행**
`lib/domain/cook-progress.ts` 가 걸음 이동 규칙을 갖고,
`lib/usecase/cook-along.ts` 가 말과 걸음을 잇고,
`lib/adapter/gemini-live-gateway.ts` 와 `browser-audio.ts` 가 WebSocket 과
AudioWorklet 을 맡습니다.

**상담(RAG)**
`lib/domain/ask.ts` 와 `review.ts` 가 질문·후기의 규칙을,
`lib/usecase/ask-kitchen.ts` 가 흐름을,
`lib/adapter/langchain-rag.ts` 가 Pinecone·LangChain 을 맡습니다.
`app/api/chat/route.ts` 는 요청을 풀어 유스케이스를 부르고 결과를 돌려줄 뿐입니다.

## 6. 지금 없는 것

앞으로 채워 넣을 자리를 분명히 해 두기 위해 적습니다.

- **자동화 테스트가 없습니다.** 러너도 설치돼 있지 않습니다. 타입 검사(`strict`)와
  수동 점검으로 갈음하고 있습니다
- **`/api/kitchen/index` 에 인증이 없습니다.** 예시 후기 CSV 를 다시 올리기만 하는
  엔드포인트라 지금은 열어 두었지만, 남의 글이 들어오면 자물쇠를 달아야 합니다
- 즐겨찾기를 **모아 보는 화면**이 없습니다. 표와 정책은 있습니다
- 게시글 **태그가 하나뿐**입니다 (`posts.badge` 가 단일 칸)
- 로그인 뒤 원래 화면으로 돌아가지 않고 항상 `/start` 로 갑니다 (`?next=` 미사용)
- 비밀번호 재설정과 소셜 로그인이 없습니다 (이메일·비밀번호만)
- 상태 관리 라이브러리가 없습니다 (`useState` 와 `useActionState` 가 전부)
- 다국어 처리가 없습니다 (한국어 고정)

## 7. 실행

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (타입 오류가 있으면 여기서 멈춘다)
npm run start    # 빌드 결과 실행
npm run lint     # ESLint
```

환경 변수와 Supabase·Pinecone 준비 절차는 `README.md` 를 봅니다.
