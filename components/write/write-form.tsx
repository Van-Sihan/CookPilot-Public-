"use client";

/**
 * 커뮤니티에 글 쓰는 칸.
 *
 * 두 가지 길로 들어온다.
 *   · 빈 종이로 (커뮤니티에서 "글쓰기")
 *   · 방금 만든 요리가 채워진 채로 (요리 완성 화면에서 "커뮤니티에 글쓰기")
 *
 * 뒤쪽 길이 이 화면의 요점이다. 요리를 끝낸 사람에게 빈 종이를 주면
 * 대부분 안 쓴다. 무엇을 만들었는지는 이미 우리가 아니 채워 두고,
 * 하고 싶은 말만 보태게 한다.
 *
 * 사진도 마찬가지다. 요리 사진을 우리가 갖고 있지는 않지만,
 * **레시피 카드**는 그려 줄 수 있다. 그것을 올려 카드 그림으로 쓴다.
 */

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { publishPostAction } from "@/app/actions/post";
import { emptyWriteState } from "@/app/actions/post-state";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { uploadCover } from "@/lib/adapter/browser-cover-upload";
import { MAX_BADGE, MAX_SUMMARY, MAX_TITLE, type PostTone } from "@/lib/domain/post-draft";
import { draftFromRecipe } from "@/lib/domain/recipe-to-post";
import { findDraft } from "@/lib/usecase/plan-recipe";
import { drawRecipeCard } from "@/lib/recipe-card";
import { writeCopy, writeMessages } from "@/lib/write-content";
import { coverToneLabels, coverTones } from "@/lib/cook-content";

type Props = {
  /**
   * 방금 만든 요리를 끌어올지.
   *
   * 주소의 `?from=cook` 을 서버가 보고 넘겨준다. 브라우저에서 주소를 다시
   * 읽지 않는 까닭 — 그러면 서버가 그린 화면과 브라우저가 그린 화면이 달라진다.
   */
  fromCook: boolean;
};

/** 표지를 올리는 일이 지금 어디까지 됐는지 */
type CoverState =
  | { at: "none" }
  | { at: "busy" }
  | { at: "done"; url: string }
  | { at: "failed"; text: string };

