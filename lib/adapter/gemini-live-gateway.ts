/**
 * 어댑터 · 제미나이 라이브와 웹소켓으로 말을 주고받는 진짜 방법.
 *
 * 유스케이스가 적어 둔 LiveVoiceGateway 약속을 채워 준다.
 * 웹소켓 주소, 메시지 모양, 소리 형식 — 제미나이가 정한 규격을 아는 파일은 여기뿐이다.
 *
 * 보통 REST 와 다른 점 하나. 여기서는 **키를 주소에 실을 수밖에 없다.**
 * 웹소켓은 브라우저에서 머리말을 붙일 길이 없기 때문이다.
 * 그래서 키가 브라우저 기록에 남을 수 있다는 것을 알고 써야 한다.
 */

import { fromBase64, toBase64 } from "@/lib/adapter/browser-audio";
import { LIVE_MODEL } from "@/lib/domain/gemini-model";
import type { VoiceGender, VoiceTone } from "@/lib/domain/voice-tone";
import {
  cookingBrief,
  type CookBrief,
  type LiveEvent,
  type LiveSession,
  type LiveVoiceGateway,
} from "@/lib/usecase/cook-along";

/** 제미나이 라이브의 웹소켓 주소 */
const WS_ROOT =
  "wss://generativelanguage.googleapis.com/ws/" +
  "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

/**
 * 성별과 말투마다 쓸 목소리.
 *
 * 제미나이가 미리 만들어 둔 목소리 중에서 고른다. 우리가 정한 여섯 갈래를
 * 그쪽 이름에 이어 붙이는 표다 — 이 대응을 아는 곳도 어댑터여야 한다.
 *
 * 성별은 제미나이가 문서로 못 박아 둔 값이 아니라, 들어 보고 우리가 붙인 이름이다.
 * 그래서 화면에서도 "여성 목소리" 라고만 하고 더 단정하지 않는다.
 */
export const voiceFor: Record<VoiceGender, Record<VoiceTone, string>> = {
  female: {
    // 또박또박한 쪽
    calm: "Kore",
    // 밝은 쪽
    bright: "Leda",
    // 부드러운 쪽
    soft: "Aoede",
  },
  male: {
    calm: "Charon",
    bright: "Puck",
    soft: "Orus",
  },
};

/** 서버가 보내오는 메시지 중 우리가 읽는 부분만 적어 둔다 */
type ServerMessage = {
  /** 준비가 끝났다는 신호 */
  setupComplete?: unknown;
  serverContent?: {
    /** 안내 목소리와 글이 담겨 오는 자리 */
    modelTurn?: { parts?: { inlineData?: { data?: string }; text?: string }[] };
    /** 사람이 한 말을 글로 옮긴 것 */
    inputTranscription?: { text?: string };
    /** 안내가 한 말을 글로 옮긴 것 */
    outputTranscription?: { text?: string };
    /** 사람이 말을 끊었다 */
    interrupted?: boolean;
    /** 한 차례가 끝났다 */
    turnComplete?: boolean;
  };
};

/**
 * 키를 쥔 게이트웨이를 하나 만들어 준다.
 *
 * 미리 만들어 두고 돌려쓰지 않는다. 사람이 키를 바꾸면 새로 만들어야 한다.
 */
