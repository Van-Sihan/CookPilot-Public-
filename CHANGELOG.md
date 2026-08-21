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

## 2026-08-21 — 로그인 페이지 추가

**요청**
`design/login.png` 을 바탕으로 로그인 페이지를 만들고, 랜딩페이지에서
로그인 화면으로 넘어가게 해 달라.

**한 일**
`/login` 라우트를 새로 만들고, 소개 페이지의 시작 단추를 전부 그쪽으로 돌렸습니다.

물어보고 정한 것 세 가지:

- **모든 시작 단추가 로그인으로 갑니다.** 랜딩 → 로그인 → `/start`(키 입력) 순서가
  됐습니다. 머리말 로그인·머리말 시작 단추·서랍 안 둘·첫 화면 단추·마지막 구역
  단추·"맛보기" 요금제 단추까지 일곱 자리입니다.
- **검증까지만 합니다.** 이 저장소에는 서버가 없어서 실제로 로그인시킬 수단이
  없습니다. 가짜로 성공 처리하지 않고, 검사를 통과하면 "아직 준비 중" 이라고
  밝힙니다. `/start` 의 "고르기 (준비 중)" 와 같은 태도입니다.
- **Google·Apple 단추는 뺐습니다.** 시안에는 있었지만 붙일 계획이 정해지지
  않아 화면에서 아예 뺐습니다. "또는" 구분선도 같이 뺐습니다.

계층을 나눠 넣었습니다.

- `lib/domain/credentials.ts` — "받아 줄 만한 이메일·비밀번호인가" 만 압니다.
  이메일은 **골뱅이가 있고 앞뒤가 비지 않았는지만** 봅니다. 더 촘촘한 규칙을
  세우면 실제로 쓰이는 주소가 막히기 때문입니다. 비밀번호는 길이도 글자 구성도
  보지 않습니다 — 그 규칙은 가입할 때 정해지는 것이고, 여기서 막으면 예전에
  짧게 만든 사람이 못 들어옵니다. `api-key.ts` 와 같은 도장(브랜드 타입) 방식이라
  검사를 건너뛴 값은 유스케이스로 흘러들 수 없습니다.
- `lib/usecase/sign-in.ts` — `AuthGateway` 를 **약속으로만** 적어 두고 순서만
  정합니다. 검사에서 걸리면 서버에 물어보지도 않습니다.
- `lib/adapter/pending-auth-gateway.ts` — 그 약속을 지키되 늘 "아직 없다" 고
  답합니다. 서버가 생기면 **이 파일 하나만** 갈아 끼우면 됩니다.
- `components/login/login-form.tsx` — 이 페이지의 유일한 클라이언트 컴포넌트.
  검사도 로그인도 하지 않고 유스케이스만 부릅니다.
- `components/login/login-chrome.tsx` — 맨 윗줄과 맨 아랫줄. 서버 컴포넌트입니다.

정한 것 몇 가지를 더 적어 둡니다.

- **비밀번호는 앞뒤 공백을 떼지 않습니다.** 이메일은 뗍니다. 빈칸으로 끝나는
  비밀번호를 쓰는 사람이 실제로 있어서, 떼면 맞는 비밀번호가 틀리게 됩니다.
- **"이메일 또는 비밀번호가 맞지 않습니다"** 로 뭉뚱그립니다. 어느 쪽이
  틀렸는지 알려 주면 남의 계정이 있는지 없는지 떠보는 데 쓰입니다.
- **`autoComplete` 를 켜 두었습니다.** 비밀번호 자동완성을 막으면 사람들이
  오히려 외우기 쉬운 비밀번호를 씁니다.
- **입력칸에 `name` 을 붙이지 않았습니다.** 자바스크립트가 붙기 전에 단추를
  누르면 폼이 그냥 보내지는데, `name` 이 있으면 **비밀번호가 주소창에 남습니다.**
- 카드 안에 "로그인 없이 바로 시작하기" 를 남겼습니다. 로그인이 아직 안 되는
  동안 이 화면에 온 사람이 갈 데가 없어지기 때문입니다.

색은 `--ember:#F0A492` 하나를 새로 넣었습니다. 시안의 로고와 제목이 주황이
아니라 살구빛입니다. 검정 위에서 약 9:1 이라 제목 글자로 써도 안전합니다.

