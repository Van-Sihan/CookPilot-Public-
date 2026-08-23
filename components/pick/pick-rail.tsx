"use client";

/**
 * 음성 화면 왼쪽 기둥 — 답변 속도, 도구, 내 요리 서재, 서재 백업, 정리 단추.
 *
 * 값을 담아 두고 꺼내는 일은 전부 유스케이스에 맡긴다. 이 파일은 어디에 무엇을
 * 놓을지와, 눌렀을 때 어느 유스케이스를 부를지만 안다.
 * localStorage 라는 말은 여기 한 번도 안 나온다.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { Icon } from "@/components/icons";
import { MeasureTool } from "@/components/pick/measure-tool";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import type { AnswerSpeed } from "@/lib/domain/gemini-model";
import { forgetSavedKey } from "@/lib/usecase/enter-with-api-key";
import { forgetCookSetup, type CookSetup } from "@/lib/usecase/choose-cook-setup";
import {
  emptyShelf,
  makeShelfBackup,
  restoreShelfBackup,
} from "@/lib/usecase/keep-recipe-shelf";
import {
  answerSpeedCards,
  backupFileName,
  backupMessages,
  railCopy,
  setupCopy,
  site,
} from "@/lib/site-content";

/** 기둥이 밖에서 받아야 하는 것들. 값은 위쪽 껍데기가 한곳에서 쥐고 있다 */
type Props = {
  /** 지금 골라 둔 목소리·속도 */
  setup: CookSetup;
  /** 속도를 바꿨을 때 알릴 곳 */
  onSpeed: (speed: AnswerSpeed) => void;
  /** 서재에 꽂힌 권수 */
  books: number;
  /** 이번 방문에 몇 번 물었는지 */
  asked: number;
  /** "전부 지우기" 를 눌렀을 때 껍데기가 함께 치워야 할 것들 */
  onWipe: () => void;
};

