"use server";

/**
 * 프레임워크 계층 · 글쓰기와 닉네임 바꾸기가 서버로 건네지는 자리.
 *
 * [[auth]] 와 같은 규칙을 따른다 — 여기서 하는 일은 셋뿐이다.
 *   1. FormData 에서 글자를 꺼낸다
 *   2. 유스케이스를 부른다
 *   3. 잘됐으면 다음 화면으로 보내고, 안 됐으면 까닭만 돌려준다
 *
 * 검사도(도메인) 수파베이스도(어댑터) 여기서는 모른다.
 *
 * 주의 — Server Action 은 누구나 그 주소로 POST 를 보낼 수 있는 입구다.
 * 화면에서 이미 걸렀더라도 유스케이스가 서버에서 한 번 더 검사한다.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseCommentGateway } from "@/lib/adapter/supabase-comment-gateway";
import { supabasePostGateway } from "@/lib/adapter/supabase-post-gateway";
import { supabaseProfileGateway } from "@/lib/adapter/supabase-profile-gateway";
import { supabaseReactionGateway } from "@/lib/adapter/supabase-reaction-gateway";
import { dropComment, reviseComment, writeComment } from "@/lib/usecase/discuss-post";
import { toggleBookmark, toggleLike } from "@/lib/usecase/react-to-post";
import { changeMyPhoto, renameMe } from "@/lib/usecase/rename-me";
import { removePost, revisePost, writePost } from "@/lib/usecase/write-post";
import type {
  PhotoFormState,
  RenameFormState,
  TalkFormState,
  WriteFormState,
} from "@/app/actions/post-state";

/** FormData 에서 글자 하나를 꺼낸다. 글자가 아니면 빈 글자로 본다 */
// [F1][함수] field(formData, name): FormData 에서 글자 하나를 꺼낸다
// 입력: FormData + 칸 이름 → 처리: 글자가 아니면 빈 글자로 → 출력: string
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * 글쓰기 단추가 눌렸을 때.
 *
 * 첫 번째 인자 prev 는 쓰지 않지만 자리를 비울 수 없다 —
 * useActionState 가 "지난번 상태" 를 늘 첫 번째로 넘겨준다.
 */
// [F2][함수] publishPostAction(prev, formData): 글쓰기 단추가 눌렸을 때 (Server Action)
// 입력: prev + formData(글쓰기 폼) → 처리: writePost 호출 → 성공 시 그 글로 이동
// 출력: WriteFormState 또는 redirect
export async function publishPostAction(
  _prev: WriteFormState,
  formData: FormData,
): Promise<WriteFormState> {
  // [F3][호출] field(F1)로 꺼낸 칸 묶음 + supabasePostGateway → writePost(usecase:F1) → result
  const result = await writePost(
    {
      title: field(formData, "title"),
      summary: field(formData, "summary"),
      body: field(formData, "body"),
      badge: field(formData, "badge"),
      minutes: field(formData, "minutes"),
      kind: field(formData, "kind"),
      tone: field(formData, "tone"),
      imageUrl: field(formData, "imageUrl"),
    },
    supabasePostGateway,
  );

  // 안 됐으면 까닭만 돌려준다. 화면이 무슨 말로 보여 줄지 고른다
  // [F4][분기] result.ok → false: 까닭을 폼에 돌려줌 / true: F5
  if (!result.ok) return { reason: result.reason };

  /* 목록에 방금 쓴 글이 보여야 한다. 캐시를 안 비우면 새로 고쳐도 옛 목록이 나온다 */
  // [F5][외부] ▷ revalidatePath('/community') — 목록에 방금 쓴 글이 보이게 캐시를 비운다
  revalidatePath("/community");

  /* redirect 는 예외를 던져서 흐름을 끊는다. try 안에 두면 안 된다 —
     그 예외를 catch 가 잡아 버리면 화면이 안 넘어간다 */
  // [F6][반환] ▷ redirect('/posts/<id>') — 방금 쓴 글로 데려간다
  redirect(`/posts/${result.id}`);
}

/** 닉네임 바꾸기 단추가 눌렸을 때 */
// [F7][함수] renameAction(prev, formData): 닉네임 바꾸기 단추가 눌렸을 때 (Server Action)
// 입력: prev + formData(name) → 처리: renameMe 호출 → 출력: RenameFormState (이동 안 함)
export async function renameAction(
  _prev: RenameFormState,
  formData: FormData,
): Promise<RenameFormState> {
  // [F8][호출] formData.name + supabaseProfileGateway → renameMe(usecase:F1) → result
  const result = await renameMe(field(formData, "name"), supabaseProfileGateway);

  if (!result.ok) return { reason: result.reason, done: null };

  /* 이름이 화면 여기저기 나온다. 캐시를 비워야 바뀐 이름이 보인다 */
  revalidatePath("/community");
  revalidatePath("/account");

  // 화면에 머물면서 바뀌었다고 알려 준다. 다른 데로 보낼 까닭이 없다
  // [F9][반환] {done: 바뀐 이름} → account-form 이 '○○ 으로 바꿨습니다' 를 띄운다
  return { reason: null, done: result.name };
}


