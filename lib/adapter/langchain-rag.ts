import "server-only";

/**
 * 어댑터 · 랭체인으로 짠 RAG 파이프라인.
 *
 * 유스케이스가 적어 둔 RagChain 약속을 채워 준다.
 * 파인콘·제미나이·랭체인이라는 말이 나오는 파일은 여기 하나뿐이다.
 *
 * **서버에서만 돈다.** 맨 윗줄의 `server-only` 가 그것을 강제한다 —
 * 실수로 브라우저 쪽 파일에서 가져다 쓰면 빌드가 거기서 멈춘다.
 *
 * 파인콘 키는 우리 계정 것이라 브라우저에 내보내면 안 되고,
 * **제미나이 키는 반대로 사람이 시작 화면에서 넣어 둔 자기 것을 받아 쓴다.**
 * 체인이 서버에서 한 줄기로 돌아야 하므로 요청마다 키를 건네받는다.
 * 받은 키는 그 요청 안에서만 쓰고 어디에도 담지 않는다.
 *
 * ── 랭체인이 대신 해 주는 일 ─────────────────────────────────
 *  · 임베딩 호출 (PineconeEmbeddings — 파인콘이 무료로 해 주는 그것)
 *  · 벡터 저장·검색 (PineconeStore, asRetriever)
 *  · 프롬프트에 값 끼워 넣기 (ChatPromptTemplate 의 {context}, {input})
 *  · 모델 호출과 글자 꺼내기 (ChatGoogleGenerativeAI, StringOutputParser)
 *  · 이 모두를 한 줄기로 잇기 (RunnableSequence — 교재가 말하는 LCEL)
 *
 * 랭체인을 안 쓰면 위 다섯을 손으로 짜야 하고, 모델을 바꿀 때마다 다시 짜야 한다.
 */

import { PineconeEmbeddings, PineconeStore } from "@langchain/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { foldSources, TAKE, type ChatTurn, type SourceRef } from "@/lib/domain/ask";
import { clampRating, reviewText, type Review } from "@/lib/domain/review";
import type { ChainAnswer, RagChain } from "@/lib/usecase/ask-kitchen";

/**
 * 임베딩 모델.
 *
 * 파인콘이 자기 서버에서 돌려주는 모델이라 따로 값이 붙지 않는다.
 * 교재가 고른 것이 이것이고, 한국어도 실제로 걸린다 —
 * 파인콘 문서의 표에는 다국어가 아니라고 적혀 있지만 그 표를 믿지 않는다.
 * 한국어가 안 걸리는 것 같으면 `multilingual-e5-large` 로 바꿔 보면 된다.
 * 둘 다 1024차원이라 인덱스는 그대로 쓸 수 있다.
 */
const EMBED_MODEL = "llama-text-embed-v2";

/** 답을 만드는 모델. 빠른 쪽을 쓴다 — 물어보고 바로 읽는 화면이다 */
const CHAT_MODEL = "gemini-3.5-flash-lite";

/** 인덱스 안에서 우리 후기가 놓이는 칸. 나중에 다른 자료를 넣어도 안 섞인다 */
const NAMESPACE = "reviews";

/**
 * 한 번에 올리는 건수.
 *
 * 파인콘의 임베딩 모델은 한 요청에 받는 글 수가 정해져 있다.
 * llama-text-embed-v2 는 96건이고, 넘기면 이렇게 거절한다.
 *
 *   Input length '101' exceeded inputs limit of 96 for model 'llama-text-embed-v2'
 *
 * 한도에 딱 맞추지 않고 조금 낮춰 두는 까닭 — 후기가 늘어나거나 모델을 바꾸면
 * 한도도 달라진다. 여유를 두면 그때 여기를 다시 안 고쳐도 된다.
 */
const EMBED_BATCH = 80;

