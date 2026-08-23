"use client";

/**
 * 프로필 사진 바꾸는 칸.
 *
 * 두 걸음으로 나뉜다.
 *   1. 브라우저가 파일을 스토리지에 곧장 올린다(줄이는 일도 브라우저가 한다)
 *   2. 다 올라간 **주소 한 줄**만 서버로 보내 프로필에 붙인다
 *
 * 파일을 서버로 보내지 않는 까닭 — 같은 파일을 두 번 나르게 되고, 올리는 동안
 * 서버 액션이 붙들려 있어 화면이 통째로 멈춘다. 안전한 것은 버킷 정책이 맡는다.
 * 로그인한 사람은 **자기 폴더에만** 올릴 수 있다.
 */

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { setPhotoAction } from "@/app/actions/post";
import { emptyPhotoState } from "@/app/actions/post-state";
import { uploadAvatar } from "@/lib/adapter/browser-avatar-upload";
import { avatarLetter } from "@/lib/domain/avatar";
import { accountCopy, photoMessages, uploadMessages } from "@/lib/write-content";

type Props = {
  /** 지금 닉네임. 사진이 없을 때 첫 글자를 딴다 */
  name: string;
  /** 지금 프로필 사진. 없으면 null */
  avatar: string | null;
};

// [F1][함수] PhotoForm({name, avatar}): 프로필 사진을 올리고 붙이는 칸
// 입력: name(첫 글자용) + avatar(지금 사진) → 처리: 브라우저가 올리고 주소만 서버로
// 출력: 화면(JSX)
export function PhotoForm({ name, avatar }: Props) {
  /* 서버로 보내고 돌아온 쪽지 */
  // [F2][흐름] useActionState(setPhotoAction) → state · action · pending
  // 폼 제출 → ▷ setPhotoAction(app/actions/post.ts:F29)
  const [state, action, pending] = useActionState(setPhotoAction, emptyPhotoState);

  /* 화면에 보이는 사진. 서버가 준 값으로 시작하고, 바꾸면 여기부터 바뀐다.
     `state.url` 을 곧바로 쓰지 않는 까닭 — 처음에는 그 값이 null 이라
     이미 있던 사진이 잠깐 사라져 보인다 */
  // [F3][흐름] 화면에 보이는 사진 → shown / 올리는 중 → busy / 올리다 걸린 말 → problem
  const [shown, setShown] = useState<string | null>(avatar);

  /* 올리는 중인지. 서버에 보내는 것과 다른 걸음이라 따로 쥔다 */
  const [busy, setBusy] = useState(false);

  /* 올리다 걸렸을 때의 말. 서버 쪽 까닭과 섞이지 않게 따로 둔다 */
  const [problem, setProblem] = useState<string | null>(null);

  /* 눈에 안 보이게 숨겨 둔 파일 고르기 칸. 단추를 누르면 이 칸을 대신 누른다.
     파일 고르기 칸은 브라우저마다 생김새가 제각각이라 그대로 두면 화면이 지저분해진다 */
  // [F4][흐름] 숨겨 둔 파일 칸 → fileRef / 서버로 보낼 주소 칸 → urlRef / 폼 → formRef
  const fileRef = useRef<HTMLInputElement>(null);

  /* 서버로 실어 보낼 주소. 폼 안의 숨은 칸이 이 값을 쥔다 */
  const urlRef = useRef<HTMLInputElement>(null);

  /* 폼을 손으로 눌러 보낼 자리. 파일이 다 올라간 뒤에 이어서 보낸다 */
  const formRef = useRef<HTMLFormElement>(null);

  /** 파일을 고르면 곧장 올린다. "올리기" 단추를 또 누르게 하지 않는다 */
  // [F5][함수] onPick(e): 파일을 고르면 곧장 올린다('올리기' 를 또 누르게 하지 않는다)
  // 입력: e.target.files[0] → 처리: uploadAvatar → 주소를 숨은 칸에 → 폼 자동 제출
  // 출력: 없음(비동기)
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    // [F6][흐름] e.target.files[0] → file. 칸은 곧바로 비운다(같은 파일을 두 번 고를 수 있게)
    const file = e.target.files?.[0];

    /* 고르기 창을 열었다가 그냥 닫으면 파일이 없다.
       같은 파일을 두 번 고르면 값이 안 바뀌어 이 함수가 다시 안 불리므로 칸을 비워 둔다 */
    e.target.value = "";

    // [F7][분기] 파일 없음(고르기 창을 그냥 닫음) → true: 아무것도 안 함 / false: F8
    if (!file) return;

    setBusy(true);
    setProblem(null);

    // [F8][외부] file ▷ uploadAvatar(adapter/browser-avatar-upload:F6) — 줄여서 스토리지 업로드
    // → result
    const result = await uploadAvatar(file);

    setBusy(false);

    // [F9][분기] result.ok → false: 올리다 걸린 까닭을 띄우고 멈춤 / true: F10
    if (!result.ok) {
      setProblem(uploadMessages[result.reason]);
      return;
    }

    // 올라간 주소를 숨은 칸에 담고 폼을 보낸다
    // [F10][흐름] result.url → shown(화면) 과 urlRef(숨은 칸)
    setShown(result.url);

    if (urlRef.current) urlRef.current.value = result.url;

    /* requestSubmit 을 쓰는 까닭 — submit() 은 폼의 onSubmit 을 건너뛴다.
       action 으로 걸어 둔 서버 액션도 그때 안 불린다 */
    // [F11][호출] ▷ form.requestSubmit() → action(F2) → setPhotoAction 으로 주소가 넘어간다
    // submit() 이 아니라 requestSubmit() 인 까닭 — submit() 은 action 을 건너뛴다
    formRef.current?.requestSubmit();
  }

  /** 사진을 뗀다. 빈 주소를 보내면 서버가 null 로 지운다 */
  // [F12][함수] onDrop(): '사진 떼기' 를 눌렀을 때
  // 입력: 없음 → 처리: 숨은 칸을 비우고 폼 제출 → 서버가 avatar_url 을 null 로 → 출력: 없음
  function onDrop() {
    setShown(null);
    setProblem(null);

    if (urlRef.current) urlRef.current.value = "";

    formRef.current?.requestSubmit();
  }

  return (
    <form className="ph" action={action} ref={formRef}>
      <p className="wr-l">{accountCopy.photoLabel}</p>

      <div className="ph-row">
        {/* 지금 사진. 없으면 이름 첫 글자 */}
        <span className="ph-face">
          {shown ? (
            <Image
              src={shown}
              alt=""
              width={72}
              height={72}
              /* 올릴 때 이미 256px 로 줄여 두어서 그대로 내보내도 된다 */
              unoptimized
            />
          ) : (
            <span className="ph-letter" aria-hidden="true">
              {avatarLetter(name)}
            </span>
          )}
        </span>

        <div className="ph-side">
          <p className="wr-note">{shown ? accountCopy.photoNote : accountCopy.photoNone}</p>

          <div className="ph-acts">
            <button
              className="btn btn-line btn-sm"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || pending}
            >
              <Icon name="camera" size={15} />
              {busy ? accountCopy.photoBusy : accountCopy.photoPick}
            </button>

            {/* 사진이 있을 때만 뗄 수 있다 */}
            {shown && (
              <button
                className="btn btn-line btn-sm"
                type="button"
                onClick={onDrop}
                disabled={busy || pending}
              >
                <Icon name="close" size={15} />
                {accountCopy.photoDrop}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 진짜 파일 고르기 칸. 위 단추가 대신 눌러 준다 */}
      <input
        className="sr-only"
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => void onPick(e)}
      />

      {/* 다 올라간 주소. 사람이 고칠 값이 아니라 숨겨 둔다 */}
      <input type="hidden" name="avatarUrl" ref={urlRef} defaultValue={avatar ?? ""} />

      {/* 올리다 걸린 말 */}
      {problem && (
        <p className="wr-error" role="status">
          {problem}
        </p>
      )}

      {/* 서버가 돌려보낸 말 */}
      {state.reason && (
        <p className="wr-error" role="status">
          {photoMessages[state.reason]}
        </p>
      )}

      {/* 잘됐을 때. at 이 0보다 커야 "아직 아무것도 안 눌렀을 때" 와 갈린다 */}
      {state.at > 0 && state.reason === null && (
        <p className="wr-ok" role="status">
          {state.url ? accountCopy.photoDone : accountCopy.photoDropped}
        </p>
      )}
    </form>
  );
}
