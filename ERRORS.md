# 오류 기록

막혔던 오류와 푼 방법을 모읍니다. 최신 항목이 위로 옵니다.

같은 오류를 두 번 겪지 않는 것도 목적이지만, 더 중요한 것은 **왜 그런 규칙이
있는지** 알아 두는 것입니다. 오류 메시지는 대개 "무엇이 잘못됐다" 만 말하고
"왜 그렇게 정해 두었는지" 는 말해 주지 않습니다. 그 부분을 여기에 적습니다.

각 항목은 이렇게 적습니다.

- **증상** — 화면에 뜬 메시지를 그대로. 나중에 검색해서 찾으려면 원문이 필요합니다
- **언제** — 무엇을 하다가 났는지
- **왜 났나** — 진짜 원인. "무엇을 고쳤다" 가 아니라 "왜 그게 문제였나"
- **어떻게 고쳤나** — 실제로 한 일
- **배운 것** — 다음에 같은 함정을 피하는 법

---

## 2026-08-23 — 한국어 질문이 엉뚱하게 검색됨 (사실은 터미널 탓)

**증상**

```
0.076 흑임자 카카오 스피어
0.063 하얀설탕으로 굽는 홈메이드 약과
0.058 하얀설탕으로 굽는 홈메이드 약과
```

"계란찜이 안 부푸는 이유" 를 물었는데 계란찜 후기가 하나도 안 나왔다.
점수도 0.076 로 비정상적으로 낮았다(정상이면 0.35~0.5).

**언제**

파인콘에 후기 101건을 올린 직후, `curl` 로 검색 API 를 두드려 확인하던 중.

**왜 났나**

**앱은 멀쩡했다. `curl` 에 한국어를 그대로 적어 넘긴 것이 문제였다.**

Git Bash 는 명령줄 인자를 시스템 코드페이지(한국어 윈도우면 cp949)로 넘긴다.
Next.js 는 그 바이트를 UTF-8 로 읽으므로 글자가 깨진다. 깨진 글자를 임베딩하면
아무 뜻도 없는 벡터가 나오고, 그 벡터와 가장 가까운 것을 고르니 결과가
무작위처럼 보인다. 점수 0.07 대는 "거의 직각인 벡터", 즉 **아무 관련 없음**이라는 뜻이다.

여기서 시간을 크게 버렸다. 원인을 랭체인 쪽에서 찾았기 때문이다.
`PineconeEmbeddings.embedQuery` 가 `this.params.inputType` 을 영구히 바꿔 놓는
진짜 버그가 있어서 더 그럴듯해 보였다(문서는 passage, 질문은 query 로
임베딩해야 하는데 뒤섞일 수 있다). 하지만 그건 이 증상의 원인이 아니었다.

**어떻게 고쳤나**

앱을 고칠 것이 없었다. 확인 방법을 고쳤다.

```
Q=$(python -c "import urllib.parse;print(urllib.parse.quote('계란찜이 안 부푸는 이유'))")
curl "http://localhost:3000/api/kitchen/index?q=$Q"
```

퍼센트 인코딩해서 보내니 0.487/0.401/0.396 으로 전부 계란찜이 나왔다.

**배운 것**

- **"앱이 이상하다" 로 넘어가기 전에 입력이 제대로 도착했는지부터 본다.**
  응답에 받은 값을 그대로 되돌려 담아 보면 한 번에 갈린다. 나는 이걸
  마지막에 했는데 처음에 했어야 한다.
- 윈도우 셸에서 한국어를 인자로 넘기는 것은 믿을 수 없다. **URL 인코딩하거나
  파일에 적어 `--data-binary @파일` 로 보낸다.**
- 점수를 읽을 줄 알아야 한다. 코사인 유사도가 0.05~0.08 이면 "덜 비슷한 것" 이
  아니라 **"아무 관계 없는 것"** 이다. 순위가 이상한 것과 점수가 바닥인 것은
  원인이 다르다 — 전자는 자료나 질문의 문제, 후자는 벡터 자체가 엉망이라는 뜻이다.
