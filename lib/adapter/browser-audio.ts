/**
 * 어댑터 · 브라우저로 소리를 듣고 내는 진짜 방법.
 *
 * 마이크를 열어 16kHz PCM 으로 받고, 제미나이가 보내 준 24kHz PCM 을 스피커로 낸다.
 * 왜 하필 그 숫자냐면 제미나이 라이브가 그렇게 정해 두었기 때문이다 —
 * 받는 쪽은 16kHz, 보내 주는 쪽은 24kHz 다. 이 규격을 아는 파일은 여기 하나뿐이다.
 *
 * getUserMedia·AudioContext 같은 브라우저 기능이 나오는 곳도 여기뿐이다.
 * 유스케이스와 도메인은 이런 것을 몰라야 다른 데서도 그대로 돌아간다.
 */

/** 제미나이 라이브가 받는 소리의 초당 칸 수 */
export const INPUT_RATE = 16000;

/** 제미나이 라이브가 보내 주는 소리의 초당 칸 수 */
export const OUTPUT_RATE = 24000;

/** 워크릿 파일이 놓인 자리. public/ 아래라 주소로 부른다 */
const WORKLET_URL = "/audio/pcm-worklet.js";

/** 마이크를 못 연 까닭 */
export type MicProblem = "denied" | "missing" | "failed";

/** 마이크를 열었을 때 돌려주는 손잡이 */
export type Mic = {
  /** 소리 조각이 올 때마다 부른다. 16비트 PCM 한 덩어리다 */
  onChunk(fn: (pcm: Int16Array) => void): void;
  /** 지금 소리가 얼마나 큰지(0~1). 막대 그림이 이 값을 쓴다 */
  level(): number;
  /** 지금까지 들어온 소리를 통째로 WAV 로 만든다. 한 번에 보내야 할 때 쓴다 */
  toWav(): { base64: string; mimeType: string };
  /** 마이크를 놓아 준다 */
  stop(): void;
};

/** 마이크를 연 결과 */
export type MicResult = { ok: true; mic: Mic } | { ok: false; problem: MicProblem };

/** 브라우저가 왜 거절했는지를 우리가 쓰기로 한 낱말로 바꾼다 */
function micProblem(err: unknown): MicProblem {
  // DOMException 이 아니면 뜻을 알아낼 길이 없다
  const name = err instanceof DOMException ? err.name : "";

  // 사람이 허락을 안 했거나 예전에 막아 두었다
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";

  // 마이크가 아예 없는 기기
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";

  // 다른 앱이 쥐고 있는 경우가 대부분이다
  return "failed";
}

/**
 * 마이크를 연다.
 *
 * AudioContext 를 만들 때 sampleRate 를 못 박는 것이 요점이다.
 * 이러면 브라우저가 알아서 16kHz 로 바꿔 준다 — 우리가 직접 칸을 솎아 내면
 * 소리가 거칠어지고 코드도 길어진다.
 */