export function PickRail({ setup, onSpeed, books, asked, onWipe }: Props) {
  /* 백업을 하다 걸렸거나 잘 끝났을 때 띄우는 한 줄. 할 말이 없으면 null */
  const [note, setNote] = useState<string | null>(null);

  /* 눈에 안 보이게 숨겨 둔 파일 고르기 칸. 단추를 누르면 이 칸을 대신 누른다.
     파일 고르기 칸은 브라우저마다 생김새가 제각각이라 그대로 두면 기둥이 지저분해진다 */
  const fileRef = useRef<HTMLInputElement>(null);

  function onBackupSave() {
    /* 백업 글자를 만드는 것까지가 유스케이스 몫이다 */
    const text = makeShelfBackup(browserRecipeShelfStore);

    /* 글자를 파일처럼 다루려면 브라우저가 쥘 수 있는 덩어리로 감싸야 한다 */
    const blob = new Blob([text], { type: "application/json" });

    /* 그 덩어리를 가리키는 임시 주소를 얻는다. 서버에 올리지 않고 브라우저 안에서 끝난다 */
    const url = URL.createObjectURL(blob);

    /* 내려받기는 링크를 눌러야 시작된다. 화면에 안 붙인 링크를 만들어 대신 눌러 준다 */
    const a = document.createElement("a");

    // 아까 얻은 임시 주소를 가리키게 하고
    a.href = url;

    // download 를 붙여야 열지 않고 내려받는다. 여기 적은 이름이 파일 이름이 된다
    a.download = backupFileName;

    // 사람이 누른 것과 똑같은 일이 벌어진다
    a.click();

    /* 임시 주소는 놓아 주지 않으면 탭을 닫을 때까지 메모리에 남는다 */
    URL.revokeObjectURL(url);

    /* 몇 권을 내려받았는지 알려 준다. 빈 서재를 내려받고 당황하는 일을 막는다 */
    setNote(books + "권을 파일로 내려받았습니다.");
  }

  function onBackupPick(e: React.ChangeEvent<HTMLInputElement>) {
    /* 고르기 창을 열었다가 그냥 닫으면 파일이 없다 */
    const file = e.target.files?.[0];
    if (!file) return;

    /* 파일 읽기는 시간이 걸리는 일이라 다 읽은 뒤에 이어서 한다 */
    file.text().then((text) => {
      /* 파일이 멀쩡한지 보고 서재를 갈아 끼우는 일은 통째로 유스케이스가 한다 */
      const result = restoreShelfBackup(text, browserRecipeShelfStore);

      /* 걸렸으면 서재는 그대로 두고 까닭만 알려 준다 */
      if (!result.ok) {
        setNote(backupMessages[result.reason]);
        return;
      }

      /* 잘됐으면 몇 권이 들어왔는지 알려 준다 */
      setNote(result.count + "권을 되돌렸습니다.");
    });

    /* 같은 파일을 두 번 고르면 값이 안 바뀌어서 이 함수가 다시 안 불린다.
       그래서 읽고 나면 칸을 비워 둔다 */
    e.target.value = "";
  }

  function onWipeAll() {
    /* 되돌릴 수 없는 일이라 한 번 더 물어본다 */
    const sure = window.confirm(
      "담아 둔 키, 고른 목소리, 서재를 이 브라우저에서 모두 지웁니다. 계속할까요?",
    );

    // 아니라고 하면 아무것도 건드리지 않는다
    if (!sure) return;

    /* 셋을 각각 다른 유스케이스가 맡고 있어서 하나씩 부른다 */
    forgetSavedKey(browserApiKeyStore);
    forgetCookSetup(browserCookSetupStore);
    emptyShelf(browserRecipeShelfStore);

    /* 질문 횟수처럼 껍데기가 쥐고 있는 값은 껍데기가 치운다 */
    onWipe();

    /* 무엇이 지워졌는지 알려 준다 */
    setNote("이 브라우저에 담아 둔 것을 모두 지웠습니다.");
  }

  return (
    // 본문 옆에 붙는 딸림 영역이라 aside 로 둔다
    <aside className="rail">
      {/* 로고와 이름. 어느 화면에서나 같은 차례로 붙어 다닌다 */}
      <div className="rail-mast">
        {/* 이름이 겹치지 않게 이 화면 이름을 넘겨준다 */}
        <Logo size={62} id="rail" />

        {/* 한글 이름 */}
        <p className="rail-name">{site.nameKo}</p>

        {/* 그 밑을 도장처럼 받치는 영어 이름 */}
        <p className="rail-mark">{site.name}</p>
      </div>

      {/* ---------- 답변 속도 ---------- */}
      <div className="rail-block">
        {/* 라디오 단추 묶음이라 무엇을 고르는 자리인지 밝혀 준다 */}
        <fieldset>
          {/* 묶음 이름이자 이 칸의 작은 제목. 고르기 화면과 같은 말을 쓴다 */}
          <legend className="rail-head">{setupCopy.speedLabel}</legend>

          {answerSpeedCards.map((card) => (
            // 줄 전체가 이름표라 어디를 눌러도 골라진다
            <label className="rail-radio" key={card.id}>
              <input
                // 둘 중 하나만 골라지게 이름을 같이 쓴다
                type="radio"
                name="rail-speed"
                className="sr-only"
                // 담아 둔 값이 이 칸일 때만 눌린 모습이 된다
                checked={setup.speed === card.id}
                // 바꾸면 위쪽 껍데기가 담아 두고, 담긴 값이 다시 이 칸을 그린다
                onChange={() => onSpeed(card.id)}
              />

              {/* 진짜 라디오는 숨겨 놨으니 이 동그라미가 대신 보인다 */}
              <span className="rail-radio-dot" aria-hidden="true" />

              {/* 사람이 고르는 말 */}
              {card.name}

              {/* 어떤 모델인지 짧게 덧붙인다. 긴 모델 이름은 칸을 넘겨서 별명만 쓴다 */}
              <span className="rail-radio-badge">({card.badge})</span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* ---------- 도구 ---------- */}
      <div className="rail-block">
        {/* 이 묶음의 제목 */}
        <p className="rail-head">{railCopy.tools}</p>

        {/* 자바스크립트 없이 열고 닫히는 접이칸 */}
        <details className="rail-fold">
          <summary>
            {/* 열리면 아래를 보도록 돌아가는 화살표 */}
            <i className="rail-arrow" aria-hidden="true" />

            {/* 저울 그림. 계량 이야기라 저울이 맞다 */}
            <span className="rail-fold-ico" aria-hidden="true">
              <Icon name="scale" size={16} />
            </span>
            {railCopy.measure}
          </summary>

          {/* 펼쳤을 때 나오는 환산 도구 */}
          <MeasureTool />
        </details>
      </div>

      {/* ---------- 내 요리 서재 ---------- */}
      <div className="rail-block">
        {/* 이 묶음의 제목 */}
        <p className="rail-head">{railCopy.shelf}</p>

        {/* 지금 몇 권인지. 0권이어도 숨기지 않는다 — 아직 아무것도 없다는 것도 알려 줄 일이다 */}
        <p className="rail-count">레시피 {books}권이 꽂혀 있습니다</p>

        {/* 서재 화면으로 간다 */}
        <Link className="btn btn-line btn-sm rail-btn" href="/shelf">
          {/* 책 그림 */}
          <span className="rail-btn-ico" aria-hidden="true">
            <Icon name="book" size={16} />
          </span>
          {railCopy.shelfOpen}
        </Link>

        {/* 백업은 접어 둔다. 자주 쓰는 일이 아니라 늘 펼쳐 둘 자리가 아깝다 */}
        <details className="rail-fold">
          <summary>
            {/* 열리면 아래를 보도록 돌아가는 화살표 */}
            <i className="rail-arrow" aria-hidden="true" />
            {railCopy.backup}
          </summary>

          {/* 펼쳤을 때 나오는 단추 두 개와 안내 */}
          <div className="rail-fold-body">
            {/* 지금 서재를 파일 하나로 내려받는다 */}
            <button
              className="btn btn-line btn-sm rail-btn"
              type="button"
              onClick={onBackupSave}
            >
              {railCopy.backupSave}
            </button>

            {/* 내려받아 둔 파일을 도로 넣는다. 진짜 고르기 칸은 아래 숨겨 두었다 */}
            <button
              className="btn btn-line btn-sm rail-btn"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              {railCopy.backupLoad}
            </button>

            <input
              // 위 단추가 대신 눌러 주는 진짜 파일 고르기 칸
              ref={fileRef}
              type="file"
              /* JSON 만 보이게 걸러 준다. 그래도 다른 파일을 고를 수 있으니 검사는 도메인이 한다 */
              accept="application/json,.json"
              className="sr-only"
              // 파일을 고르면 위에 적어 둔 함수가 움직인다
              onChange={onBackupPick}
            />

            {/* 서재가 브라우저 안에만 있다는 것을 알려 둔다. 기기를 바꾸면 안 따라간다 */}
            <p className="rail-note">
              서재는 이 브라우저 안에만 있습니다. 다른 기기에서 이어 보시려면 파일로
              옮겨 주세요.
            </p>
          </div>
        </details>
      </div>

      {/* ---------- 이번 방문 기록과 정리 ---------- */}
      <div className="rail-block rail-foot">
        {/* 이번에 몇 번 물었는지. 새로 고치면 0 으로 돌아간다 */}
        <p className="rail-asked">
          {railCopy.asked} {asked}회
        </p>

        {/* 담아 둔 것을 전부 버린다. 되돌릴 수 없어서 누르면 한 번 더 물어본다 */}
        <button
          className="btn btn-line btn-sm rail-btn"
          type="button"
          onClick={onWipeAll}
        >
          {railCopy.wipe}
        </button>

        {/* 다른 키로 갈아 끼우러 가는 길. 키를 지우는 일은 시작 화면이 맡는다 */}
        <Link className="btn btn-line btn-sm rail-btn" href="/start">
          {railCopy.rekey}
        </Link>

        {/* 백업이나 정리 결과를 알리는 한 줄. 나타나는 순간 읽어 주는 기계가 알려 준다 */}
        {note && (
          <p className="rail-msg" role="status">
            {note}
          </p>
        )}
      </div>
    </aside>
  );
}