- 그럴듯한 용의자(랭체인 버그)를 찾았다고 수사를 멈추면 안 된다.
  **저장된 벡터를 직접 꺼내 견줘 보는 것**이 가장 빨랐다 — 자기 유사도 0.985,
  직접 쿼리 0.487 이 나온 순간 "저장도 검색도 멀쩡한데 앱만 이상하다" 로 좁혀졌다.
---

## 2026-08-23 — 랭체인 파인콘 패키지가 SDK 최신판을 거부

**증상**

```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @langchain/pinecone@1.0.3
npm error Found: @pinecone-database/pinecone@8.2.0
npm error node_modules/@pinecone-database/pinecone
npm error   @pinecone-database/pinecone@"^8.2.0" from the root project
npm error
npm error Could not resolve dependency:
npm error peer @pinecone-database/pinecone@"^5.0.2" from @langchain/pinecone@1.0.3
npm error node_modules/@langchain/pinecone
npm error   @langchain/pinecone@"^1.0.3" from the root project
npm error
npm error Conflicting peer dependency: @pinecone-database/pinecone@5.1.2
```

**언제**

챕터 10 RAG 를 붙이려고 랭체인 묶음을 깔던 중. 파인콘 SDK 를 `npm install
@pinecone-database/pinecone` 로 깔았더니 최신인 8.2.0 이 들어왔고, 그다음
`@langchain/community` 를 깔려는 순간 설치가 통째로 멈췄다.

처음에는 d3-dsv 버전이 문제인 줄 알고 그것만 세 번 고쳤는데 계속 튕겼다.
오류문을 끝까지 읽고서야 진짜 원인이 파인콘 SDK 라는 걸 알았다.

**왜 났나**

`@langchain/pinecone` 같은 **연동(integration) 패키지**는 상대 SDK 를
`dependencies` 가 아니라 `peerDependencies` 로 잡는다. 자기가 SDK 를 안고
들어가면 프로젝트에 SDK 가 두 벌 깔리고, 두 벌은 서로 다른 물건이라
한쪽에서 만든 인덱스 객체를 다른 쪽이 못 알아본다.

그래서 SDK 는 프로젝트가 한 벌만 깔고, 연동 패키지는 "이 판 범위면 내가
안다" 고 적어 둔다. 문제는 **연동 패키지가 SDK 를 따라가는 속도가 느리다는
것**이다. 파인콘 SDK 는 8까지 갔는데 랭체인 쪽은 아직 5 를 본다.
새 SDK 의 함수 이름이나 응답 모양이 바뀌었을 수 있어서, 범위를 넘겨 쓰면
설치는 되더라도 부르는 순간 터진다.

`--force` 나 `--legacy-peer-deps` 로 넘길 수 있다고 npm 이 친절히 알려 주는데,
그건 "터질 걸 알면서 깔겠다" 는 뜻이다. 지금처럼 우리가 SDK 를 직접 쓸 이유가
없는 경우엔 낮추는 쪽이 맞다.

**어떻게 고쳤나**

SDK 를 연동 패키지가 보는 범위로 낮췄다.

```
npm install @pinecone-database/pinecone@^5.1.2
```

그다음 `@langchain/community` 와 `d3-dsv@^3.0.1` 이 한 번에 깔렸다.
d3-dsv 는 애초에 원인이 아니었고, 앞의 충돌 때문에 같이 실패하던 것이었다.

**배운 것**

- **오류문은 "While resolving" 줄부터 읽는다.** 거기 적힌 것이 불평하는 쪽,
  "Found" 가 실제로 깔린 것, "Could not resolve dependency" 아래가 원하는 것이다.
  나는 마지막 줄만 보고 d3-dsv 를 세 번 고쳤다.
- 연동 패키지를 쓸 때는 **연동 패키지를 먼저 깔고** SDK 를 npm 이 골라 주게
  두는 편이 낫다. SDK 를 먼저 최신으로 깔면 이 충돌을 반드시 만난다.