**건드린 파일**
새로 만듦 — `app/login/page.tsx`, `components/login/login-form.tsx`,
`components/login/login-chrome.tsx`, `lib/domain/credentials.ts`,
`lib/usecase/sign-in.ts`, `lib/adapter/pending-auth-gateway.ts`
고침 — `app/globals.css`(`.login-*` 한 벌), `components/icons.tsx`(mail·lock·
arrow-right·user 넷 추가), `lib/site-content.ts`(로그인 문구·오류 문구·꼬리말
링크, "맛보기" 단추 주소), `components/site-header.tsx`, `components/hero.tsx`,
`components/closing.tsx`

**확인**
`npx tsc --noEmit` 통과, `npx next build` 통과 — `/login` 이 정적 페이지로
생성됩니다(모두 일곱 장). `npx eslint app components lib` 지적 없음.
도메인·유스케이스는 Node 로 직접 불러 갈래를 전부 확인했습니다 — 빈 이메일,
공백만 있는 이메일, 골뱅이 없음, 골뱅이 앞이 빔, 골뱅이 뒤가 빔, 빈 비밀번호,
정상값, 게이트웨이 예외(→ `unreachable`), 서버 거절(→ `rejected`).
이메일 앞뒤 공백이 떼어지고 비밀번호 공백은 보존되는 것도 확인했습니다.
화면은 브라우저에서 띄워 시안과 대조했습니다.

**남긴 것**
- **단추를 눌렀을 때의 화면 변화를 브라우저에서 눈으로 확인하지 못했습니다.**
  브라우저 자동화 도구가 클릭 뒤 계속 시간 초과가 나서 중단했습니다. 로직은
  위처럼 따로 확인했지만, 오류 문구가 실제로 화면에 뜨는 모습은 못 봤습니다.
  개발 서버를 띄워 직접 눌러 봐 주세요.
- 비밀번호 찾기(`#`)와 회원가입(`#`) 은 화면이 없어 자리만 잡아 두었습니다.
- 맨 윗줄 오른쪽 계정 표시는 누를 수 없는 그림입니다. 계정 화면이 없어서입니다.
- `ARCHITECTURE.md` 는 갱신하지 않았습니다. 로그인이 붙었으니 계층 그림과
  "지금 없는 것" 절이 낡았습니다. 따로 요청해 주시면 맞추겠습니다.

## 2026-08-21 — 아키텍처 그림을 Mermaid 로 교체

**요청**
로그인 페이지를 붙이기 전에, 지금까지 구현한 내용을 바탕으로 아키텍처를
Mermaid 로 그려 달라.

**한 일**
`ARCHITECTURE.md` 안의 ASCII 그림 세 개를 Mermaid 로 다시 그리고, 없던
그림 하나를 새로 넣었습니다.

1. **누가 누구를 import 하는가** (flowchart) — 라우트 → 폼 → 어댑터·유스케이스·
   도메인. 화살표마다 무엇을 가져다 쓰는지 라벨을 달았습니다. 안쪽 계층과
   바깥 계층을 색으로 갈라 두어 화살표가 전부 안쪽으로만 향하는 게 보입니다.
2. **화면 조립** (flowchart) — layout·page·components·site-content. Next.js 가
   감싸 주는 관계는 import 가 아니라서 점선으로 구분했습니다.
3. **계층 순서** (flowchart BT) — domain ← usecase ← adapter ← components.
4. **키를 넣었을 때 벌어지는 일** (sequenceDiagram, 새로 추가) — 사용자부터
   localStorage 까지. 빈 값·저장 실패·성공 세 갈래를 모두 그렸습니다.
   저장 완료가 화면에 닿는 길이 두 갈래(반환값 / `notify()` → `useSyncExternalStore`)
   라는 것도 여기서 드러납니다.

그림을 고치는 김에 문서에서 낡은 값도 맞췄습니다. 행별 주석 작업으로 모든
파일이 길어져서 파일별 줄 수 표가 전부 틀려 있었고(예: `api-key-form.tsx`
170 → 199), `site-content.ts` 표에 `apiKeyPlaceholder` 가 빠져 있었습니다.

**건드린 파일**
고침 — `ARCHITECTURE.md`

**확인**
Mermaid 블록 네 개가 모두 `flowchart`/`sequenceDiagram` 으로 열리는지 확인했습니다.
코드는 건드리지 않았습니다.

**남긴 것**
- 로그인 기능은 구현하지 않았습니다. 요청하신 대로 그림까지만 그렸고,
  다음 요청을 기다립니다.
- 그래서 그림에도 로그인 자리를 미리 그려 넣지 않았습니다. 이 문서는 "실제로
  들어 있는 것" 만 적기로 한 문서라, 아직 없는 것을 그리면 규칙이 깨집니다.
  앞으로 갈 자리는 지금도 5장에 글로 적혀 있습니다.