/**
 * 글 고치기 단추가 눌렸을 때.
 *
 * 어느 글인지는 숨겨 둔 칸(postId)으로 온다. 주소에서 읽지 않는 까닭 —
 * Server Action 은 어느 화면에서 불렸는지 모른다. 폼에 실어 보내야 확실하다.
 *
 * **여기서 "내 글인가" 를 안 따진다.** 표의 정책이 따진다.
 * 여기서 한 번 더 따지면 규칙이 두 곳에 생기고 언젠가 둘이 어긋난다.
 */
// [F10][함수] revisePostAction(prev, formData): 글 고치기 단추가 눌렸을 때 (Server Action)
// 입력: prev + formData(postId 포함) → 처리: revisePost 호출 → 출력: WriteFormState 또는 redirect
export async function revisePostAction(
  _prev: WriteFormState,
  formData: FormData,
): Promise<WriteFormState> {
  // [F11][호출] formData.postId → field(F1) → id (주소에서 안 읽는다. 폼에 실어야 확실하다)
  const id = field(formData, "postId");

  // [F12][호출] id + 칸 묶음 + supabasePostGateway → revisePost(usecase:F6) → result
  const result = await revisePost(
    id,
    {
      title: field(formData, "title"),
      summary: field(formData, "summary"),
      body: field(formData, "body"),
      badge: field(formData, "badge"),
      minutes: field(formData, "minutes"),
      kind: field(formData, "kind"),
      tone: field(formData, "tone"),
      imageUrl: field(formData, "imageUrl"),
    },
    supabasePostGateway,
  );

  if (!result.ok) return { reason: result.reason };

  /* 목록과 글 화면 둘 다 캐시를 비운다. 글 화면만 비우면 목록에는
     옛 제목이 남아서 고쳐졌는지 알 수 없다 */
  revalidatePath("/community");
  revalidatePath(`/posts/${id}`);

  // [F13][반환] ▷ 목록과 글 화면 캐시를 비우고 redirect('/posts/<id>')
  redirect(`/posts/${id}`);
}

/**
 * 글 지우기.
 *
 * 폼이 아니라 단추에서 곧장 부른다. 지우기는 칸에 적을 것이 없는 일이라
 * FormData 를 만들 까닭이 없다.
 */
// [F14][함수] removePostAction(id): 글 지우기 (Server Action, 폼이 아니라 단추가 직접 부른다)
// 입력: id → 처리: removePost 호출 → 출력: 실패 시 {ok:false, reason}, 성공 시 redirect
export async function removePostAction(
  id: string,
): Promise<{ ok: boolean; reason: string | null }> {
  // [F15][호출] id + supabasePostGateway → removePost(usecase:F11) → result
  const result = await removePost(id, supabasePostGateway);

  if (!result.ok) return { ok: false, reason: result.reason };

  revalidatePath("/community");

  /* 지운 글로 돌아갈 수는 없다. 목록으로 보낸다.
     redirect 는 예외를 던져 흐름을 끊으므로 이 뒤로는 아무 일도 안 일어난다 */
  // [F16][반환] ▷ redirect('/community') — 지운 글로는 돌아갈 수 없다
  redirect("/community");
}

/** 댓글 남기기 */
// [F17][함수] commentAction(prev, formData): 댓글 남기기 (Server Action)
// 입력: prev + formData(postId, body) → 처리: writeComment 호출 → 출력: TalkFormState
export async function commentAction(
  prev: TalkFormState,
  formData: FormData,
): Promise<TalkFormState> {
  const postId = field(formData, "postId");

  // [F18][호출] postId + body + supabaseCommentGateway → writeComment(usecase:F11) → result
  const result = await writeComment(postId, field(formData, "body"), supabaseCommentGateway);

  // 눌린 횟수를 늘려 둔다. 잘됐을 때도 쪽지가 달라져야 화면이 알아챈다
  // [F19][흐름] prev.at + 1 → at (잘돼도 쪽지가 달라져야 화면이 입력칸을 비운다)
  const at = prev.at + 1;

  if (!result.ok) return { reason: result.reason, at };

  // [F20][외부] ▷ revalidatePath('/posts/<id>') — 서버가 댓글 목록을 다시 그린다
  revalidatePath(`/posts/${postId}`);

  return { reason: null, at };
}

