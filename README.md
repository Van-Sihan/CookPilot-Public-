# 쿡파일럿 CookPilot

손은 요리에, 레시피는 쿡파일럿에 — 말로 따라 하는 AI 요리 비서.

## 다른 컴퓨터에서 시작하기

```bash
git clone https://github.com/Van-Sihan/CookPilot.v2.git
cd CookPilot.v2
npm install
```

이게 전부입니다. `npm run dev` 후 http://localhost:3000 을 열면 됩니다.

Claude Code 로 이어서 작업하실 때는 그냥 `claude` 를 실행하세요.
`claude -c` 는 **그 기계의 로컬 대화 기록**을 이어받는 명령이라 새 기계에서는
이어받을 대화가 없습니다. 대신 `CLAUDE.md`(→ `AGENTS.md`)와 `CHANGELOG.md` 가
저장소에 들어 있어서, 새 세션이 프로젝트 규칙과 지금까지의 작업 내역을
알아서 읽습니다. 대화가 아니라 저장소가 맥락을 들고 있습니다.

Node 20 이상이 필요합니다.

### 환경 변수

로그인·회원가입이 수파베이스에 붙어 있어서 열쇠가 필요합니다. `.env.local` 은
깃에 올라가지 않으므로(`.gitignore` 의 `.env*`) **새 기계마다 직접 만들어야
합니다.** 프로젝트 최상단, `package.json` 옆에 두세요.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

두 값은 수파베이스 대시보드 맨 위 **[Connect]** 에서 복사합니다. 열쇠 이름이
`ANON_KEY` 로 나올 때도 있는데 둘은 호환되고, 코드가 양쪽 다 받아 줍니다.

이 파일이 없어도 소개 페이지와 `/start` 는 그대로 돕니다. 로그인만 안 됩니다.

새 수파베이스 프로젝트를 쓴다면 `Authentication → Sign In / Providers` 에서
**`Confirm Email` 을 꺼 두세요.** 켜져 있으면 가입할 때마다 메일함을 열어
링크를 눌러야 합니다. (실제 배포 때는 다시 켜야 합니다.)

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
- **`AGENTS.md`** — 에이전트용 프로젝트 규칙 (Next.js 주의사항, 변경 기록 규칙)

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
