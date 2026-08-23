/**
 * 조리 순서를 번호 붙여 늘어놓는다.
 *
 * 장보기 화면의 오른쪽 기둥과 요리 화면의 "전체 순서 보기" 가 같은 것을 쓴다.
 * 복사해 두면 한쪽만 고치는 일이 반드시 생긴다.
 *
 * "use client" 가 없다. 움직일 것이 없어서 서버에서만 그려진다.
 */

import type { Step } from "@/lib/domain/recipe";

type Props = {
  /** 그릴 걸음들 */
  steps: readonly Step[];
  /** 지금 서 있는 걸음. 요리 화면에서만 넘긴다. 없으면 아무 데도 불이 안 들어온다 */
  now?: number;
};

// [F1][함수] RecipeSteps({steps, now}): 순서 목록을 그린다(장보기·요리 화면이 함께 쓴다)
// 입력: steps(Step[]) + now(지금 걸음, 없으면 표시 안 함) → 출력: 화면(JSX)
export function RecipeSteps({ steps, now }: Props) {
  return (
    // 순서가 정해진 목록이라 번호가 붙는 ol 을 쓴다
    <ol className="rsteps">
      {/* [F2][반복] steps 를 훑어 번호·문장·시간을 한 줄씩 그린다. i === now 면 표시를 붙인다 */}
      {steps.map((step, i) => (
        <li
          // 같은 문장이 두 번 나올 수 있어서 차례를 이름표로 쓴다. 순서가 안 바뀌니 괜찮다
          key={i}
          /* 지금 서 있는 걸음에만 불이 들어온다 */
          data-on={i === now ? "" : undefined}
          /* 읽어 주는 기계에도 지금 어디쯤인지 알려 준다 */
          aria-current={i === now ? "step" : undefined}
        >
          {/* 번호. 두 자리로 맞춰 두면 열 번째가 넘어가도 글자가 안 밀린다 */}
          <span className="rsteps-n">{String(i + 1).padStart(2, "0")}</span>

          {/* 무엇을 하는지 */}
          <span className="rsteps-t">{step.text}</span>

          {/* 시간이 걸리는 걸음에만 붙는다 */}
          {step.minutes ? <span className="rsteps-m">{step.minutes}분</span> : null}
        </li>
      ))}
    </ol>
  );
}