- `app/page.tsx`·`app/start/page.tsx` 의 구역 순서 그림은 ASCII 로 두었습니다.
  위에서 아래로 한 줄인 목록이라 Mermaid 로 바꿔도 나아지지 않습니다.

## 2026-08-21 — 주석을 쉬운 말로 다시 씀

**요청**
주석을 초등학생도 쉽게 읽을 수 있을 정도로 달아 달라.

**한 일**
바로 앞 작업에서 단 주석이 어른 개발자용 말투였습니다. 18개 파일의 주석을
전부 쉬운 말로 다시 썼습니다. 코드는 한 글자도 건드리지 않았습니다.

바꾼 방식은 이렇습니다.

- **어려운 낱말을 풀어 썼습니다.** 그라데이션 → "색 번짐", 파형 → "물결무늬",
  삽화 → "그림", 머리말/꼬리말 → "맨 윗부분/맨 아랫부분", 차림표 → "메뉴",
  좌표 → "모눈종이 위 자리", key → "이름표", 구독 → "알려 달라고 부탁하기".
- **"왜" 를 한 번 더 풀었습니다.** 예를 들어 `y={height - h}` 에는 "컴퓨터 그림은
  맨 위가 0 이다. 그래서 바닥에서 높이를 빼야 막대가 아래에 선다" 처럼,
  결과만이 아니라 그 앞의 사정까지 적었습니다.
- **문장을 짧게 끊었습니다.** 한 줄에 뜻 하나만 들어가게 했습니다.

계층 이름(도메인·유스케이스·어댑터)과 라이브러리 이름(React, localStorage)은
그대로 두었습니다. 이건 찾아볼 수 있어야 하는 이름이라 바꾸면 오히려 헷갈립니다.

**건드린 파일**
고침 — `app/layout.tsx`, `app/page.tsx`, `app/start/page.tsx`,
`components/brand.tsx`, `components/closing.tsx`, `components/faq.tsx`,
`components/features.tsx`, `components/hero.tsx`, `components/icons.tsx`,
`components/pricing.tsx`, `components/showcase.tsx`, `components/site-header.tsx`,
`components/start/api-key-form.tsx`, `components/start/start-head.tsx`,
`lib/adapter/browser-api-key-store.ts`, `lib/domain/api-key.ts`,
`lib/site-content.ts`, `lib/usecase/enter-with-api-key.ts`

**확인**
`npx tsc --noEmit` 통과, `npx next build` 통과 — 여섯 페이지 모두 그대로
생성됩니다. 주석만 바꿨으니 화면은 조금도 달라지지 않았습니다.

**남긴 것**
- `app/globals.css` 는 이번에도 손대지 않았습니다.
- 파일 맨 위의 계층 설명(도메인이 뭘 알고 뭘 모르는지) 같은 큰 덩어리 주석은
  쉬운 말로 풀되 내용은 줄이지 않았습니다. 짧게 줄이면 왜 그렇게 나눴는지가
  사라지기 때문입니다.

## 2026-08-21 — 모든 소스 파일에 행별 한국어 주석

**요청**
지금 있는 코드들에 행별로 다 주석을 달아 달라.

**한 일**
`app/`·`components/`·`lib/` 의 TypeScript·TSX 18개 파일 전부에 AGENTS.md 의
주석 규칙(줄 바로 위, 한국어, 무엇이 아니라 왜)을 적용했습니다.

- 화면 쪽(`app/`, `components/`)은 주석이 하나도 없어 거의 다시 썼습니다.
  JSX 요소마다 그 자리에 왜 그 태그·속성이 붙었는지를 적었습니다 — `aria-hidden`
  을 붙인 이유, `type="button"` 을 눌러 둔 이유, `key` 로 그 값을 고른 이유,
  줄바꿈을 그 자리에서 끊은 이유 같은 것들입니다.
- `lib/` 세 계층은 이미 주석이 붙어 있어 빠진 줄(이른 반환, 정리 함수, 저장소
  호출)만 채웠습니다.
- SVG 는 경로마다 무슨 도형인지 적었습니다(`icons.tsx`, `brand.tsx`).
- `lib/site-content.ts` 는 값이 대부분이라 타입의 각 필드에 그 값이 화면 어디에
  쓰이는지를 붙였습니다.