/**
 * 모델에게 어떤 자세로 답하라고 일러 주는 말.
 *
 * RAG 에서 가장 중요한 줄은 "여기 없는 이야기는 하지 말라" 다.
 * 이 말이 없으면 모델이 자기가 아는 요리 상식을 섞어서 답한다.
 * 그러면 근거를 붙여 놓고도 그 근거에 없는 말을 하게 되어 오히려 더 나쁘다.
 *
 * `{context}` 는 랭체인이 값을 끼워 넣는 자리다. 중괄호가 변수 표시라서,
 * 진짜 중괄호를 쓰고 싶으면 두 번 겹쳐 적어야 한다.
 */
const SYSTEM_TEMPLATE = `당신은 쿡파일럿 커뮤니티의 요리 후기를 읽고 답하는 도우미입니다.
아래 <context> 안의 후기만 근거로 삼아, 한국어로 친절하고 정직하게 답하세요.

지켜야 할 것:
- 후기에 없는 내용은 지어내지 않습니다. 없으면 "올라온 후기에는 그 이야기가 없습니다" 라고 말합니다.
- 일반적인 요리 상식을 덧붙이지 않습니다. 사람은 이 커뮤니티의 이야기를 물었습니다.
- 어느 요리의 후기인지 문장 안에서 밝힙니다.
- 별점이 낮은 후기와 높은 후기가 갈리면 양쪽을 모두 전합니다. 좋은 말만 골라 옮기지 않습니다.
- 세 문단을 넘기지 않습니다. 불 앞에서 읽는 사람도 있습니다.

<context>
{context}
</context>`;

/** 설정이 덜 된 것과 저쪽이 거절한 것을 구분해서 알려 준다 */
export type Setup =
  | {
      ok: true;
      pineconeKey: string;
      /** 인덱스 이름. 호스트만 넣었으면 주소에서 뽑아낸 값이 들어온다 */
      indexName: string;
      /** 인덱스 주소. 없으면 SDK 가 이름으로 찾아간다 */
      indexHost?: string;
      googleKey: string;
    }
  | { ok: false; missing: readonly string[] };

/**
 * 호스트 주소에서 인덱스 이름을 뽑아낸다.
 *
 * 파인콘 주소는 `이름-접미사.svc.어느지역.pinecone.io` 모양이다.
 * 첫 마디에서 마지막 하이픈 뒤를 떼면 이름이 나온다.
 *
 * 이름이 필요한 까닭은 SDK 가 이름을 반드시 받기 때문이다. 주소를 같이 주면
 * 이름으로 주소를 찾는 일(describeIndex)을 건너뛰므로, 이름이 조금 어긋나도
 * 실제 동작에는 지장이 없다.
 */