// [F1][함수] geminiLiveGateway(apiKey): 키를 쥔 실시간 말동무 게이트웨이를 만든다
// 입력: apiKey → 출력: LiveVoiceGateway (open 하나)
export function geminiLiveGateway(apiKey: string): LiveVoiceGateway {
  return {
    // [F2][함수] open(brief, onEvent): 웹소켓을 열고 말동무를 붙인다
    // 입력: brief(recipe·gender·tone) + onEvent(일이 생길 때 부를 함수)
    // 처리: 웹소켓 연결 → setup 전송 → 이벤트를 onEvent 로 흘려보냄
    // 출력: LiveSession (setupComplete 를 받은 뒤에야 resolve 된다)
    open(brief: CookBrief, onEvent: (e: LiveEvent) => void): Promise<LiveSession> {
      return new Promise((resolve, reject) => {
        // 웹소켓은 머리말을 못 붙여서 키를 주소에 싣는다
        // [F3][외부] ▷ WebSocket 열기(generativelanguage BidiGenerateContent). 키를 주소에 싣는다
        const ws = new WebSocket(`${WS_ROOT}?key=${encodeURIComponent(apiKey)}`);

        /* 소리를 바이트 그대로 주고받는다. 이걸 안 정해 두면 브라우저가
           오는 값을 Blob 으로 감싸서, 읽을 때마다 기다려야 한다 */
        ws.binaryType = "arraybuffer";

        /* 아직 준비가 안 끝났는지. 준비 전에 소리를 보내면 그냥 버려진다.
           그래서 setupComplete 를 받고 나서야 손잡이를 넘긴다 */
        let ready = false;

        /* 글로 옮긴 말이 조각조각 온다. 한 조각씩 올리면 글자가 하나씩 따로 쌓여
           읽을 수 없다. 그래서 한 마디가 끝날 때까지 모은다 */
        let mine = "";
        let theirs = "";

        /*
         * 사람 말이 멎기를 기다리는 시계.
         *
         * 사람이 한 마디를 끝냈다는 신호가 따로 없다. turnComplete 는 **모델의**
         * 차례가 끝났다는 뜻이라 못 쓴다 — 모델에게 "짧은 명령에는 대꾸하지 마라" 고
         * 일러 두었으므로, 그 신호를 기다리면 영영 안 온다.
         * 그러면 모아 둔 말이 안 비워져서 다음 말이 "다음다음" 처럼 이어 붙고,
         * 두 번째부터는 아무 명령도 안 걸린다. 실제로 그 일이 났다.
         *
         * 그래서 0.7초 동안 더 안 들어오면 한 마디가 끝난 것으로 본다.
         */
        let settle = 0;

        /** 사람이 한 마디를 끝냈다. 올려 보내고 자리를 비운다 */
        // [F4][함수] flushMine(): 모아 둔 사람 말을 한 마디로 올려 보낸다
        // 입력: mine(모듈 안 변수) → 처리: trim 후 비움 → 출력: onEvent({kind:'said', who:'me'})
        const flushMine = () => {
          // 기다리던 시계가 있으면 거둔다
          window.clearTimeout(settle);
          settle = 0;

          const text = mine.trim();

          /* 비우는 일이 먼저다. 아래에서 받는 쪽이 곧바로 또 말을 걸 수 있는데,
             그때까지 옛 말이 남아 있으면 다음 마디에 들러붙는다 */
          mine = "";

          if (text) onEvent({ kind: "said", said: { who: "me", text } });
        };

        /** 안내가 한 차례를 끝냈다 */
        // [F5][함수] flushTheirs(): 모아 둔 안내 말을 한 마디로 올려 보낸다
        // 입력: theirs → 처리: trim 후 비움 → 출력: onEvent({kind:'said', who:'cook'})
        const flushTheirs = () => {
          const text = theirs.trim();
          theirs = "";

          if (text) onEvent({ kind: "said", said: { who: "cook", text } });
        };

        // [F6][함수] ws.onopen: 이어지자마자 setup 을 한 번 보낸다 (이벤트 핸들러)
        // [F6][호출] brief → cookingBrief(usecase/cook-along) → systemInstruction
        // [F6][외부] {model, 목소리, systemInstruction, 전사 켜기} ▷ ws.send()
        ws.onopen = () => {
          // 이어지자마자 "이런 자세로 이런 요리를 도와 달라" 고 한 번 알려 준다
          ws.send(
            JSON.stringify({
              setup: {
                // 모델 이름은 도메인이 쥐고 있다. 여기서 또 적으면 두 군데가 된다
                model: `models/${LIVE_MODEL}`,
                generationConfig: {
                  // 소리로 답해 달라고 못 박는다
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: voiceFor[brief.gender][brief.tone],
                      },
                    },
                  },
                },
                // 처음에 한 번 건네는 말. 레시피가 통째로 여기 들어간다
                systemInstruction: { parts: [{ text: cookingBrief(brief) }] },
                /* 오간 말을 글로도 받아 본다. 이걸 안 켜면 화면의 "주고받은 말" 이
                   늘 비어 있고, 타이머를 걸어 달라는 말도 알아챌 수 없다 */
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            }),
          );
        };

        // [F7][함수] ws.onmessage: 서버가 보낸 것을 갈래별로 나눠 onEvent 로 흘린다 (이벤트 핸들러)
        // 입력: e.data(글자 또는 바이트) → 처리: JSON 파싱 → 종류별 분기 → 출력: onEvent 호출
        ws.onmessage = async (e: MessageEvent) => {
          /* 서버가 글자로 보낼 때도 있고 바이트로 보낼 때도 있다.
             바이트로 오면 글자로 풀어야 JSON 으로 읽을 수 있다 */
          const raw =
            typeof e.data === "string"
              ? e.data
              : await new Blob([e.data as ArrayBuffer]).text();

          let msg: ServerMessage;
          try {
            msg = JSON.parse(raw);
          } catch {
            // 못 읽는 메시지는 조용히 버린다. 여기서 끊으면 요리가 멈춘다
            return;
          }

          // 준비가 끝났다. 이제야 손잡이를 넘겨준다
          // [F8][분기] setupComplete 이고 아직 준비 전 → true: ready=true, open 알림, session resolve
          // 준비 전에 소리를 보내면 그냥 버려지므로 여기서야 손잡이를 넘긴다
          if (msg.setupComplete && !ready) {
            ready = true;
            onEvent({ kind: "open" });
            resolve(session);
            return;
          }

          const content = msg.serverContent;
          if (!content) return;

          // 사람이 말을 끊었다. 틀던 소리를 버려야 말이 겹치지 않는다
          // [F9][분기] interrupted → 스피커에 '틀던 소리를 버려라' 를 알린다
          if (content.interrupted) onEvent({ kind: "interrupted" });

          /* 사람이 한 말은 조각조각 온다. 모아 두고, 더 안 들어오면 그때 한 마디로 친다 */
          // [F10][분기] 사람 말 조각이 옴 → mine 에 이어 붙이고 0.7초 시계를 다시 건다
          // 시계가 끝나면 flushMine(F4) 이 한 마디로 올린다
          if (content.inputTranscription?.text) {
            mine += content.inputTranscription.text;

            // 아직 더 올 수 있으니 앞서 걸어 둔 판정을 미룬다
            window.clearTimeout(settle);
            settle = window.setTimeout(flushMine, 700);
          }

          // 안내가 한 말은 다 끝나고 한 번에 올려도 된다. 화면에 쌓기만 하는 값이다
          if (content.outputTranscription?.text) theirs += content.outputTranscription.text;

          // 안내 목소리 조각을 그때그때 스피커로 넘긴다. 모아 두면 말이 늦는다
          // [F11][반복] 안내 목소리 조각들을 훑으며 onEvent({kind:'audio'}) 로 그때그때 넘긴다
          for (const part of content.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              onEvent({ kind: "audio", pcm: fromBase64(part.inlineData.data) });
            }
          }

          /* 한 차례가 끝났으면 안내가 한 말을 올린다.
             사람이 한 말은 기다리지 않고 위에서 알아서 올라간다 —
             다만 아직 안 올라간 것이 남아 있으면 이참에 같이 올린다 */
          // [F12][분기] 모델 차례가 끝남 → 남은 사람 말(F4)과 안내 말(F5)을 올린다
          if (content.turnComplete) {
            if (mine.trim()) flushMine();
            flushTheirs();
          }
        };

        // [F13][에러] 웹소켓 오류(까닭은 브라우저가 감춘다) → 아직 준비 전이면 reject
        ws.onerror = () => {
          /* 웹소켓은 왜 실패했는지 알려 주지 않는다 — 브라우저가 일부러 감춘다.
             키가 틀려도, 인터넷이 끊겨도 똑같이 여기로 온다.
             아직 준비 전이면 열지 못한 것이니 기다리던 쪽에 알린다 */
          if (!ready) reject(new Error("live-open-failed"));
        };

        // [F14][에러] 끊김 → 1007·1008 이면 'key', 그 밖이면 'unreachable'/'closed' 로 onEvent
        ws.onclose = (e) => {
          /* 1007·1008 은 "보낸 것이 잘못됐다" 는 뜻이라 대개 키 문제다.
             그 밖에는 그냥 끊긴 것으로 본다 */
          const problem = !ready
            ? e.code === 1007 || e.code === 1008
              ? "key"
              : "unreachable"
            : "closed";

          onEvent({ kind: "closed", problem });

          // 열리기도 전에 닫혔으면 기다리던 쪽을 풀어 준다
          if (!ready) reject(new Error("live-closed"));
        };

        // [F15][함수] session: 이어진 뒤에 쓰는 손잡이 (send·say·close)
        const session: LiveSession = {
          // [F16][함수] send(pcm): 마이크 소리 한 조각을 보낸다
          // 입력: pcm(Int16Array) → 처리: base64 로 옮김 → 출력: ▷ ws.send(realtimeInput)
          send(pcm: Int16Array) {
            // 아직 준비가 안 됐거나 이미 닫혔으면 보내 봐야 버려진다
            if (!ready || ws.readyState !== WebSocket.OPEN) return;

            ws.send(
              JSON.stringify({
                realtimeInput: {
                  audio: {
                    // 16비트 정수를 바이트로 보고 base64 로 옮긴다
                    data: toBase64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength)),
                    // 초당 칸 수를 함께 적어 줘야 제미나이가 제 속도로 읽는다
                    mimeType: "audio/pcm;rate=16000",
                  },
                },
              }),
            );
          },

          // [F17][함수] say(text): 글로 한마디 건넨다(걸음 읽기 지시문이 여기로 온다)
          // 입력: text → 처리: clientContent 로 감쌈 → 출력: ▷ ws.send()
          say(text: string) {
            if (!ready || ws.readyState !== WebSocket.OPEN) return;

            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [{ role: "user", parts: [{ text }] }],
                  // 이 말로 내 차례가 끝났다고 알린다. 안 적으면 계속 기다린다
                  turnComplete: true,
                },
              }),
            );
          },

          // [F18][함수] close(): 시계를 거두고 웹소켓을 닫는다
          close() {
            // 기다리던 시계를 거둔다. 안 거두면 끊은 뒤에 말이 한 번 더 올라간다
            window.clearTimeout(settle);

            // 이미 닫혔으면 또 닫지 않는다
            if (ws.readyState === WebSocket.OPEN) ws.close();
          },
        };
      });
    },
  };
}

