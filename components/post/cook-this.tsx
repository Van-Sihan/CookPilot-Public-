"use client";

/**
 * "이 레시피로 요리 시작" 단추.
 *
 * 글에 적힌 레시피를 그대로 담아 두고 장보기 화면으로 보낸다.
 * 커뮤니티 글의 레시피와 AI 가 만들어 주는 레시피가 같은 모양이라 이게 된다 —
 * 장보기·요리 화면은 이 레시피가 어디서 왔는지 몰라도 그대로 굴러간다.
 *
 * 브라우저에서 도는 조각을 이 단추 하나로 좁혀 두었다. 글 전체를 client 로
 * 만들면 본문 열여섯 편이 브라우저로 실려 간다.
 */

import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import type { Recipe } from "@/lib/domain/recipe";
import { findSavedKey, watchSavedKey } from "@/lib/usecase/enter-with-api-key";
import { postCopy } from "@/lib/post-copy";

export function CookThis({ recipe }: { recipe: Recipe }) {
  /* 장보기 화면으로 데려갈 때 쓴다 */
  const router = useRouter();

  /* 담아 둔 키. 없으면 요리를 시작할 수 없다.
     화면을 다시 그릴 때마다 새 함수를 만들면 부탁했다 취소했다를 되풀이한다 */
  const watch = useCallback(
    (fn: () => void) => watchSavedKey(browserApiKeyStore, fn),
    [],
  );
  const key = useSyncExternalStore(
    watch,
    () => findSavedKey(browserApiKeyStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /** 눌렀을 때 하는 일 */
  function onStart() {
    // 키가 없으면 여기서 막지 않고 키 넣는 화면으로 보낸다
    if (!key) {
      router.push("/start");
      return;
    }

    try {
      /* 장보기 화면이 꺼내 쓸 자리에 담는다. 담기지 않아도 화면은 넘어가야 하므로
         여기서 막지 않는다 — 장보기 화면이 "정해 둔 요리가 없습니다" 로 받아 준다 */
      browserRecipeDraftStore.save(recipe);
    } catch {
      // 시크릿 창처럼 저장을 막아 둔 곳에서는 여기로 온다
    }

    router.push("/shop");
  }

  return (
    <button className="pd-cook" type="button" onClick={onStart}>
      <span className="pd-cook-ico" aria-hidden="true">
        <Icon name="mic" size={20} />
      </span>

      <span className="pd-cook-t">
        <strong>{postCopy.cookThis}</strong>
        {/* 키가 없으면 어디로 가게 될지 미리 알려 준다 */}
        {!key && <span className="pd-cook-sub">{postCopy.cookNeedsKey}</span>}
      </span>
    </button>
  );
}