작업 중에 빌드가 깨져 있는 것을 발견해 함께 고쳤습니다. `api-key-form.tsx` 가
`apiKeyPlaceholder` 를 import 하는데 `site-content.ts` 에 그 export 가 없었습니다.
입력칸 예시 문구이므로 `site-content.ts` 에 추가했습니다.

**건드린 파일**
고침 — `app/layout.tsx`, `app/page.tsx`, `app/start/page.tsx`,
`components/brand.tsx`, `components/closing.tsx`, `components/faq.tsx`,
`components/features.tsx`, `components/hero.tsx`, `components/icons.tsx`,
`components/pricing.tsx`, `components/showcase.tsx`, `components/site-header.tsx`,
`components/start/api-key-form.tsx`, `components/start/start-head.tsx`,
`lib/adapter/browser-api-key-store.ts`, `lib/domain/api-key.ts`,
`lib/site-content.ts`, `lib/usecase/enter-with-api-key.ts`

**확인**
`npx tsc --noEmit` 통과. `npx next build` 통과 — 여섯 페이지 모두 정적으로
생성됩니다. 주석만 넣었으므로 화면에 나가는 결과는 그대로입니다.

**남긴 것**
- `app/globals.css` 는 손대지 않았습니다. 주석 규칙이 코드를 가리키고 CSS 는
  이미 구역별 주석이 붙어 있어, 행별로 다 달면 오히려 읽기 나빠집니다. 원하시면
  따로 해 드리겠습니다.
- `hero.tsx` 의 주석 처리된 "카드 등록 없이 바로" 문구와 `site-content.ts` 의
  주석 처리된 FAQ 항목은 그대로 두었습니다. 왜 접어 두었는지만 적었습니다.
- `apiKeyMessages` 에는 `prefix`·`length`·`shape` 가 남아 있지만 지금 도메인은
  `empty` 만 돌려줍니다. 형식 검사를 일부러 뺀 자리라 문구도 지울지 여쭙고
  나서 정하겠습니다.

## 2026-08-21 — 아키텍처 의존 관계 그림 수정

**요청**
아키텍처 문서의 데이터 흐름 그림이 이상하다는 지적.

**한 일**
`ARCHITECTURE.md` 의 "데이터가 흐르는 방향" 절이 틀려 있어 다시 그렸습니다.
시작 페이지 작업 때 기존 그림에 계층을 급히 끼워 넣으면서 사실과 어긋났습니다.

틀렸던 곳 다섯 가지:

1. **화살표 방향이 반대.** `components → app/page` 에 "import" 라벨이 붙어
   있었는데, 실제로는 `app/page.tsx` 가 컴포넌트를 import 합니다.
2. **"lib/usecase 는 아무것도 import 하지 않음" 이 거짓.** usecase 는 domain 을
   import 합니다. import 가 하나도 없는 것은 domain 뿐입니다.
3. **"lib/site-content.ts 는 어디에도 의존하지 않음" 이 거짓.**
   `components/icons` 에서 타입 `IconName` 을 가져옵니다.
4. **adapter 가 site-content 아래 체인에 있었음.** adapter 는 domain·usecase 만
   알고 site-content 와 아무 관계가 없습니다.
5. **`app/page → app/layout → globals.css` 체인이 거짓.** layout 이 globals.css 를
   import 하고, layout 과 page 사이에는 import 관계가 없습니다 — Next.js 가
   파일 이름을 보고 감쌉니다.

각 파일의 `import` 문을 전부 뽑아 대조한 뒤, 그림을 셋으로 나눠 다시 썼습니다 —
"누가 누구를 import 하는가"(계층), "화면은 어떻게 조립되는가"(렌더링),
"한 군데 어긋난 곳"(site-content 가 icons 의 타입을 빌리는 예외).
**화살표는 `A → B` 가 "A 가 B 를 import 한다"** 는 뜻임을 그림 위에 못 박았습니다.

**건드린 파일**
- `ARCHITECTURE.md` — 2절의 그림과 설명 전면 교체

**확인**
`grep -n '^import'` 로 여덟 개 파일의 import 문을 전부 뽑아 그림과 대조했습니다.

**남긴 것**
이 그림은 손으로 관리하는 것이라 파일이 옮겨지면 또 어긋납니다. import 관계를
자동으로 검사하는 장치(ESLint 의 의존 방향 규칙 등)는 넣지 않았습니다.

---

## 2026-08-21 — 학습 노트 에이전트(code-tutor) 추가

**요청**
코드를 물어보면 기본 문법부터 우리 코드에서의 동작까지 쉽고 단계적으로
설명해 주는 에이전트를 만들 것. 터미널에 바로 답하지 말고 학습용 문서로
정리할 것.