export function WriteForm({ fromCook }: Props) {
  /* 서버로 보내고 돌아온 쪽지. 안 됐으면 까닭이 담겨 온다 */
  const [state, action, pending] = useActionState(publishPostAction, emptyWriteState);

  /* 방금 만든 요리. 브라우저에 담겨 있어서 "바깥 값 지켜보기" 로 따라간다 */
  const watchRecipe = useCallback(
    (fn: () => void) => browserRecipeDraftStore.subscribe(fn),
    [],
  );
  const recipe = useSyncExternalStore(
    watchRecipe,
    () => findDraft(browserRecipeDraftStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /* 적고 있는 값들 */
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [badge, setBadge] = useState("한 그릇");
  const [minutes, setMinutes] = useState("");
  const [tone, setTone] = useState<PostTone>("ember");

  /* 표지 그림 */
  const [cover, setCover] = useState<CoverState>({ at: "none" });

  /* 그림을 그리는 자리. 화면에는 안 보인다 */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* 요리에서 끌어온 값을 한 번만 채운다.
     지켜보게 두면 사람이 고쳐 놓은 것을 계속 덮어쓴다 */
  const filled = useRef(false);

  useEffect(() => {
    // 요리에서 온 길이 아니거나, 아직 레시피를 못 읽었거나, 이미 채웠으면 할 일이 없다
    if (!fromCook || !recipe || filled.current) return;

    // 여기서 표시를 남기는 것은 그리는 중이 아니라 다 그린 뒤라 괜찮다
    filled.current = true;

    // 색조는 요리 화면에서 고른 것을 그대로 잇는다
    const saved = browserCookSetupStore.load();
    const picked = (saved?.tone === "soft" ? "cocoa" : "ember") as PostTone;

    const draft = draftFromRecipe(recipe, picked);

    setTitle(draft.title);
    setBody(draft.body);
    setBadge(draft.badge);
    setMinutes(draft.minutes ? String(draft.minutes) : "");
    setTone(draft.tone);
  }, [fromCook, recipe]);

  /** 레시피 카드를 그려 스토리지에 올린다 */
  async function onMakeCover() {
    const canvas = canvasRef.current;

    // 레시피가 없으면 그릴 것이 없다. 단추도 안 보이지만 한 번 더 본다
    if (!canvas || !recipe || cover.at === "busy") return;

    setCover({ at: "busy" });

    // 그리는 일은 요리 완성 화면과 똑같은 함수가 한다. 두 벌로 두면 어긋난다
    drawRecipeCard(canvas, recipe, tone);

    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );

    if (!png) {
      setCover({ at: "failed", text: writeCopy.coverDrawFailed });
      return;
    }

    const result = await uploadCover(png);

    setCover(
      result.ok
        ? { at: "done", url: result.url }
        : // 왜 안 됐는지 그대로 보여 준다. 숨기면 못 고친다
          { at: "failed", text: writeMessages[result.reason] },
    );
  }

  return (
    <form className="wr" action={action}>
      {/* 요리에서 왔는데 담아 둔 레시피가 없으면 채울 것이 없다 */}
      {fromCook && !recipe && (
        <p className="wr-warn">
          {writeCopy.noRecipe} <Link href="/pick">{writeCopy.noRecipeGo}</Link>
        </p>
      )}

      <label className="wr-l" htmlFor="wr-title">
        {writeCopy.titleLabel}
      </label>
      <input
        className="wr-input"
        id="wr-title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={writeCopy.titlePlaceholder}
        maxLength={MAX_TITLE}
        autoComplete="off"
      />

      <label className="wr-l" htmlFor="wr-summary">
        {writeCopy.summaryLabel}
      </label>
      <input
        className="wr-input"
        id="wr-summary"
        name="summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={writeCopy.summaryPlaceholder}
        maxLength={MAX_SUMMARY}
        autoComplete="off"
      />

      {/* 딱지와 시간은 한 줄에. 둘 다 짧은 값이라 각각 한 줄을 쓰면 아깝다 */}
      <div className="wr-two">
        <div>
          <label className="wr-l" htmlFor="wr-badge">
            {writeCopy.badgeLabel}
          </label>
          <input
            className="wr-input"
            id="wr-badge"
            name="badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            maxLength={MAX_BADGE}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="wr-l" htmlFor="wr-minutes">
            {writeCopy.minutesLabel}
          </label>
          <input
            className="wr-input"
            id="wr-minutes"
            name="minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="45"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
      </div>

      {/* 색조. 사진이 없을 때 카드 뒤에 깔린다 */}
      <fieldset className="wr-tones">
        <legend className="wr-l">{writeCopy.toneLabel}</legend>

        {coverTones.map((t) => (
          <label className="wr-tone" key={t} data-on={tone === t ? "" : undefined}>
            <input
              type="radio"
              name="tone"
              value={t}
              checked={tone === t}
              onChange={() => setTone(t as PostTone)}
              className="sr-only"
            />
            {coverToneLabels[t]}
          </label>
        ))}
      </fieldset>

      <label className="wr-l" htmlFor="wr-body">
        {writeCopy.bodyLabel}
      </label>
      <textarea
        className="wr-body"
        id="wr-body"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={writeCopy.bodyPlaceholder}
        rows={16}
      />

      {/* ---------- 표지 ---------- */}
      {recipe && (
        <div className="wr-cover">
          <p className="wr-l">{writeCopy.coverLabel}</p>
          <p className="wr-note">{writeCopy.coverNote}</p>

          <button
            className="btn btn-line btn-sm"
            type="button"
            onClick={onMakeCover}
            disabled={cover.at === "busy"}
          >
            <Icon name="spark" size={15} />
            {cover.at === "busy" ? writeCopy.coverBusy : writeCopy.coverMake}
          </button>

          {cover.at === "done" && (
            <p className="wr-cover-ok">
              <Icon name="book" size={14} /> {writeCopy.coverDone}
            </p>
          )}
          {cover.at === "failed" && <p className="wr-cover-bad">{cover.text}</p>}

          {/* 올린 주소를 폼에 실어 보낸다. 사람이 고칠 값이 아니라 숨겨 둔다 */}
          <input
            type="hidden"
            name="imageUrl"
            value={cover.at === "done" ? cover.url : ""}
          />

          {/* 그림을 그리는 자리. 화면에는 안 보이고 올릴 때만 쓴다 */}
          <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
        </div>
      )}

      {/* 갈래는 늘 보통 글이다. 브랜드 글은 브랜드 계정만 쓴다 */}
      <input type="hidden" name="kind" value="community" />

      {/* 안 됐을 때 까닭 */}
      {state.reason && (
        <p className="wr-error" role="status">
          {writeMessages[state.reason]}
        </p>
      )}

      <div className="wr-foot">
        <Link className="btn btn-line" href="/community">
          {writeCopy.cancel}
        </Link>

        <button className="btn btn-fill" type="submit" disabled={pending}>
          {pending ? writeCopy.saving : writeCopy.save}
        </button>
      </div>
    </form>
  );
}
