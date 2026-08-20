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