**한 일**
`code-tutor` 서브에이전트와 그것이 쓰는 문서 틀을 만들었습니다.
코드에 대한 질문이 오면 터미널에 답하는 대신 `docs/learn/` 에 학습용 HTML
문서를 한 장 만들고 경로만 알려 줍니다.

문서는 세 부분으로 고정했습니다 — `1부 기본 문법`(저장소와 무관한 최소
예제로 문법 자체를 먼저), `2부 우리 코드에서는`(같은 문법이 이 저장소 어디서
어떻게 쓰이는지, 파일과 줄 번호를 붙여), `3부 직접 확인해보기`(손으로 해 볼
실험). 읽기만 해서는 안 남기 때문에 3부를 넣었습니다.

**결과물을 PDF 가 아니라 HTML 로 한 이유**
처음에는 PDF 로 뽑을 생각이었고 헤드리스 Chrome 으로 변환하는 방법까지
알아봤지만, PDF 는 바이너리라 git 이 바뀐 곳을 비교하지 못하고 문서를 고칠
때마다 파일이 통째로 새로 쌓입니다. HTML 로 하면 텍스트라 diff 가 되고,
브라우저로 바로 읽히며, 인쇄가 필요하면 Ctrl+P 로 PDF 를 뽑을 수 있어
잃는 것이 없습니다. 그래서 변환 단계를 통째로 뺐습니다.

**만들면서 정한 제약**
외부 자원(CDN 글꼴·이미지·스크립트)을 쓰지 않습니다. 인터넷이 없거나 다른
컴퓨터에서 열어도 모양이 같아야 하기 때문입니다. 윈도우·맥에 다 있는 시스템
글꼴만 씁니다.

색은 사이트의 잉걸불 팔레트를 쓰되 **역할이 뒤집힙니다.** 문서는 흰 바탕이라
`#F6C453` 은 명암비가 1.6:1 밖에 안 나와 글자색으로 못 씁니다(테두리·채움
전용). 검은 바탕에서 가장 잘 보이던 색이라 그대로 가져오면 안 보입니다.
이 점을 `learn.css` 맨 위 주석에 적어 두었습니다.

**건드린 파일**
- `.claude/agents/code-tutor.md` — 새로 만듦. 에이전트 규칙
- `docs/learn/_assets/learn.css` — 새로 만듦. 공용 스타일 + 인쇄 규칙
- `docs/learn/_assets/template.html` — 새로 만듦. 문서 골격
- `docs/learn/index.html` — 새로 만듦. 목차
- `docs/learn/01-export-const-type.html` — 새로 만듦. 첫 문서
- `AGENTS.md` — 코드 설명은 문서로 남기라는 절 추가
- `ARCHITECTURE.md` — 문서 표에 `docs/learn/` 추가

**확인**
브라우저로 첫 문서와 목차를 열어 확인했습니다. 한글·코드 블록·콜아웃·표가
의도대로 나옵니다.
문서에 적은 줄 번호를 `sed` 로 전부 대조해 네 곳을 고쳤습니다
(`site-header.tsx:5→6`, `:32→29`, `hero.tsx:44→51`, `tsconfig.json:22→21`).
CSS 버그도 하나 잡았습니다 — 콜아웃 제목 규칙이 자손 선택자라 문장 중간의
`<strong>` 까지 제목처럼 키우고 있었습니다. 자식 선택자(`>`)로 바꿨습니다.

**남긴 것**
에이전트가 실제로 자동 호출되는지는 아직 확인하지 못했습니다. 다음 질문이
왔을 때 터미널에 길게 답하지 않고 `02-*.html` 을 만드는지 봐야 합니다.
코드 하이라이팅은 넣지 않았습니다. 색을 입히려면 자바스크립트 라이브러리가
필요한데 "외부 자원을 쓰지 않는다" 는 제약과 부딪힙니다. 지금은 고정폭 글꼴과
`.hl` 형광펜으로만 구분합니다.

---

## 2026-08-21 — 입력칸 안내 문구를 형식 없는 말로

**요청**
입력칸 안내 문구에 그냥 구글 API 키를 넣으라고 안내할 것.

**한 일**
"AIza... 로 시작하는 키를 붙여넣으세요" 를 **"구글 API 키를 붙여넣으세요"** 로
바꿨습니다. 형식을 검사하지 않기로 한 마당에 안내만 형식을 말하고 있으면
넣어도 되는 키를 못 넣는 것처럼 보입니다.