- `--legacy-peer-deps` 는 해결이 아니다. peerDependencies 는 "두 벌 깔리면
  안 되는 물건" 을 한 벌로 묶으려는 장치라서, 무시하면 런타임에 값을 주고받다
  깨진다. 설치가 조용해질 뿐이다.
---

## 2026-08-21 — `"use server"` 파일에서 객체를 export

**증상**

```
A "use server" file can only export async functions, found object.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value

.next-internal\server\app\signup\page\actions.js (server actions loader) (1:1)

> 1 | export {signUpAction as '6072156b...'} from 'ACTIONS_MODULE0'
  2 | export {emptyAuthState as '7f4fc2e0...'} from 'ACTIONS_MODULE0'
```

**언제**

수파베이스 인증을 붙인 뒤 `/signup` 에서 회원가입을 시도했을 때.
페이지 자체가 안 열리고 위 오류가 떴습니다.

**왜 났나**

`app/actions/auth.ts` 맨 위에 `"use server"` 가 붙어 있는데, 그 파일에서
async 함수가 아닌 것을 하나 내보내고 있었습니다.

```ts
"use server";

// 이건 괜찮다 — async 함수
export async function signUpAction(prev, formData) { ... }

// 이게 문제 — 그냥 객체
export const emptyAuthState = { reason: null, email: "" };
```

**왜 그런 규칙이 있는가.** `"use server"` 파일에서 내보낸 것은 전부
**바깥에서 부를 수 있는 서버 입구**가 됩니다. Next.js 는 각각에 주소 같은
아이디(`'6072156b...'`)를 붙이고, 브라우저에는 실제 코드 대신 그 아이디만
내려보냅니다. 폼을 보내면 그 아이디로 서버에 POST 가 가고 서버가 진짜 함수를
실행합니다.

그런데 **객체에는 그 취급을 할 수가 없습니다.** "이 객체를 POST 로 실행한다"
는 말이 성립하지 않기 때문입니다. 그래서 Next.js 가 아예 빌드 단계에서 막습니다.

오류 메시지에 딸려 온 생성 코드를 보면 사정이 그대로 보입니다 —
`signUpAction` 과 `emptyAuthState` 를 **똑같은 방식으로** 내보내려 하고 있습니다.
Next.js 입장에서는 둘을 구별할 방법이 없습니다.

한 가지 헷갈리는 점 — `export type AuthFormState = {...}` 는 같은 파일에 있어도
괜찮습니다. 타입은 TypeScript 가 컴파일하면서 지워 버려서 실제 파일에는
남지 않기 때문입니다. 지워지지 않는 것(값)만 문제가 됩니다.

**어떻게 고쳤나**

값과 타입을 `"use server"` 가 없는 평범한 파일로 옮겼습니다.

```
app/actions/auth-state.ts   ← 새로 만듦. AuthFormState 타입 + emptyAuthState 객체
app/actions/auth.ts         ← "use server". async 함수 세 개만 남김
```

`emptyAuthState` 를 쓰던 두 폼의 import 도 새 파일 쪽으로 바꿨습니다.

```ts
// 전
import { emptyAuthState, signInAction } from "@/app/actions/auth";

// 후
import { signInAction } from "@/app/actions/auth";
import { emptyAuthState } from "@/app/actions/auth-state";
```

**배운 것**

- `"use server"` 파일에는 **async 함수만** 둡니다. 상수·객체·클래스는 옆 파일로
- 타입(`export type`)은 같이 둬도 됩니다. 컴파일하면 사라지니까
- 서버 액션은 "브라우저에서 부를 수 있는 서버 함수" 가 아니라
  **"누구나 POST 할 수 있는 입구"** 입니다. 그래서 화면에서 이미 검사했더라도
  액션 안에서 한 번 더 검사해야 합니다
- `npx tsc --noEmit` 과 `next build` 는 이걸 못 잡았습니다. 실제로 그 페이지를
  열었을 때 서버 액션 로더가 도는 시점에 걸립니다. **타입 검사와 빌드가
  통과했다고 화면이 뜨는 것은 아닙니다** — 한 번은 눌러 봐야 합니다
