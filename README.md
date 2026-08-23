# 쿡파일럿 CookPilot

손은 요리에, 레시피는 쿡파일럿에 — 말로 따라 하는 AI 요리 비서.

배포: <https://cookpilotv2.vercel.app>

## 다른 컴퓨터에서 시작하기

```bash
git clone https://github.com/Van-Sihan/CookPilot.v2.git
cd CookPilot.v2
npm install
```

여기에 **`.env.local` 하나만 더** 만들면 됩니다(아래). `npm run dev` 후
http://localhost:3000 을 열면 됩니다.

> 파일 말고도 챙길 것이 하나 있습니다. **Gemini API 키는 `.env.local` 이 아니라
> 브라우저에 저장됩니다.** 기계를 옮기면 사라지므로 `/start` 에서 다시 넣어야
> 요리·상담 기능이 돕니다. 옮길 파일이 아니라 다시 입력할 값입니다.

Claude Code 로 이어서 작업하실 때는 그냥 `claude` 를 실행하세요.
`claude -c` 는 **그 기계의 로컬 대화 기록**을 이어받는 명령이라 새 기계에서는
이어받을 대화가 없습니다. 대신 `CLAUDE.md`(→ `AGENTS.md`)와 `CHANGELOG.md` 가
저장소에 들어 있어서, 새 세션이 프로젝트 규칙과 지금까지의 작업 내역을
알아서 읽습니다. 대화가 아니라 저장소가 맥락을 들고 있습니다.

Node 20 이상이 필요합니다.

### 환경 변수

`.env.local` 은 깃에 올라가지 않으므로(`.gitignore` 의 `.env*`) **새 기계마다
직접 만들어야 합니다.** 프로젝트 최상단, `package.json` 옆에 두세요.
필요한 변수와 설명은 **`.env.example`** 에 정리해 두었습니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
PINECONE_API_KEY=pcsk_...
PINECONE_HOST=https://xxxxx.svc.xxxxx.pinecone.io
```

| 변수 | 없으면 | 어디서 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 로그인·커뮤니티가 안 됨 | 수파베이스 대시보드 **[Connect]** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 〃 | 〃 (`ANON_KEY` 로 나와도 호환) |
| `PINECONE_API_KEY` | `/ask` AI 상담이 안 됨 | 파인콘 콘솔 |
| `PINECONE_HOST` | 〃 | 파인콘 콘솔의 인덱스 Host |

이 파일이 없어도 소개 페이지와 `/start` 는 그대로 돕니다.

**Gemini API 키는 여기 넣지 않습니다.** 브라우저에 담기는 값이라
`/start` 화면에서 직접 넣습니다. 기계를 옮기면 다시 넣어야 합니다.

새 수파베이스 프로젝트를 쓴다면 `Authentication → Sign In / Providers` 에서
`Confirm Email` 을 **꺼 두면** 가입 테스트가 편합니다.
운영 프로젝트에는 켜 두었습니다.

## 구조

| 경로 | 내용 |
|---|---|
| `app/page.tsx` | 홈페이지. 구역들을 위에서 아래로 조립하는 진입점 |
| `app/layout.tsx` | 글꼴, 메타데이터, `lang="ko"` |
| `app/globals.css` | 디자인 시스템 전체 — 숯불 팔레트, 여백, 반응형 분기 |
| `app/actions/auth.ts` | 로그인·가입·로그아웃 서버 액션 |
| `components/` | 구역별 마크업 (히어로·기능·쇼케이스·요금제·FAQ·꼬리말) |
| `lib/domain/`, `lib/usecase/`, `lib/adapter/` | 규칙 → 흐름 → 바깥세상. `ARCHITECTURE.md` 참고 |
| `lib/site-content.ts` | 문구·요금·FAQ. **카피만 고칠 거면 이 파일만** |
| `proxy.ts` | 요청마다 로그인 표를 갱신. Next.js 16 에서 `middleware.ts` 의 새 이름 |
| `design/` | 원본 디자인 시안과 로고 |

색이나 여백은 `app/globals.css`, 글은 `lib/site-content.ts`, 배치는
`components/` 에 있습니다. 클래스 이름은 `design/index_dark_2.html` 시안과
같게 두었으니 시안에서 클래스를 찾아 `components/` 를 grep 하면 대응되는
위치가 바로 나옵니다.

## 문서

- **`CHANGELOG.md`** — 무엇이 언제 왜 바뀌었는지. 최신 항목이 위
- **`ERRORS.md`** — 막혔던 오류와 왜 그것이 문제였는지
- **`AGENTS.md`** — 에이전트용 프로젝트 규칙 (Next.js 주의사항, 변경 기록 규칙)
- **`docs/deploy/vercel.md`** — 버셀 배포 절차. 사람이 할 일과 이미 끝난 일 구분
- **`docs/flow/flow.md`** — 기능별 실행 흐름 FN01–FN13
- **`docs/flow/map.pdf`** — 계층(L)·데이터(D)·화면 여정(J)·시스템(S) 배치도
- **`docs/flow/phases.pdf`** — 사용자 흐름 · 기능/데이터 구조 · 인증/오류/독립 기능
- **`docs/spec/CookPilot_기능명세서_HIPO.xlsx`** — 기능명세서 · 체크리스트 · HIPO

## 만들 때 쓴 것

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4

글꼴은 `next/font` 로 셀프호스팅합니다 — 제목은 Instrument Serif(라틴)와
Noto Serif KR(한글), 숫자는 Roboto Mono. 본문 Pretendard 만 구글 글꼴에 없어
CDN 에서 받아 옵니다.

## 명령

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint
```