function nameFromHost(host: string): string {
  // 앞의 프로토콜과 뒤의 경로를 걷어 내고 첫 마디만 본다
  const label = host.replace(/^https?:\/\//, "").split(".")[0] ?? "";

  const at = label.lastIndexOf("-");

  return at > 0 ? label.slice(0, at) : label;
}

/**
 * 환경 변수에서 접속에 필요한 값을 꺼낸다.
 *
 * 이름(PINECONE_INDEX)과 주소(PINECONE_HOST) 중 **아무 쪽이든** 받는다.
 * 교재는 주소를 쓰고, 랭체인 예제는 이름을 쓴다. 둘 다 받아 두면
 * 어느 쪽을 붙여넣어도 돌아간다.
 *
 * 없을 때 오류를 던지지 않고 무엇이 빠졌는지 돌려주는 까닭 —
 * 키를 아직 안 넣은 사람에게 화면이 "무엇을 하라" 고 말해 줄 수 있어야 한다.
 * "500 오류" 만 뜨면 어디를 고쳐야 할지 알 수 없다.
 */
export function ragSetup(options?: { googleKey?: string }): Setup {
  const pineconeKey = process.env.PINECONE_API_KEY;

  /* 제미나이 키는 사람이 시작 화면에서 넣어 둔 것을 받아 쓴다.
     환경 변수는 그것이 없을 때의 뒷받침일 뿐이다 —
     각자 자기 키로 쓰는 것이 이 서비스의 방식이라 그쪽이 먼저다 */
  const googleKey = options?.googleKey?.trim() || process.env.GOOGLE_API_KEY;

  // 자료를 올릴 때는 키를 안 넘긴다. 그때는 파인콘만 있으면 된다
  const needsGoogle = options !== undefined;

  // 주소는 사람이 통째로 붙여넣든 도메인만 붙여넣든 둘 다 받아 준다
  const rawHost = process.env.PINECONE_HOST?.trim();
  const host = rawHost ? rawHost.replace(/^https?:\/\//, "").replace(/\/+$/, "") : "";

  // 이름을 적어 뒀으면 그것을 쓰고, 없으면 주소에서 뽑아낸다
  const indexName = process.env.PINECONE_INDEX?.trim() || (host ? nameFromHost(host) : "");

  const missing: string[] = [];
  if (!pineconeKey) missing.push("PINECONE_API_KEY");
  if (!indexName) missing.push("PINECONE_INDEX 또는 PINECONE_HOST");
  if (needsGoogle && !googleKey) missing.push("제미나이 API 키");

  if (missing.length > 0 || !pineconeKey || !indexName) return { ok: false, missing };

  return {
    ok: true,
    pineconeKey,
    indexName,
    // 주소를 알면 넘긴다. SDK 가 이름으로 주소를 찾는 왕복 한 번이 줄어든다
    indexHost: host ? `https://${host}` : undefined,
    // 올릴 때만 부르는 경우 비어 있을 수 있다. 답을 만들 때는 위에서 걸러진다
    googleKey: googleKey ?? "",
  };
}

/** 파인콘 인덱스를 잡고 랭체인이 쓸 저장소로 감싼다 */
async function openStore(setup: Extract<Setup, { ok: true }>) {
  const pinecone = new Pinecone({ apiKey: setup.pineconeKey });

  return PineconeStore.fromExistingIndex(
    /* 임베딩을 파인콘에게 시킨다. OpenAI 임베딩을 쓰면 그만큼 값이 붙는데,
       파인콘은 자기 인덱스에 넣을 것이면 공짜로 해 준다 */
    new PineconeEmbeddings({ model: EMBED_MODEL, apiKey: setup.pineconeKey }),
    {
      // 주소를 알면 함께 넘긴다. 그러면 이름으로 주소를 찾아보지 않는다
      pineconeIndex: pinecone.Index(setup.indexName, setup.indexHost),
      namespace: NAMESPACE,
      // 원문 글자가 담기는 칸 이름. 검색 결과에서 이 칸을 꺼내 온다
      textKey: "text",
    },
  );
}

/** 올린 결과 */
export type IndexResult =
  | { ok: true; count: number }
  | { ok: false; reason: "setup" | "key" | "unreachable"; detail?: string };

/**
 * 후기를 파인콘에 올린다.
 *
 * 같은 id 로 다시 올리면 덮어쓴다. 그래서 몇 번을 눌러도 같은 후기가
 * 여러 벌 쌓이지 않는다 — CSV 를 고치고 다시 눌러도 된다.
 */
export async function indexReviews(reviews: readonly Review[]): Promise<IndexResult> {
  /* 올리는 데는 파인콘만 있으면 된다. 답을 만들 때 쓰는 제미나이 키까지
     여기서 요구하면, 키 하나가 없다고 자료도 못 올리게 된다 */
  const setup = ragSetup();

  if (!setup.ok) {
    return { ok: false, reason: "setup", detail: setup.missing.join(", ") };
  }

  try {
    const store = await openStore(setup);

    /* 후기를 랭체인의 Document 로 바꾼다. pageContent 가 벡터가 되는 글자이고,
       metadata 는 검색 결과와 함께 돌아와 답에 출처를 붙이게 해 준다 */
    const docs = reviews.map(
      (r) =>
        new Document({
          pageContent: reviewText(r),
          metadata: {
            dishId: r.dishId,
            dish: r.dish,
            author: r.author,
            rating: r.rating,
            title: r.title,
            date: r.date,
          },
        }),
    );

    const ids = reviews.map((r) => r.id);

    // 나눠서 올린다. 한 번에 다 보내면 임베딩 모델이 건수로 거절한다
    for (let at = 0; at < docs.length; at += EMBED_BATCH) {
      // id 를 우리가 정해서 넘긴다. 안 넘기면 랭체인이 새로 만들어 매번 새 줄이 쌓인다
      await store.addDocuments(docs.slice(at, at + EMBED_BATCH), {
        ids: ids.slice(at, at + EMBED_BATCH),
      });
    }

    return { ok: true, count: docs.length };
  } catch (error) {
    return failedIndex(error);
  }
}

/** 올리다 난 오류를 우리가 쓰기로 한 낱말로 바꾼다 */
function failedIndex(error: unknown): IndexResult {
  const text = error instanceof Error ? error.message : String(error);

  // 키가 틀렸거나 권한이 없다. 사람이 키를 다시 넣어야 풀린다
  if (/401|403|unauthorized|api key/i.test(text)) {
    return { ok: false, reason: "key", detail: text.slice(0, 300) };
  }

  return { ok: false, reason: "unreachable", detail: text.slice(0, 300) };
}

/**
 * 답을 만들지 않고 **검색만** 해 본다.
 *
 * 제미나이 키 없이 부를 수 있다. 검색이 제대로 걸리는지와 답이 이상한 것이
 * 둘 중 어느 쪽 탓인지 가르려면 이 단계를 따로 볼 수 있어야 한다 —
 * 붙여 놓고 보면 "답이 이상하다" 밖에 안 보인다.
 */
export async function searchOnly(question: string, take = TAKE) {
  const setup = ragSetup();

  if (!setup.ok) return { ok: false as const, missing: setup.missing };

  const store = await openStore(setup);
  const docs = await store.similaritySearchWithScore(question, take);

  return {
    ok: true as const,
    asked: question,
    hits: docs.map(([doc, score]) => ({
      score,
      dish: doc.metadata?.dish,
      author: doc.metadata?.author,
      rating: doc.metadata?.rating,
      // 앞머리만 보여 준다. 어떤 후기가 걸렸는지 알아보기에는 충분하다
      text: doc.pageContent.slice(0, 120),
    })),
  };
}

/** 검색 결과 하나를 출처로 바꾼다 */
function refOf(doc: Document): SourceRef {
  const meta = doc.metadata as Record<string, unknown>;

  return {
    dishId: typeof meta.dishId === "string" ? meta.dishId : "",
    dish: typeof meta.dish === "string" ? meta.dish : "",
    author: typeof meta.author === "string" ? meta.author : "",
    rating: clampRating(Number(meta.rating) || 3),
  };
}

/** 지난 대화를 랭체인이 받는 모양으로 바꾼다 */
function historyMessages(history: readonly ChatTurn[]) {
  // 랭체인은 [역할, 내용] 짝의 배열을 받는다. 우리 role 이름을 그대로 쓴다
  return history.map((t) => [t.role, t.content] as [string, string]);
}

/**
 * 유스케이스가 쓸 수 있는 파이프라인을 하나 만들어 준다.
 *
 * 아래 RunnableSequence 가 교재 246쪽의 LCEL Chain 이다. 하는 일을 풀면
 *
 *   {context, input}  → 검색해서 문서를 가져오고, 물음은 그대로 흘려보낸다
 *   {answer, docs}    → 문서는 프롬프트에 끼워 모델에 보내고, 원본도 따로 남긴다
 *
 * 두 번째 칸에서 `docs` 를 같이 들고 나오는 것이 요점이다. 답만 받으면
 * "무엇을 근거로 답했는가" 를 화면에 붙일 수 없다.
 */
export function langchainRag(googleKey: string): RagChain {
  return {
    async run(question, history): Promise<ChainAnswer> {
      const setup = ragSetup({ googleKey });

      // 키가 없는 것은 "키가 틀렸다" 와 화면에서 할 말이 같다
      if (!setup.ok) return { ok: false, reason: "key" };

      try {
        const store = await openStore(setup);

        // 가장 비슷한 후기 다섯 건만 가져온다
        const retriever = store.asRetriever({ k: TAKE });

        const chat = new ChatGoogleGenerativeAI({
          model: CHAT_MODEL,
          apiKey: setup.googleKey,
          /* 낮게 둔다. 이 화면에서 바라는 것은 재미있는 글이 아니라
             후기에 붙어 있는 답이다 */
          temperature: 0.2,
          maxOutputTokens: 900,
        });

        const prompt = ChatPromptTemplate.fromMessages([
          ["system", SYSTEM_TEMPLATE],
          /* 지난 대화가 들어가는 자리. 이게 있어야 "그거 몇 분이라고 했지?" 가
             통한다 — LLM 요청은 무상태라 지난 말을 다시 실어 보내야 한다 */
          new MessagesPlaceholder("history"),
          ["human", "{input}"],
        ]);

        const chain = RunnableSequence.from([
          {
            // 검색해서 문서를 가져오되 원본도 함께 들고 나온다
            context: async (input: string) => {
              const docs = await retriever.invoke(input);

              return {
                docs,
                // 모델에게는 글자만 이어 붙여 넘긴다
                text: docs.map((d) => d.pageContent).join("\n\n---\n\n"),
              };
            },
            // 물음은 손대지 않고 그대로 다음 칸으로
            input: new RunnablePassthrough(),
          },
          {
            answer: RunnableSequence.from([
              (piped: { context: { text: string }; input: string }) => ({
                context: piped.context.text,
                input: piped.input,
                history: historyMessages(history),
              }),
              prompt,
              chat,
              // 모델 응답 객체에서 글자만 꺼낸다
              new StringOutputParser(),
            ]),
            // 원본 문서는 그대로 통과시킨다. 출처를 붙이려면 이게 있어야 한다
            docs: (piped: { context: { docs: Document[] } }) => piped.context.docs,
          },
        ]);

        const out = (await chain.invoke(question)) as {
          answer: string;
          docs: Document[];
        };

        /* 걸린 후기가 없으면 답할 근거가 없다. 모델에게 "모르겠다" 를 시키지 않고
           여기서 끝낸다 — 값도 안 들고 더 정확하다 */
        if (out.docs.length === 0) return { ok: false, reason: "no-hits" };

        const text = (out.answer ?? "").trim();

        // 안전 필터에 걸리면 200 인데 글자가 비어 온다. 빈 말풍선은 고장으로 보인다
        if (text.length === 0) return { ok: false, reason: "no-hits" };

        /* 같은 요리의 후기가 다섯 건 다 걸릴 수 있다. 그때 출처를 다섯 줄
           늘어놓으면 근거가 많아 보이지만 실은 글 하나다 */
        return { ok: true, text, sources: foldSources(out.docs.map(refOf)) };
      } catch (error) {
        return { ok: false, reason: whyFailed(error) };
      }
    },
  };
}

/** 파이프라인이 던진 오류를 우리가 쓰기로 한 낱말로 바꾼다 */
function whyFailed(error: unknown): Exclude<ChainAnswer, { ok: true }>["reason"] {
  const text = error instanceof Error ? error.message : String(error);

  // 아직 아무것도 안 올린 인덱스는 칸(namespace)이 없어서 404 가 온다
  if (/404|not found|namespace/i.test(text)) return "empty-index";

  if (/401|403|unauthorized|api key|permission/i.test(text)) return "key";
  if (/429|quota|rate limit|resource_exhausted/i.test(text)) return "too-many";

  return "unreachable";
}