문구는 컴포넌트에 박아 두지 않고 `apiKeyPlaceholder` 로 `lib/site-content.ts`
에 두었습니다. 글은 한 곳에 모으는 것이 이 저장소 규칙입니다.

안내가 한국어 문장이 되었으므로 `::placeholder` 에서 고정폭 글꼴과 넓은 자간을
벗겼습니다. 입력한 키 자체는 그대로 고정폭이라 자릿수를 세기 쉽습니다.

**건드린 파일**
- `lib/site-content.ts` — `apiKeyPlaceholder` 추가
- `components/start/api-key-form.tsx` — 박아 둔 문구를 그 값으로 교체
- `app/globals.css` — `.start-input::placeholder` 를 본문 글꼴로

**확인**
`npx tsc --noEmit`, `npm run lint` 통과.
서버가 그린 HTML 에서 `placeholder="구글 API 키를 붙여넣으세요"` 를 확인했습니다.
브라우저 화면으로는 확인하지 않았습니다 — 그 브라우저에 실제 키가 저장되어
있어서 입력칸 대신 저장된 모습이 나오는 상태였고, 지우면서까지 볼 일은
아니라고 보았습니다.

**남긴 것**
읽어 주는 기기용 라벨은 "구글 Gemini API 키" 그대로입니다. 화면에는 안 보이고
어떤 서비스의 키인지 분명히 해 두는 편이 나아 두었습니다.

---

## 2026-08-21 — 키 형식 검사 걷어냄

**요청**
키 형식 검사는 안 해도 된다. 진짜 API 키를 넣었는데 오류가 나는 것 같다.

**한 일**
`checkApiKey` 에서 형식 검사를 전부 뺐습니다. 이제 앞뒤 공백을 떼고 빈 값인지만
봅니다.

빼기 전에는 네 가지를 봤습니다 — 빈 값, `AIza` 접두사, **39자 길이**, 글자 구성.
실제 키를 막은 것은 길이 조건일 가능성이 큽니다. 구글이 키 길이를 39자로
약속한 적이 없는데 제가 그렇게 단정했습니다. 접두사와 글자 구성도 같은 이유로
함께 뺐습니다 — 근거가 없는 규칙은 멀쩡한 키를 막기만 합니다.

`ApiKeyProblem` 은 이제 `"empty"` 하나뿐이라 `apiKeyMessages` 에서 prefix ·
length · shape 문구 셋을 지웠습니다. `maskApiKey` 에는 12자 이하인 키를 통째로
덮는 조건을 넣었습니다 — 길이를 더 이상 가정할 수 없게 되어, 짧은 키에 앞 6자
뒤 4자를 남기면 거의 다 드러나기 때문입니다.

**건드린 파일**
- `lib/domain/api-key.ts` — 형식 검사 제거, `maskApiKey` 에 짧은 키 처리 추가
- `lib/site-content.ts` — `apiKeyMessages` 에서 문구 셋 제거
- `ARCHITECTURE.md` — 도메인 설명과 "지금 없는 것" 갱신

**확인**
`npx tsc --noEmit`, `npm run lint`, `npm run build` 모두 통과했습니다.
브라우저에서 44자짜리 키를 넣어 통과하는 것을 보았습니다. 예전 규칙이면
"길이가 맞지 않습니다" 로 막혔을 값입니다.

**남긴 것**
입력칸의 안내 문구는 "AIza... 로 시작하는 키를 붙여넣으세요" 그대로 두었습니다.
검사하지는 않지만 어떤 값을 넣는 자리인지 알려 주는 힌트로는 쓸모가 있고,
`design/screen.png` 시안과도 같습니다.
키가 진짜 쓸 수 있는 것인지는 여전히 확인하지 않습니다. 구글에 짧은 요청을
보내 확인하는 일은 어댑터 계층에 넣을 자리인데, 이번에도 넣지 않았습니다.
지금은 틀린 키를 넣어도 저장되고, 실제로 쓰는 화면이 생겨야 드러납니다.

---

## 2026-08-21 — 시작 페이지(/start) 추가

**요청**
"무료로 시작하기" 를 누르면 우리 디자인에 맞는 시작 페이지로 넘어가게 할 것.
`design/screen.png` 를 바탕으로 만들고 색·폰트는 기존과 어울리게 할 것.

**한 일**
`/start` 를 새로 만들고 홈의 모든 "무료로 시작하기" 단추를 그쪽으로 이었습니다.