export async function openMic(): Promise<MicResult> {
  /* https 가 아니거나 아주 오래된 브라우저면 이 자리가 아예 비어 있다 */
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, problem: "missing" };

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        /* 부엌은 시끄럽다. 브라우저가 해 주는 잡음·메아리 제거를 켠다.
           특히 메아리 제거를 안 켜면 스피커로 나간 안내를 마이크가 다시 주워 담아
           제미나이가 제 목소리에 대답하게 된다 */
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    return { ok: false, problem: micProblem(err) };
  }

  // 16kHz 로 달라고 못 박는다. 브라우저가 맞춰 준다
  const ctx = new AudioContext({ sampleRate: INPUT_RATE });

  try {
    // 소리 전용 쓰레드에 일꾼을 올린다. 파일을 못 찾으면 여기서 터진다
    await ctx.audioWorklet.addModule(WORKLET_URL);
  } catch {
    // 일꾼을 못 올렸으면 마이크를 놓아 주고 물러난다
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    return { ok: false, problem: "failed" };
  }

  // 마이크에서 오는 소리를 이 장치 안으로 끌어들이는 입구
  const source = ctx.createMediaStreamSource(stream);

  // 아까 올린 일꾼을 실제로 세운다
  const node = new AudioWorkletNode(ctx, "pcm-collector");

  /* 소리 크기를 재는 저울. 막대 그림에만 쓰고 제미나이로는 안 보낸다.
     보내는 소리와 그리는 소리를 같은 길로 뽑으면 한쪽이 막힐 때 둘 다 멈춘다 */
  const meter = ctx.createAnalyser();
  meter.fftSize = 256;
  meter.smoothingTimeConstant = 0.75;

  // 마이크를 일꾼과 저울 양쪽에 잇는다. 스피커에는 잇지 않는다 — 이으면 되울린다
  source.connect(node);
  source.connect(meter);

  /* 크롬은 아무 데도 안 이어진 워크릿을 쉬게 만들 때가 있다.
     소리가 0인 곳으로 이어 두면 계속 돌면서도 스피커로는 아무것도 안 나간다 */
  const mute = ctx.createGain();
  mute.gain.value = 0;
  node.connect(mute).connect(ctx.destination);

  // 저울이 값을 부어 줄 그릇. 매번 새로 만들면 쓰레기가 쌓인다
  const meterData = new Uint8Array(meter.frequencyBinCount);

  // WAV 로 만들 때 쓰려고 지나간 소리를 모아 둔다
  const kept: Int16Array[] = [];

  // 밖에서 걸어 둔 손. 아직 없으면 null
  let hand: ((pcm: Int16Array) => void) | null = null;

  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    // -1~1 짜리 소수를 16비트 정수로 옮긴다. 제미나이가 그 모양을 받는다
    const pcm = floatToPcm16(e.data);

    // 나중에 통째로 WAV 를 만들 수 있게 챙겨 둔다
    kept.push(pcm);

    // 실시간으로 보내는 쪽이 걸어 둔 손이 있으면 바로 넘긴다
    hand?.(pcm);
  };

  return {
    ok: true,
    mic: {
      onChunk(fn) {
        // 손은 하나만 걸 수 있다. 여럿이 필요해진 적이 아직 없다
        hand = fn;
      },

      level() {
        // 저울에서 지금 소리를 받아 온다
        meter.getByteFrequencyData(meterData);

        /* 사람 목소리는 낮은 쪽에 몰려 있다. 앞쪽 스무 칸만 보고 평균을 낸다 —
           전체를 보면 비어 있는 높은 쪽이 값을 끌어내린다 */
        let sum = 0;
        for (let i = 0; i < 20; i += 1) sum += meterData[i];

        // 0~255 를 0~1 로 옮긴다
        return sum / 20 / 255;
      },

      toWav() {
        // 모아 둔 조각을 하나로 잇고 WAV 머리말을 붙인다
        return { base64: wavBase64(kept, INPUT_RATE), mimeType: "audio/wav" };
      },

      stop() {
        // 더는 안 받는다
        node.port.onmessage = null;

        // 마이크를 놓아 준다. 이걸 안 하면 주소창의 빨간 점이 계속 켜져 있다
        stream.getTracks().forEach((t) => t.stop());

        // 소리 장치를 닫는다
        void ctx.close();
      },
    },
  };
}

/** -1~1 짜리 소수를 16비트 정수로 옮긴다 */
function floatToPcm16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    /* 마이크가 세면 1을 넘는 값이 온다. 그대로 곱하면 값이 넘쳐서
       가장 큰 소리가 가장 작은 소리로 뒤집힌다. 그래서 먼저 잘라 낸다 */
    const clamped = Math.max(-1, Math.min(1, input[i]));

    // 음수 쪽이 한 칸 더 넓어서 곱하는 수가 다르다
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return out;
}