/**
 * 목소리 미리 듣기.
 *
 * 요리용 세션과 따로 두는 까닭 — 저쪽은 레시피를 통째로 들고 마이크까지 물린다.
 * 여기서는 한 문장만 읽히고 곧바로 끊으면 된다. 같은 함수로 억지로 묶으면
 * 레시피가 없는 화면에서 부를 수가 없다.
 *
 * 돌려주는 함수를 부르면 도중에라도 끊는다. 사람이 다른 목소리를 연달아 눌렀을 때
 * 앞엣것을 끊지 않으면 둘이 겹쳐서 들린다.
 */
// [F19][함수] previewVoice(apiKey, gender, tone, line, onAudio, onDone): 한 문장만 읽힌다
// 입력: 키 + 성별 + 말투 + 읽을 문장 + 소리 콜백 + 끝 콜백
// 처리: 웹소켓 열기 → setup(목소리만) → 문장 전송 → 소리 조각을 onAudio 로
// 출력: 끊는 함수 (setup-picker 의 미리 듣기, cook-shell 의 스피커 단추가 쓴다)
export function previewVoice(
  apiKey: string,
  gender: VoiceGender,
  tone: VoiceTone,
  line: string,
  onAudio: (pcm: Uint8Array) => void,
  onDone: (problem?: "key" | "unreachable") => void,
): () => void {
  // [F20][외부] ▷ WebSocket 열기. 요리용 세션과 달리 레시피도 마이크도 안 붙인다
  const ws = new WebSocket(`${WS_ROOT}?key=${encodeURIComponent(apiKey)}`);
  ws.binaryType = "arraybuffer";

  /* 한 번만 알리려고 둔다. 다 읽고 나서 닫으면 onclose 로 또 불리기 때문이다 */
  let told = false;
  // [F21][함수] done(problem): 한 번만 끝을 알린다
  // 입력: problem → 처리: told 로 두 번 알리는 것을 막음 → 출력: onDone 호출
  const done = (problem?: "key" | "unreachable") => {
    if (told) return;
    told = true;
    onDone(problem);
  };

  // [F22][함수] ws.onopen: 목소리만 정한 setup 을 보낸다 (이벤트 핸들러)
  // [F22][외부] {목소리 이름, '따옴표 안만 읽어라' 지시} ▷ ws.send()
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        setup: {
          model: `models/${LIVE_MODEL}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceFor[gender][tone] } },
            },
          },
          /* 미리 듣기에서도 군말을 막아야 한다. 안 그러면 "네, 들려드릴게요" 부터 나온다 */
          systemInstruction: {
            parts: [
              {
                text: "따옴표 안의 문장만 그대로 소리 내어 읽어라. 앞에도 뒤에도 다른 말을 붙이지 마라.",
              },
            ],
          },
        },
      }),
    );
  };

  // [F23][함수] ws.onmessage: setupComplete 를 받으면 문장을 보내고, 소리 조각을 onAudio 로
  ws.onmessage = async (e: MessageEvent) => {
    const raw =
      typeof e.data === "string" ? e.data : await new Blob([e.data as ArrayBuffer]).text();

    let msg: ServerMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // 준비가 끝났으면 읽을 문장을 건넨다
    // [F24][분기] setupComplete → true: 읽을 문장을 clientContent 로 ▷ ws.send() 후 return
    if (msg.setupComplete) {
      ws.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: `"${line}"` }] }],
            turnComplete: true,
          },
        }),
      );
      return;
    }

    // 소리 조각을 그때그때 넘긴다
    // [F25][반복] 소리 조각들을 훑으며 onAudio(pcm) 로 넘긴다 → 스피커가 이어 튼다
    for (const part of msg.serverContent?.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) onAudio(fromBase64(part.inlineData.data));
    }

    // 다 읽었으면 끊는다. 미리 듣기는 한 문장이면 끝이다
    // [F26][분기] 한 문장을 다 읽음 → done() 호출 후 웹소켓을 닫는다
    if (msg.serverContent?.turnComplete) {
      done();
      ws.close();
    }
  };

  // [F27][에러] 오류 → done('unreachable') → 부르는 쪽이 브라우저 목소리로 내려간다
  ws.onerror = () => done("unreachable");

  // [F28][에러] 끊김 → 1007·1008 이면 'key', 아니면 'unreachable'
  ws.onclose = (e) => {
    // 1007·1008 은 "보낸 것이 잘못됐다" 는 뜻이라 대개 키 문제다
    done(e.code === 1007 || e.code === 1008 ? "key" : "unreachable");
  };

  // [F29][반환] 끊는 함수 → setup-picker·cook-shell 이 다음 것을 누를 때 앞엣것을 끊는다
  return () => {
    told = true;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
  };
}
