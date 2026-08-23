/**
 * 홈 왼쪽 기둥에서 물어보기 화면으로 넘어가는 자리.
 *
 * 마이크 단추 바로 아래 둔다. 둘 다 "말을 걸어 무언가를 얻는" 길인데,
 * 위는 요리하러 부엌으로 가는 문이고 아래는 남들이 쓴 글에 물어보는 문이다.
 *
 * 움직이지 않아서 서버에서만 그려진다.
 */

import Link from "next/link";
import { Icon } from "@/components/icons";
import { askCopy } from "@/lib/ask-content";

export function AskLink() {
  return (
    <Link className="ask-door" href="/ask">
      <span className="ask-door-ico" aria-hidden="true">
        <Icon name="bot" size={20} />
      </span>

      <span className="ask-door-t">
        <strong>{askCopy.title}</strong>
        {/* 무엇에 답하는 챗봇인지 여기서 미리 못 박는다.
            들어가서야 알게 되면 엉뚱한 것을 묻고 실망한다 */}
        <span className="ask-door-sub">{askCopy.doorSub}</span>
      </span>
    </Link>
  );
}
