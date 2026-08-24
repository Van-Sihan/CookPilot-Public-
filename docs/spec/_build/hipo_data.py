# -*- coding: utf-8 -*-
"""CookPilot 기능명세서 · HIPO 원본 데이터.

근거: docs/flow/flow.md (FN01–FN13 기능별 실행 흐름) ·
      docs/flow/map.pdf (L · D · J · S) · docs/flow/phases.pdf (P · 모듈 경계) ·
      코드의 [F#] 실행 흐름 주석.
확인되지 않는 항목은 '확인 필요' 로 표기한다.
"""

SYSTEM = ("S1", "CookPilot", "음성 기반 요리 보조 서비스. 레시피 생성부터 조리 진행, "
                             "커뮤니티 공유, AI 요리 상담까지 담당한다.")

# ── 모듈 ─────────────────────────────────────────────────
MODULES = [
    ("M1", "이용 준비",
     "요리 기능 사용에 필요한 Gemini API Key 를 브라우저에 확보하고 조회 · 삭제한다. "
     "계정 없이 동작한다."),
    ("M2", "계정 · 프로필",
     "Supabase 계정 생성 · 인증과 표시 이름 · 프로필 이미지 관리를 담당한다. "
     "커뮤니티 기능의 접근 권한 기준이 된다."),
    ("M3", "레시피 생성",
     "음성 · YouTube 링크 · 보유 재료 세 가지 입력 방식으로 레시피 1건을 생성해 "
     "브라우저에 기록한다. 세 경로 모두 같은 검증과 저장 지점으로 수렴한다."),
    ("M4", "요리 진행",
     "생성된 레시피로 실시간 음성 세션을 열어 조리 단계 낭독 · 음성 명령 · 타이머를 "
     "처리한다."),
    ("M5", "커뮤니티",
     "게시글 작성 · 수정 · 삭제, 목록 · 검색 · 태그 조회, 댓글과 좋아요 · 즐겨찾기를 "
     "담당한다."),
    ("M6", "AI 요리 상담",
     "후기 데이터를 벡터 검색해 질문에 답한다. 색인 작업과 질의응답으로 나뉜다."),
    ("M7", "저장 레시피",
     "완료한 레시피를 브라우저에 보관하고 재사용 · 삭제 · 백업한다."),
]