/** 모아 둔 PCM 조각들을 WAV 파일 한 장으로 만들어 base64 로 돌려준다 */
function wavBase64(chunks: readonly Int16Array[], rate: number): string {
  // 전체 칸 수를 먼저 센다. 머리말에 크기를 적어야 하기 때문이다
  const total = chunks.reduce((n, c) => n + c.length, 0);

  // 머리말 44바이트 + 소리 몸통
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);

  /** 글자를 한 자씩 적어 넣는다. WAV 머리말은 자리마다 뜻이 정해져 있다 */
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(at + i, s.charCodeAt(i));
  };

  // "이 파일은 RIFF 묶음이다"
  text(0, "RIFF");
  // 이 뒤로 몇 바이트가 더 있는지. true 는 "작은 자리부터 적는다" 는 뜻이다
  view.setUint32(4, 36 + total * 2, true);
  // 그 묶음의 종류가 WAVE 다
  text(8, "WAVE");
  // 소리의 생김새를 적는 칸이 시작된다
  text(12, "fmt ");
  // 그 칸의 길이. 압축 없는 소리는 늘 16이다
  view.setUint32(16, 16, true);
  // 1은 "압축하지 않은 PCM"
  view.setUint16(20, 1, true);
  // 채널 수. 마이크 하나라 1
  view.setUint16(22, 1, true);
  // 초당 칸 수
  view.setUint32(24, rate, true);
  // 초당 바이트 수 = 칸 수 × 채널 × 2바이트
  view.setUint32(28, rate * 2, true);
  // 한 칸이 차지하는 바이트 = 채널 × 2
  view.setUint16(32, 2, true);
  // 한 칸의 비트 수
  view.setUint16(34, 16, true);
  // 여기서부터 소리 몸통이다
  text(36, "data");
  // 몸통의 길이
  view.setUint32(40, total * 2, true);

  // 조각을 차례로 옮겨 적는다
  let at = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i += 1) {
      view.setInt16(at, chunk[i], true);
      at += 2;
    }
  }

  return toBase64(new Uint8Array(buffer));
}

/**
 * 바이트를 base64 글자로 옮긴다.
 *
 * 한 번에 다 넘기지 않고 잘라서 넘기는 까닭 — String.fromCharCode 에 수십만 개를
 * 한꺼번에 넘기면 브라우저가 "인자가 너무 많다" 며 터진다. 긴 녹음에서 실제로 난다.
 */
export function toBase64(bytes: Uint8Array): string {
  // 한 번에 다룰 개수. 넉넉하면서도 안 터지는 크기다
  const step = 0x8000;
  let s = "";

  for (let i = 0; i < bytes.length; i += step) {
    s += String.fromCharCode(...bytes.subarray(i, i + step));
  }

  return btoa(s);
}

