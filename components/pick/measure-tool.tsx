"use client";

/**
 * 왼쪽 메뉴의 계량 환산 접이칸.
 *
 * 셈은 한 줄도 여기 없다. 도메인의 convertMeasure 를 부르고 결과만 그린다.
 * 컵이 몇 밀리리터인지 같은 것은 나라마다 달라서, 그런 규칙은 도메인에 두어야
 * 나중에 미국식을 더할 때 화면을 안 건드린다.
 */

import { useState } from "react";
import {
  convertMeasure,
  measureUnits,
  resolveMeasureUnit,
  type MeasureUnit,
} from "@/lib/domain/measure";
import { measureUnitLabels } from "@/lib/site-content";

// [F1][함수] MeasureTool(): 계량 단위를 바꿔 보는 작은 도구
// 입력: 없음 → 처리: 적은 분량과 두 단위를 도메인에 넘겨 셈 → 출력: 화면(JSX)
export function MeasureTool() {
  /* 입력칸에 적혀 있는 글자. 숫자로 바꾸지 않고 글자 그대로 쥐고 있어야
     "1." 처럼 아직 덜 적은 상태에서도 글자가 튀지 않는다 */
  // [F2][흐름] 입력칸 글자 → amount / 고른 단위 → from, to (셋 다 브라우저 상태)
  const [amount, setAmount] = useState("1");

  /* 어느 단위에서 */
  const [from, setFrom] = useState<MeasureUnit>("cup");

  /* 어느 단위로 */
  const [to, setTo] = useState<MeasureUnit>("ml");

  /* 셈 결과. 숫자로 못 읽는 값이면 도메인이 null 을 돌려준다 */
  // [F3][호출] Number(amount) + from + to → convertMeasure(domain/measure:F2) → result
  // [F3][분기] result 가 null(숫자가 아니거나 음수) → 화면이 셈 결과 자리를 비운다
  const result = convertMeasure(Number(amount), from, to);

  return (
    <div className="ms">
      {/* 분량과 "어느 단위에서" 를 한 줄에 둔다 */}
      <div className="ms-row">
        {/* 이름표는 눈에 안 보이게 숨긴다. 칸이 좁아 글씨를 더 얹을 자리가 없다 */}
        <label className="sr-only" htmlFor="ms-amount">
          바꿀 분량
        </label>
        <input
          // 바로 위 이름표와 짝을 맞추는 이름
          id="ms-amount"
          className="ms-input"
          /* 휴대폰에서 숫자판이 먼저 뜨게 한다. type="number" 는 화살표가 붙고
             소수점 입력이 브라우저마다 달라서 안 쓴다 */
          inputMode="decimal"
          // 적힌 글자를 위쪽 값이 쥐고 있다
          value={amount}
          // 글자가 바뀌면 그대로 담아 둔다. 걸러 내는 일은 도메인이 한다
          onChange={(e) => setAmount(e.target.value)}
        />

        <label className="sr-only" htmlFor="ms-from">
          바꾸기 전 단위
        </label>
        <select
          id="ms-from"
          className="ms-select"
          value={from}
          /* 목록에서 고른 값이라 늘 맞지만, 그래도 도메인을 한 번 거쳐서 받는다 */
          onChange={(e) => setFrom(resolveMeasureUnit(e.target.value))}
        >
          {/* [F4][반복] measureUnits 를 훑어 '어느 단위에서' 목록을 그린다 */}
          {measureUnits.map((u) => (
            // 속이름을 값으로 쓰고, 보이는 글씨는 site-content 가 정한다
            <option key={u} value={u}>
              {measureUnitLabels[u]}
            </option>
          ))}
        </select>
      </div>

      {/* 아래로 흐른다는 표시. 꾸미기용이라 읽어 주는 기계에는 숨긴다 */}
      <p className="ms-arrow" aria-hidden="true">
        ↓
      </p>

      {/* 결과와 "어느 단위로" 를 한 줄에 둔다 */}
      <div className="ms-row">
        {/* 사람이 고칠 수 없는 자리라 입력칸이 아니라 그냥 글씨다 */}
        <p className="ms-out">
          {/* 못 읽는 값이면 숫자 대신 줄표를 놓는다. 0 을 띄우면 셈이 된 것처럼 보인다 */}
          {result === null ? "—" : result}
        </p>

        <label className="sr-only" htmlFor="ms-to">
          바꾼 뒤 단위
        </label>
        <select
          id="ms-to"
          className="ms-select"
          value={to}
          onChange={(e) => setTo(resolveMeasureUnit(e.target.value))}
        >
          {/* [F5][반복] measureUnits 를 훑어 '어느 단위로' 목록을 그린다 */}
          {measureUnits.map((u) => (
            <option key={u} value={u}>
              {measureUnitLabels[u]}
            </option>
          ))}
        </select>
      </div>

      {/* 왜 g 이 없는지 미리 알려 둔다. 없는 기능을 찾아 헤매지 않게 하려는 것이다 */}
    </div>
  );
}
