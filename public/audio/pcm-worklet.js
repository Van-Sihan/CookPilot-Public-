/**
 * 마이크 소리를 잘게 모아서 본 화면으로 보내 주는 일꾼.
 *
 * 이 파일은 브라우저의 **소리 전용 쓰레드**에서 돈다. 화면을 그리는 쓰레드와 따로 놀아서,
 * 화면이 잠깐 버벅여도 소리가 끊기지 않는다.
 * 예전에 쓰던 ScriptProcessorNode 는 화면 쓰레드에서 돌아 이 점이 나빴다.
 *
 * public/ 에 두는 까닭 — 워크릿은 주소로 불러야 한다(addModule). 번들에 섞을 수 없다.
 * 그래서 이 파일만 한국어 주석 규칙을 지키되 나머지 코드와 떨어져 있다.
 */

class PcmCollector extends AudioWorkletProcessor {
  constructor() {
    super();

    /* 128칸씩 오는 소리를 이만큼 모아서 한 번에 보낸다.
       128칸마다 보내면 1초에 125번 메시지를 보내게 되어 낭비가 크다.
       1024칸이면 16kHz 기준 64밀리초쯤이라, 사람이 느끼기에는 곧바로다 */
    this.chunk = 1024;

    // 아직 다 못 채운 소리를 모아 두는 자리
    this.buffer = new Float32Array(this.chunk);

    // 지금까지 몇 칸이 찼는지
    this.filled = 0;
  }

  process(inputs) {
    // 첫 번째 입력의 첫 번째 채널. 마이크는 보통 한 채널이다
    const input = inputs[0] && inputs[0][0];

    // 마이크가 잠깐 끊기면 빈 값이 온다. 그래도 일꾼은 계속 살아 있어야 하니 true 를 준다
    if (!input) return true;

    for (let i = 0; i < input.length; i += 1) {
      // 한 칸씩 옮겨 담는다
      this.buffer[this.filled] = input[i];
      this.filled += 1;

      // 다 찼으면 본 화면으로 보내고 자리를 비운다
      if (this.filled === this.chunk) {
        /* 복사본을 보낸다. 원본을 그대로 보내면 다음 소리를 담는 동안
           받는 쪽이 읽고 있어서 값이 뒤섞인다 */
        this.port.postMessage(this.buffer.slice(0));
        this.filled = 0;
      }
    }

    // false 를 주면 일꾼이 죽는다. 마이크를 끌 때까지 살려 둔다
    return true;
  }
}

// 본 화면에서 이 이름으로 불러 쓴다
registerProcessor("pcm-collector", PcmCollector);
