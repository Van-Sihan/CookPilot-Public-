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
import { supabasePostGateway } from "@/lib/adapter/supabase-post-gateway";
import { supabaseProfileGateway } from "@/lib/adapter/supabase-profile-gateway";
import { renameMe } from "@/lib/usecase/rename-me";
import { writePost } from "@/lib/usecase/write-post";
import type { RenameFormState, WriteFormState } from "@/app/actions/post-state";

/** FormData 에서 글자 하나를 꺼낸다. 글자가 아니면 빈 글자로 본다 */
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
export async function publishPostAction(
  _prev: WriteFormState,
  formData: FormData,
): Promise<WriteFormState> {
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
  if (!result.ok) return { reason: result.reason };

  /* 목록에 방금 쓴 글이 보여야 한다. 캐시를 안 비우면 새로 고쳐도 옛 목록이 나온다 */
  revalidatePath("/community");

  /* redirect 는 예외를 던져서 흐름을 끊는다. try 안에 두면 안 된다 —
     그 예외를 catch 가 잡아 버리면 화면이 안 넘어간다 */
  redirect(`/posts/${result.id}`);
}

/** 닉네임 바꾸기 단추가 눌렸을 때 */
export async function renameAction(
  _prev: RenameFormState,
  formData: FormData,
): Promise<RenameFormState> {
  const result = await renameMe(field(formData, "name"), supabaseProfileGateway);

  if (!result.ok) return { reason: result.reason, done: null };

  /* 이름이 화면 여기저기 나온다. 캐시를 비워야 바뀐 이름이 보인다 */
  revalidatePath("/community");
  revalidatePath("/account");

  // 화면에 머물면서 바뀌었다고 알려 준다. 다른 데로 보낼 까닭이 없다
  return { reason: null, done: result.name };
}