/** 내가 쓴 댓글 고치기 */
// [F21][함수] reviseCommentAction(prev, formData): 댓글 고치기 (Server Action)
// 입력: prev + formData(postId, commentId, body) → 처리: reviseComment → 출력: TalkFormState
export async function reviseCommentAction(
  prev: TalkFormState,
  formData: FormData,
): Promise<TalkFormState> {
  const postId = field(formData, "postId");

  // [F22][호출] commentId + body + supabaseCommentGateway → reviseComment(usecase:F15) → result
  const result = await reviseComment(
    field(formData, "commentId"),
    field(formData, "body"),
    supabaseCommentGateway,
  );

  const at = prev.at + 1;

  if (!result.ok) return { reason: result.reason, at };

  revalidatePath(`/posts/${postId}`);

  return { reason: null, at };
}

/** 댓글 지우기. 누가 지울 수 있는지는 표가 정한다 */
// [F23][함수] removeCommentAction(commentId, postId): 댓글 지우기 (Server Action)
// 입력: commentId + postId → 처리: dropComment 호출 → 출력: {ok, reason}
export async function removeCommentAction(
  commentId: string,
  postId: string,
): Promise<{ ok: boolean; reason: string | null }> {
  // [F24][호출] commentId + supabaseCommentGateway → dropComment(usecase:F19) → result
  const result = await dropComment(commentId, supabaseCommentGateway);

  if (!result.ok) return { ok: false, reason: result.reason };

  revalidatePath(`/posts/${postId}`);

  return { ok: true, reason: null };
}

/**
 * 좋아요를 켜거나 끈다.
 *
 * 지금 상태를 화면이 보내 준다. "뒤집어 달라" 고 시키지 않는 까닭은
 * 유스케이스 주석에 적어 두었다.
 */
// [F25][함수] likeAction(postId, on): 좋아요 켜기·끄기 (Server Action)
// 입력: postId + on(화면이 정한 다음 상태) → 처리: toggleLike 호출 → 출력: {ok, reason}
export async function likeAction(
  postId: string,
  on: boolean,
): Promise<{ ok: boolean; reason: string | null }> {
  // [F26][호출] postId + on + supabaseReactionGateway → toggleLike(usecase:F2) → result
  const result = await toggleLike(postId, on, supabaseReactionGateway);

  if (!result.ok) return { ok: false, reason: result.reason };

  /* 목록 카드에 찍히는 숫자가 바뀐다. 글 화면도 함께 비워야
     새로 고쳤을 때 숫자가 되돌아가지 않는다 */
  revalidatePath("/community");
  revalidatePath(`/posts/${postId}`);

  return { ok: true, reason: null };
}

/** 즐겨찾기에 담거나 뺀다 */
// [F27][함수] bookmarkAction(postId, on): 즐겨찾기 담기·빼기 (Server Action)
// 입력: postId + on → 처리: toggleBookmark 호출 → 출력: {ok, reason}
export async function bookmarkAction(
  postId: string,
  on: boolean,
): Promise<{ ok: boolean; reason: string | null }> {
  // [F28][호출] postId + on + supabaseReactionGateway → toggleBookmark(usecase:F5) → result
  const result = await toggleBookmark(postId, on, supabaseReactionGateway);

  if (!result.ok) return { ok: false, reason: result.reason };

  /* 목록은 안 비운다. 즐겨찾기는 나만 보는 값이라 남의 화면에 아무 영향이 없고,
     저장한 글 목록은 들어갈 때마다 새로 읽는다 */
  revalidatePath(`/posts/${postId}`);

  return { ok: true, reason: null };
}

/**
 * 프로필 사진 주소를 갈아 끼운다.
 *
 * 파일을 올리는 일은 브라우저가 이미 끝냈고, 여기 오는 것은 주소 한 줄이다.
 * 빈 값이 오면 사진을 뗀다.
 */
// [F29][함수] setPhotoAction(prev, formData): 프로필 사진 주소 갈아 끼우기 (Server Action)
// 입력: prev + formData(avatarUrl, 뗄 때는 빈 값) → 처리: changeMyPhoto 호출
// 출력: PhotoFormState
export async function setPhotoAction(
  prev: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  const raw = field(formData, "avatarUrl");

  // [F30][호출] raw(빈 값이면 null) + supabaseProfileGateway → changeMyPhoto(usecase:F6) → result
  const result = await changeMyPhoto(raw.length > 0 ? raw : null, supabaseProfileGateway);

  const at = prev.at + 1;

  if (!result.ok) return { reason: result.reason, url: prev.url, at };

  /* 사진이 글 목록·글 화면·댓글에 두루 나온다. 홈과 계정 화면을 비운다.
     글마다 비울 수는 없어서, 글 화면은 다음에 열 때 새로 읽히는 것에 맡긴다 */
  revalidatePath("/community");
  revalidatePath("/account");

  // [F31][반환] {url} → photo-form 이 '사진을 바꿨습니다' 또는 '뗐습니다' 를 띄운다
  return { reason: null, url: result.url, at };
}