# ── 기능 (FN01 – FN13) ───────────────────────────────────
# (기능ID, 기능명, 모듈ID, 기능설명, 입력, 처리, 출력, 선행조건, 후행조건,
#  외부연계, 관련데이터, 관련화면, 관련함수, 구현위치, 근거)
FEATURES = [
 ("FN01", "Gemini API Key 입력", "M1",
  "사용자가 입력한 Gemini API Key 를 검증해 브라우저에 저장하고, 이후 요리 기능이 "
  "조회해 사용한다. 브라우저가 Gemini API 를 직접 호출하므로 CookPilot 서버로는 "
  "전송하지 않는다. 단 FN11 상담은 서버를 거친다.",
  "API Key 문자열",
  "공백 제거 후 빈 값 여부를 검증하고, 통과하면 브라우저 저장소에 기록한다. "
  "기록 실패 여부를 확인해 결과를 구분한다.",
  "저장 완료 상태 표시 또는 오류 코드('empty' · 'storage')",
  "없음",
  "D1-1 에 Key 가 저장되어 FN03 · FN04 · FN05 · FN06 · FN11 · FN13 이 조회 가능",
  "없음",
  "D1-1", "J1",
  "onSubmit() · enterWithApiKey() · checkApiKey() · findSavedKey()",
  "lib/usecase/enter-with-api-key.ts :: enterWithApiKey() :F1",
  "components/start/api-key-form.tsx:F5 · lib/domain/api-key.ts:F1"),

 ("FN02", "로그인 · 회원가입", "M2",
  "이메일과 비밀번호로 Supabase 계정을 만들고 인증한다. 가입 시 프로필 행이 "
  "트리거로 생성된다.",
  "이메일 · 비밀번호 · (가입 시) 표시 이름 · 비밀번호 확인",
  "자격 증명 형식을 검증하고 통과한 경우에만 Supabase Auth 에 요청한다. "
  "인증 결과를 오류 코드로 분류하고 성공 시 라우트 캐시를 무효화한다.",
  "/start 이동 또는 오류 코드 · 메일 확인 안내",
  "없음",
  "인증 쿠키 발급. D2-1 profiles 행 생성(가입). M5 의 접근 권한 검사 통과",
  "Supabase",
  "D2-1", "J1 · J7",
  "signInAction() · signUpAction() · signIn() · signUp() · checkCredentials()",
  "lib/usecase/sign-in.ts :: signIn() :F1",
  "app/actions/auth.ts:F2 · lib/domain/credentials.ts:F1"),

 ("FN03", "음성 입력 레시피 생성", "M3",
  "마이크로 녹음한 음성을 Gemini 에 전달해 레시피 1건을 생성하고 브라우저에 "
  "기록한 뒤 장보기 화면으로 이동한다.",
  "마이크 음성(PCM → WAV base64) · 인분 수 · D1-1 API Key",
  "마이크 권한을 확인하고 음성 조각을 수집해 WAV 로 변환한다. 길이 하한 미달이면 "
  "요청하지 않는다. Gemini 응답을 Recipe 구조로 검증한 뒤 브라우저에 기록한다.",
  "Recipe 1건(D1-3) · /shop 이동 또는 오류 코드",
  "D1-1 에 API Key 존재",
  "D1-3 에 레시피 기록. FN06 · FN07 · FN12 가 조회 가능",
  "Gemini",
  "D1-1 · D1-3 · D4-1", "J2",
  "start() · openMic() · planFromSpeech() · call() · readRecipe()",
  "lib/usecase/plan-recipe.ts :: planFromSpeech() :F1",
  "components/pick/voice-console.tsx:F6 · lib/domain/recipe.ts:F3"),

 ("FN04", "YouTube 링크 레시피 생성", "M3",
  "YouTube 영상 URL 을 Gemini 에 전달해 레시피를 생성하고, 출처 정보와 썸네일을 "
  "장보기 화면에 표시한다.",
  "YouTube 영상 URL · 인분 수 · D1-1 API Key",
  "URL 형식과 호스트를 먼저 검증해 통과한 경우에만 모델을 호출한다. 응답에 출처 "
  "정보를 부착하고 영상 ID 로 썸네일 URL 을 생성한다.",
  "Recipe 1건(출처 포함, D1-3) · 썸네일 · 영상 제목 · 채널 표시",
  "D1-1 에 API Key 존재",
  "D1-3 에 레시피 기록",
  "Gemini · i.ytimg.com",
  "D1-1 · D1-3 · D4-1 · D4-5", "J2",
  "run() · planFromYoutube() · readYoutubeUrl() · youtubeThumb()",
  "lib/usecase/plan-recipe.ts :: planFromYoutube() :F8",
  "lib/domain/recipe.ts:F22 · lib/adapter/gemini-recipe-gateway.ts:F20"),

 ("FN05", "냉장고 재료 레시피 생성", "M3",
  "보유 재료로 요리 후보 3~5개를 먼저 제시하고, 사용자가 선택한 요리만 레시피로 "
  "생성한다. 1단계에서는 저장하지 않는다.",
  "보유 재료 문자열 · 선택한 요리명 · 인분 수 · D1-1 API Key",
  "재료를 최대 20개로 파싱하고 2개 미만이면 거절한다. 1단계에서 후보 목록을 받아 "
  "유효 항목만 5개까지 수집한다. 2단계에서 보유 재료를 다시 전달해 레시피를 생성한다.",
  "1단계 후보 카드 3~5개 · 2단계 Recipe 1건(D1-3) · /shop 이동",
  "D1-1 에 API Key 존재",
  "D1-3 에 레시피 기록",
  "Gemini",
  "D1-1 · D1-3 · D4-1", "J2",
  "findFridgeIdeas() · planFromFridgeIdea() · readFridgeItems() · readFridgeIdeas()",
  "lib/usecase/plan-recipe.ts :: findFridgeIdeas() :F12",
  "lib/domain/recipe.ts:F32 · lib/domain/recipe.ts:F37"),

 ("FN06", "음성 기반 요리 진행", "M4",
  "실시간 음성 세션을 열어 조리 단계를 낭독하고, 사용자의 음성에서 단계 이동 "
  "명령과 타이머 요청을 판정한다.",
  "D1-3 레시피 · D1-2 음성 설정 · D1-1 API Key · 마이크 음성",
  "API Key 와 마이크 · 스피커를 확보한 뒤 WebSocket 세션을 열고 시스템 지시문을 "
  "전달한다. 전사된 발화에서 단계 명령과 타이머 요청을 분리해 판정한다. "
  "낭독은 세션 · 임시 세션 · 브라우저 음성 합성 3순위로 처리한다.",
  "조리 단계 낭독 음성 · 단계 이동 · 타이머 등록 · /cook/done 이동",
  "D1-3 에 레시피 존재. D1-1 에 API Key 존재",
  "요리 완료 화면으로 이동. FN12 저장 또는 FN07 게시글 작성으로 연결",
  "Gemini",
  "D1-1 · D1-2 · D1-3 · D4-2 · D4-7", "J2",
  "start() · geminiLiveGateway() · readStepCommand() · readTimerRequest() · "
  "readStepNote() · speakWithBrowser()",
  "lib/adapter/gemini-live-gateway.ts :: geminiLiveGateway() :F1",
  "components/cook/live-console.tsx:F12 · lib/domain/cook-progress.ts:F20"),

 ("FN07", "게시글 작성 · 수정 · 삭제", "M5",
  "완료한 레시피를 게시글 초안으로 변환해 작성하고, 본인 게시글을 수정 · 삭제한다. "
  "표지 이미지는 브라우저에서 직접 업로드한다.",
  "제목 · 요약 · 본문 · 카테고리(태그) · 소요 시간 · 표지 이미지 URL · D1-3 레시피",
  "레시피를 본문 · 태그 · 소요 시간으로 변환해 폼을 채운다. 길이 검증 6종을 거치고 "
  "자체 버킷이 아닌 이미지 URL 은 제거한다. 게시 전환 RPC 실패를 무시하지 않는다. "
  "수정 · 삭제는 영향 행 수로 권한을 판정한다.",
  "D2-2 게시글 행 · D3-1 표지 이미지 · /posts/<id> 이동 또는 오류 코드",
  "로그인 상태. 표지 이미지 업로드 시 인증 사용자 ID 필요",
  "D2-2 에 게시글 기록. FN08 · FN09 · FN13 이 조회 가능",
  "Supabase · Supabase Storage",
  "D1-3 · D2-2 · D3-1", "J4 · J7",
  "publishPostAction() · writePost() · readPostDraft() · draftFromRecipe() · "
  "uploadCover()",
  "lib/usecase/write-post.ts :: writePost() :F1",
  "app/actions/post.ts:F2 · lib/domain/post-draft.ts:F3"),

 ("FN08", "댓글", "M5",
  "게시글에 댓글을 작성 · 수정 · 삭제한다. 예시 게시글의 댓글은 테이블이 아니라 "
  "브라우저에 저장된다.",
  "게시글 ID · 댓글 본문 · 로그인 상태",
  "본문 길이를 검증하고 테이블에 기록한다. 조회 시 mine · canRemove · edited · "
  "표시 시각을 서버가 계산해 전달한다. 수정 · 삭제는 영향 행 수로 권한을 판정한다.",
  "D2-5 댓글 행 또는 D1-5 브라우저 댓글 · 댓글 목록 재조회",
  "게시글 댓글은 로그인 상태. 예시 게시글 댓글은 로그인 불필요",
  "댓글 목록에 반영",
  "Supabase",
  "D1-5 · D2-5 · D2-1", "J3 · J7",
  "commentAction() · writeComment() · checkComment() · postComments() · sayOnPost()",
  "lib/usecase/discuss-post.ts :: writeComment() :F11",
  "app/actions/post.ts:F17 · lib/domain/post.ts:F2"),

 ("FN09", "좋아요 · 즐겨찾기", "M5",
  "게시글에 좋아요와 즐겨찾기를 켜고 끈다. 화면 상태를 먼저 반영하고 실패 시 "
  "원복한다.",
  "게시글 ID · 다음 상태(on) · 로그인 상태",
  "화면이 계산한 다음 상태를 그대로 전달한다. uuid 가 아닌 예시 게시글은 거절한다. "
  "중복 키 오류는 성공으로 처리하고, 좋아요 수는 테이블 트리거가 갱신한다.",
  "D2-3 · D2-4 행 변경 · D2-2 like_count 갱신 · 버튼 상태",
  "로그인 상태. 게시글 ID 가 uuid 형식",
  "목록 · 글 화면 캐시 무효화",
  "Supabase",
  "D2-2 · D2-3 · D2-4", "J3 · J7",
  "likeAction() · bookmarkAction() · toggleLike() · toggleBookmark() · myReactions()",
  "lib/usecase/react-to-post.ts :: toggleLike() :F2",
  "app/actions/post.ts:F25 · lib/usecase/react-to-post.ts:F3"),

 ("FN10", "프로필 관리", "M2",
  "표시 이름과 프로필 이미지를 변경한다. 이미지는 브라우저에서 축소해 스토리지에 "
  "직접 업로드하고 서버에는 URL 만 전달한다.",
  "표시 이름 문자열 · 이미지 파일",
  "이미지를 중앙 정사각형으로 잘라 256px webp 로 변환한 뒤 업로드한다. URL 이 "
  "자체 버킷 경로인지 검증하고 통과한 경우에만 프로필에 기록한다. 표시 이름은 "
  "회원가입과 같은 규칙으로 검증한다.",
  "D2-1 profiles 갱신 · D3-2 이미지 · 게시글 · 댓글 · 홈 카드에 반영",
  "로그인 상태",
  "커뮤니티 전역의 작성자 표시가 갱신됨",
  "Supabase · Supabase Storage",
  "D2-1 · D3-2", "J7",
  "setPhotoAction() · changeMyPhoto() · readAvatarUrl() · uploadAvatar() · renameMe()",
  "lib/usecase/rename-me.ts :: changeMyPhoto() :F6",
  "app/actions/post.ts:F29 · lib/domain/avatar.ts:F1"),

 ("FN11", "AI 요리 상담 (RAG)", "M6",
  "후기 데이터를 벡터 검색해 질문에 답한다. 브라우저가 Key 를 서버로 전달하는 "
  "유일한 기능이다. 색인은 사용자 흐름 밖의 운영 작업이다.",
  "질문 문자열 · 대화 이력 · D1-1 API Key · (색인) samples/reviews.csv",
  "질문을 검증하고 대화 세션을 확보한 뒤 질문을 먼저 기록한다. 최근 6턴만 남겨 "
  "Pinecone 에서 유사 후기를 검색하고 그 결과로 응답을 생성한다. 출처는 요리 "
  "단위로 중복을 제거한다.",
  "응답 본문 · 근거 후기 목록 · D2-7 메시지 행 · (색인) 등록 건수",
  "D1-1 에 API Key 존재. 색인이 1회 완료되어 있어야 검색 결과가 나온다",
  "D1-6 에 대화 ID 기록. 다음 질문이 같은 대화에 이어진다",
  "Gemini · Pinecone · Supabase",
  "D1-1 · D1-6 · D2-6 · D2-7 · D4-3 · D4-4", "J5",
  "POST() · askKitchen() · checkQuestion() · run() · indexReviews() · reviewText()",
  "lib/usecase/ask-kitchen.ts :: askKitchen() :F1",
  "app/api/chat/route.ts:F4 · lib/adapter/langchain-rag.ts:F22"),

 ("FN12", "저장 레시피 관리", "M7",
  "완료한 레시피를 브라우저에 보관하고, 표지를 눌러 재사용하거나 항목을 삭제하고 "
  "파일로 백업 · 복원한다.",
  "Recipe · 저장 항목 ID · 백업 파일",
  "동일 제목 항목을 제외하고 선두에 추가한다. 재사용 시 Recipe 구조를 검증해 "
  "임시 레시피로 기록하고 장보기 화면으로 이동한다. 백업 복원은 JSON 형식 · 버전 · "
  "항목 구조를 검증하고 실패 시 기존 항목을 변경하지 않는다.",
  "D1-4 항목 목록 · D1-3 임시 레시피 · 백업 파일",
  "없음",
  "재사용 시 FN03 계열과 같은 지점(D1-3)으로 합류",
  "없음",
  "D1-3 · D1-4", "J6",
  "shelveRecipe() · unshelveBook() · restoreShelfBackup() · readBackup() · cookAgain()",
  "lib/usecase/keep-recipe-shelf.ts :: shelveRecipe() :F7",
  "components/shelf/shelf-stand.tsx:F6 · lib/domain/recipe-shelf.ts:F5"),

 ("FN13", "커뮤니티 목록 · 검색 · 태그", "M5",
  "게시글 목록을 최신순으로 조회하고 탭 · 검색어 · 태그로 필터링한다. 로그인 없이 "
  "조회할 수 있다.",
  "?tab= 탭 값 · ?q= 검색어",
  "탭과 검색어를 정규화한다. 게시글과 프로필을 조인해 조회하고, 컬럼 미존재 "
  "오류가 나면 해당 컬럼을 빼고 재조회한다. 제목 · 작성자 · 태그 · 요약을 공백 "
  "제거 후 대조한다.",
  "게시글 목록 · 태그 링크(/community?q=<태그>)",
  "없음",
  "게시글 선택 시 /posts/[id] 로 이동",
  "Supabase",
  "D2-1 · D2-2 · D3-1", "J3",
  "CommunityPage() · resolveTab() · resolveQuery() · matchesQuery() · livePosts()",
  "app/community/page.tsx :: CommunityPage() :F1",
  "lib/domain/community-tab.ts:F1 · lib/adapter/supabase-post-reader.ts:F6"),
]