이번에 처음으로 비즈니스 규칙(키 검증)이 생겼으므로 `AGENTS.md` 의 클린
아키텍처 규칙을 그대로 적용해 계층을 나눠 넣었습니다.

- `lib/domain/api-key.ts` — 키가 올바른지만 판단합니다(AIza 접두사, 39자, 글자 구성).
  React 도 브라우저도 모릅니다. 검증을 통과한 값에만 `ApiKey` 표식을 붙여
  검증을 건너뛴 문자열이 유스케이스로 흘러들 수 없게 했습니다.
- `lib/usecase/enter-with-api-key.ts` — "키를 넣고 들어가기". 저장소는 `ApiKeyStore`
  인터페이스로 선언만 하고 구현은 밖에서 받습니다.
- `lib/adapter/browser-api-key-store.ts` — 그 인터페이스를 localStorage 로 채운 구현.
  localStorage 를 아는 유일한 파일입니다. 쿠키가 아닌 localStorage 를 쓴 것은
  쿠키는 요청마다 서버로 딸려가기 때문입니다 — 요금제에 적어 둔 "키는 브라우저
  안에만 있고 서버로 보내지 않는다" 는 약속을 지키려면 쿠키를 쓰면 안 됩니다.

화면은 시안을 따라 로고 · 이름 · 한 줄 약속 · 네 걸음(준비/고르기/장보기/요리) ·
접어 둔 사용법 · 키 입력 카드 · 키 받으러 가는 길 순서로 놓았습니다.
새 색이나 글꼴을 만들지 않고 `:root` 토큰과 `.btn`·`.rule`·`.glow` 를 그대로
썼습니다. 가로폭만 720px 로 좁혔습니다 — 할 일이 하나뿐인 화면이라 시선이
갈라지면 안 되기 때문입니다.

키 입력 카드만 클라이언트 컴포넌트입니다. 저장된 키를 읽을 때 `useEffect` +
`useState` 대신 `useSyncExternalStore` 를 썼습니다. localStorage 는 React 밖에
있는 값이라 이쪽이 맞고, 서버 몫이 언제나 null 이라 서버가 그린 화면과
브라우저의 첫 화면이 어긋나지 않습니다. 처음에 `useEffect` 로 썼다가
ESLint 가 잡아서 바꾼 것입니다.

새 규칙대로 새로 쓴 코드에는 행마다 주석을 달았습니다.

**건드린 파일**
- `lib/domain/api-key.ts` — 새로 만듦
- `lib/usecase/enter-with-api-key.ts` — 새로 만듦
- `lib/adapter/browser-api-key-store.ts` — 새로 만듦
- `app/start/page.tsx` — 새로 만듦
- `components/start/start-head.tsx` — 새로 만듦 (서버 컴포넌트)
- `components/start/api-key-form.tsx` — 새로 만듦 (이 페이지의 유일한 클라이언트 컴포넌트)
- `app/globals.css` — `.start-*` 규칙 추가. 그리고 FAQ 의 `details`·`summary` 규칙을
  `.faq` 안으로 가두었습니다 (아래 참고)
- `components/icons.tsx` — `eye`·`eye-off`·`key`·`spark` 네 개 추가, `Icon` 에 `size` 옵션
- `lib/site-content.ts` — 시작 페이지 글 추가, `Plan` 에 `href` 필드 추가
- `components/hero.tsx`·`closing.tsx`·`site-header.tsx`·`pricing.tsx` — CTA 를 `/start` 로

**확인**
`npx tsc --noEmit`, `npm run lint`, `npm run build` 모두 통과했습니다.
`/start` 는 정적으로 미리 그려집니다.
브라우저에서 직접 눌러 보았습니다 — 틀린 키(`sk-...`)는 "AIza 로 시작합니다"
안내가 뜨고, 형식이 맞는 키는 저장된 뒤 가린 형태(`AIzaSy········0abc`)로
바뀌며, "다른 키로 바꾸기"로 다시 입력칸으로 돌아갑니다.
머리말의 "무료로 시작하기" 를 눌러 `/start` 로 넘어가는 것까지 보았습니다.

**남긴 것**
키는 형식만 보고 실제로 살아 있는지는 확인하지 않습니다. 구글에 짧은 요청을
보내 확인하는 일은 어댑터 계층에 넣을 자리인데, 이번에는 넣지 않았습니다.
다음 걸음인 "고르기" 화면이 없어서, 키를 넣은 뒤의 단추는 눌리지 않는
"준비 중" 상태로 두었습니다. 키만 받아 두고 갈 데가 없는 상태입니다.
머리말의 "로그인", 요금제의 홈셰프·키친 단추는 여전히 `href="#"` 입니다.
맛보기만 `/start` 로 이었습니다.