/** base64 글자를 바이트로 되돌린다. 제미나이가 보낸 소리를 풀 때 쓴다 */
export function fromBase64(s: string): Uint8Array {
  // 한 글자씩 코드로 바꾸면 그게 곧 바이트다
  const raw = atob(s);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * 제미나이가 보내 준 소리를 이어서 틀어 주는 스피커.
 *
 * 조각이 올 때마다 그냥 재생하면 서로 겹치거나 사이가 벌어져 말이 뚝뚝 끊긴다.
 * 그래서 "다음 조각은 언제 시작할지" 를 직접 세어 가며 줄을 세운다.
 */
export function openSpeaker() {
  // 제미나이가 보내 주는 초당 칸 수에 맞춘다
  const ctx = new AudioContext({ sampleRate: OUTPUT_RATE });

  /* 다음 조각이 시작될 시각. 지금까지 넣은 소리가 다 끝나는 때다.
     0 이면 아직 아무것도 안 넣었다는 뜻이다 */
  let nextAt = 0;

  /* 아직 안 끝난(또는 아직 시작도 안 한) 소리들.
     끊으라는 말을 들었을 때 이 손잡이들이 없으면 아무것도 못 멈춘다 —
     start() 로 예약해 둔 소리는 시각이 되면 알아서 나가 버린다 */
  let queued: AudioBufferSourceNode[] = [];

  return {
    /** 소리 한 조각을 줄 끝에 붙인다 */
    push(pcm: Uint8Array) {
      // 바이트를 16비트 정수로 다시 읽는다. 두 바이트가 한 칸이다
      const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
      const frames = Math.floor(pcm.byteLength / 2);

      // 빈 조각이 올 때가 있다. 넣어 봐야 할 일이 없다
      if (frames === 0) return;

      // 브라우저가 트는 소리는 -1~1 짜리 소수라 다시 옮겨야 한다
      const buf = ctx.createBuffer(1, frames, OUTPUT_RATE);
      const channel = buf.getChannelData(0);
      for (let i = 0; i < frames; i += 1) {
        // true 는 "작은 자리부터 적혀 있다" 는 뜻. 제미나이가 그렇게 보낸다
        channel[i] = view.getInt16(i * 2, true) / 0x8000;
      }

      const node = ctx.createBufferSource();
      node.buffer = buf;
      node.connect(ctx.destination);

      /* 줄이 비어 있거나 이미 지나갔으면 지금부터, 아니면 앞 조각이 끝나는 때부터.
         조금 뒤(0.05초)로 미뤄 두면 첫 조각이 잘리지 않는다 */
      const start = Math.max(ctx.currentTime + 0.05, nextAt);
      node.start(start);

      // 끊을 수 있게 손잡이를 챙겨 둔다
      queued.push(node);

      // 다 나간 것은 명단에서 뺀다. 안 그러면 튼 만큼 계속 쌓인다
      node.onended = () => {
        queued = queued.filter((n) => n !== node);
      };

      // 다음 조각은 이 조각이 끝난 뒤에 시작한다
      nextAt = start + buf.duration;
    },

    /**
     * 스피커가 막혀 있는지.
     *
     * 브라우저는 사람이 그 페이지에서 한 번도 아무것도 안 눌렀으면 소리를 막는다.
     * 앞 화면에서 단추를 눌러 넘어왔더라도 새 페이지에서는 다시 막힌 채로 시작한다.
     * 막힌 줄 모르고 두면 "말은 하는데 안 들리는" 상태가 되어 고장으로 보인다.
     */
    blocked() {
      return ctx.state === "suspended";
    },

    /** 막힌 스피커를 푼다. 사람이 뭔가를 누른 뒤에 불러야 풀린다 */
    async unblock() {
      try {
        /* 이미 열려 있는지 먼저 보지 않고 그냥 부른다. 열려 있으면 아무 일도
           안 하는 함수이고, 미리 보면 타입이 좁혀져서 아래 비교가 막힌다 */
        await ctx.resume();
      } catch {
        // 아직 아무것도 안 눌렀으면 여기서 거절당한다
      }

      return ctx.state === "running";
    },

    /**
     * 줄에 선 소리를 다 버린다.
     *
     * 사람이 말을 끊었을 때와, 사람이 "다음" 이라고 해서 화면이 먼저 넘어갈 때 쓴다.
     * 예약해 둔 소리를 하나씩 멈추는 것이 요점이다 — 시각만 되돌려 놓으면
     * 이미 예약된 소리는 그대로 다 나가서, 새 안내와 겹쳐 두 사람이 말하는 것처럼 들린다.
     */
    cut() {
      for (const node of queued) {
        try {
          node.stop();
        } catch {
          /* 아직 시작도 안 했거나 이미 끝난 소리를 멈추려 하면 오류가 난다.
             둘 다 우리가 바라던 상태이므로 그냥 넘어간다 */
        }
      }

      queued = [];

      // 다음 조각은 기다리지 말고 곧바로 나가게 한다
      nextAt = 0;
    },

    /** 스피커를 닫는다 */
    close() {
      void ctx.close();
    },
  };
}

/** 위 함수가 돌려주는 스피커의 생김새 */
export type Speaker = ReturnType<typeof openSpeaker>;
