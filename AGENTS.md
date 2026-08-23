<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 변경 기록을 남길 것

기능을 추가하거나 코드를 고쳐 달라는 요청을 받으면, 작업을 마친 뒤 **반드시**
`CHANGELOG.md` 맨 위에 항목을 하나 추가한다. 파일 첫머리에 적힌 형식
(요청 / 한 일 / 건드린 파일 / 확인 / 남긴 것)을 따른다.

- 질문에 답하기만 한 턴, 코드를 안 고친 턴은 적지 않는다.
- 한 요청에 여러 파일을 고쳤어도 항목은 하나로 묶는다.
- 일부러 안 한 부분이 있으면 "남긴 것"에 반드시 적는다.
- 커밋할 때 `CHANGELOG.md` 를 같은 커밋에 넣는다.

# 오류를 만나면 기록으로 남길 것

작업 중에 오류가 나서 막혔다가 풀었으면, `ERRORS.md` 맨 위에 항목을 하나
추가한다. 파일 첫머리에 적힌 형식(증상 / 언제 / 왜 났나 / 어떻게 고쳤나 /
배운 것)을 따른다. 학습용으로 모으는 파일이다.

- **증상에는 오류 메시지를 원문 그대로** 옮긴다. 나중에 검색으로 찾으려면
  번역문이 아니라 원문이 필요하다.
- "왜 났나" 는 "무엇을 고쳤다" 가 아니라 **왜 그것이 문제였는지**, 그런 규칙이
  왜 있는지를 적는다. 이 파일의 값어치는 거기 있다.
- 오타나 이름을 잘못 적은 것처럼 배울 게 없는 실수는 적지 않는다.
- 사용자가 겪은 오류든 작업 중에 내가 만든 오류든 똑같이 적는다.
- `CHANGELOG.md` 와 목적이 다르다. 변경 기록은 "무엇이 바뀌었나",
  오류 기록은 "왜 막혔고 무엇을 배웠나" 다. 같은 일을 양쪽에 적어도 된다.

# 클린 아키텍처를 지킬 것

새 코드를 쓰거나 기존 코드를 고칠 때는 클린 아키텍처를 기준으로 짠다.

- **계층을 나눈다.** 안쪽부터 `도메인(엔티티·규칙) → 유스케이스 → 어댑터(레포지토리·API 클라이언트) → 프레임워크(Next.js 라우트·React 컴포넌트)` 순이다.
- **의존 방향은 항상 안쪽으로만.** 도메인은 유스케이스를 모르고, 유스케이스는 React·Next.js·DB·`fetch` 를 모른다. 바깥 계층이 안쪽을 가져다 쓴다.
- **바깥 것은 인터페이스로 뒤집는다.** 유스케이스가 저장소나 외부 API 가 필요하면 그 계층에 인터페이스를 두고, 구현은 어댑터 계층에 둔 뒤 주입한다.
- **컴포넌트는 얇게.** React 컴포넌트와 라우트 핸들러는 입력을 받아 유스케이스를 호출하고 결과를 그리는 일만 한다. 비즈니스 규칙을 컴포넌트 안에 쓰지 않는다.
- **폴더도 계층을 따른다.** 도메인·유스케이스는 `lib/` 아래 계층 이름을 가진 폴더에 두고, 화면은 `app/`·`components/` 에 둔다.
- 기존 파일이 이 구조를 안 지키고 있으면, 고치는 김에 그 파일이 속한 계층으로 옮길지 먼저 물어본다.

# 행마다 주석을 달 것

작성하거나 수정하는 코드에는 **한 줄마다 그 줄이 무엇을 하는지 한국어 주석**을 붙인다.

- 주석은 줄 끝이 아니라 그 줄 **바로 위**에 단다. 줄이 길어져 읽기 나빠지는 것을 막기 위해서다.
- 코드를 그대로 옮겨 적지 말고(`i += 1` → "i 를 1 늘린다" X), **왜 그렇게 하는지**를 적는다.
- 닫는 괄호·중괄호만 있는 줄, 빈 줄, import 문 묶음에는 달지 않는다.
- 고친 줄에는 주석을 새로 맞춘다. 코드만 바뀌고 주석이 옛날 내용으로 남는 일이 없게 한다.

# 코드 설명은 문서로 남길 것

코드가 어떻게 작동하는지 묻는 질문은 `code-tutor` 에이전트가 맡는다.
터미널에 길게 답하는 대신 `docs/learn/` 에 학습용 HTML 문서를 한 장 만든다.
터미널 출력은 스크롤을 올리면 사라지지만 문서는 남고, git 에 커밋되어 다른
기계에서도 이어 볼 수 있기 때문이다.

- 규칙은 `.claude/agents/code-tutor.md` 에 있다.
- 보기(스타일)는 `docs/learn/_assets/learn.css` 한 파일이 맡는다.
  문서 안에 `<style>` 이나 인라인 `style=` 을 쓰지 않는다.
- 학습 문서를 만든 턴은 코드를 고친 턴이 아니므로 `CHANGELOG.md` 에 적지 않는다.