작업 중 FAQ 의 `details`·`summary` CSS 가 맨 selector 라 새 페이지의
`<details>` 까지 끌어가는 것을 발견해 `.faq` 안으로 가두었습니다. 홈페이지
FAQ 모양은 그대로입니다. 같은 식으로 맨 selector 를 쓴 곳이 `globals.css` 에
더 있는지는 따로 훑어보지 않았습니다.

---

## 2026-08-21 — 아키텍처 안내 문서 추가

**요청**
지금 폴더의 아키텍처가 어떻게 되는지, 파일마다 무슨 기능을 하고 어떤 내용이
담겼는지 md 파일로 정리할 것.

**한 일**
`ARCHITECTURE.md` 를 새로 썼습니다. 여섯 절 구성입니다.
정적 랜딩 페이지 한 장이라는 요약, 글(`lib/site-content.ts`)·배치(`components/`)·
모양(`app/globals.css`) 세 축으로 나뉜 관심사와 그 의존 방향,
`app/`·`components/`·`lib/`·`design/`·`public/`·설정·문서 순의 파일별 설명,
지금 없는 것(API·DB·테스트·환경변수), 새 클린 아키텍처 규칙과의 거리,
실행 명령.
파일별 설명에는 읽어야 알 수 있는 것들을 적었습니다 — `site-header.tsx` 가
유일한 클라이언트 컴포넌트라는 점, `--fire-1` 은 명암비 3.7:1 이라 글자색으로
못 쓴다는 점, SVG 그라데이션 id 를 부르는 쪽이 넘겨주는 이유,
`showcase.tsx` 의 `satisfies` 가 삽화 종류 누락을 컴파일 타임에 잡아 준다는 점,
`b.side` 가 좁은 화면의 읽는 순서를 결정한다는 점.

**건드린 파일**
- `ARCHITECTURE.md` — 새로 만듦

**확인**
`app/`·`components/`·`lib/` 의 모든 소스와 설정 파일을 직접 읽고 썼습니다.
줄 수는 `wc -l` 값입니다. 코드는 바꾸지 않아 실행 검증은 없습니다.

**남긴 것**
`app/globals.css` 는 458줄이라 절 단위 개요만 적고 규칙 하나하나는
풀지 않았습니다.
`README.md` 의 구조 표와 내용이 일부 겹칩니다. README 는 시작하는 사람용,
ARCHITECTURE 는 코드를 고칠 사람용으로 두었는데, 겹치는 표를 정리할지는
따로 정해야 합니다.
문서를 쓰다 발견한 두 가지는 손대지 않았습니다 — `public/` 의
create-next-app 잔여 SVG 다섯 개가 안 쓰이고 있고,
`lib/site-content.ts` 의 `faqs` 에 음성 저장 관련 항목이 주석으로 남아 있습니다.

---

## 2026-08-21 — 클린 아키텍처·행별 주석 규칙 추가

**요청**
앞으로 코딩할 때 클린 아키텍처를 바탕으로 짜고, 행마다 주석을 달라는 규칙을 만들 것.

**한 일**
`AGENTS.md` 에 규칙 두 개를 덧붙였습니다.
"클린 아키텍처를 지킬 것" 은 계층 순서(도메인 → 유스케이스 → 어댑터 → 프레임워크),
의존 방향은 안쪽으로만, 바깥 의존은 인터페이스로 뒤집기, 컴포넌트는 얇게,
폴더도 계층을 따를 것을 정했습니다.
"행마다 주석을 달 것" 은 한 줄마다 그 줄 위에 한국어 주석을 달되
코드를 옮겨 적지 말고 이유를 적고, 닫는 괄호·빈 줄·import 묶음은 빼고,
코드를 고치면 주석도 같이 맞추도록 했습니다.
`CLAUDE.md` 가 `@AGENTS.md` 를 그대로 불러오므로 따로 고치지 않았습니다.

**건드린 파일**
- `AGENTS.md` — 규칙 두 절 추가

**확인**
문서만 바뀌어 실행 검증은 없습니다. 다음 코드 작업부터 적용됩니다.

**남긴 것**
기존 `app/`·`components/`·`lib/` 코드는 새 규칙에 맞춰 손대지 않았습니다.
지금 구조를 계층대로 다시 정리할지는 따로 정해야 합니다.
ESLint 로 강제하는 장치(의존 방향 검사 등) 도 넣지 않았습니다.

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
