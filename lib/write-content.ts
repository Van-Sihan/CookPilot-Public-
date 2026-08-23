/**
 * 글쓰기 화면에 적히는 말.
 *
 * 화면이 브라우저에서 도는지라 본문이 든 큰 내용 파일과 섞지 않는다.
 */

// [F1][데이터] 글쓰기·계정 설정 화면에 적히는 말과, 눌러 넣는 태그 목록
// 실행 흐름 없음. 읽는 곳: components/write/* · app/write·account·posts/[id]/edit/page.tsx
// 까닭 낱말을 문장으로 바꾸는 표 넷(writeMessages·renameMessages·photoMessages·uploadMessages)

export const writeCopy = {
  // 가장 큰 제목
  title: "커뮤니티에 글쓰기",
  lead: "만든 요리를 남기면 다른 사람이 그대로 따라 만들 수 있습니다.",
  // 요리에서 넘어왔을 때의 제목
  titleFromCook: "만든 요리 올리기",
  leadFromCook: "방금 만든 요리로 미리 채워 뒀습니다. 하고 싶은 말만 보태 주세요.",

  titleLabel: "제목",
  titlePlaceholder: "예: 계란 안 익히는 까르보나라",
  summaryLabel: "한 줄 설명 (없어도 됩니다)",
  summaryPlaceholder: "목록 카드에 두세 줄 보이는 글입니다",
  /* 처음에는 "딱지" 였다. 무엇을 적는 칸인지 아무도 몰랐다.
     이제는 **태그로 실제로 쓰이는 값**이라(누르면 같은 태그 글이 모인다)
     이름도 그렇게 부른다. 밑에 어디에 쓰이는지와 예시를 덧붙인다 */
  badgeLabel: "카테고리 (태그)",
  badgeHint: "카드 왼쪽 위에 붙고, 누르면 같은 태그가 붙은 글이 모입니다",
  badgePlaceholder: "예: 한 그릇",
  /* 자주 쓰는 것을 눌러 넣을 수 있게 해 둔다. 손으로 적게만 두면
     "한그릇"·"한 그릇"·"한끼" 처럼 조금씩 다른 태그가 흩어진다 */
  badgePicks: "자주 쓰는 태그",
  minutesLabel: "걸리는 시간(분)",
  toneLabel: "카드 색",
  bodyLabel: "본문",
  bodyPlaceholder: "재료와 순서, 그리고 하면서 알게 된 것을 적어 주세요",

  // 표지
  coverLabel: "카드 그림",
  coverNote:
    "쿡파일럿이 레시피 카드를 그려 글에 붙입니다. 요리명·인분·재료·순서가 모두 들어갑니다.",
  coverMake: "레시피 카드 만들어 붙이기",
  coverBusy: "그리는 중…",
  coverDone: "카드 그림을 붙였습니다. 저장하면 글에 같이 올라갑니다.",
  coverDrawFailed: "그림을 만들지 못했습니다. 다시 눌러 주세요.",

  // 요리에서 왔는데 담아 둔 레시피가 없을 때
  noRecipe: "담아 둔 요리가 없어서 채울 것이 없습니다.",
  noRecipeGo: "요리 고르러 가기",

  cancel: "그만두기",
  save: "올리기",
  saving: "올리는 중…",

  // ---------- 고치기 ----------
  // 같은 폼이 고치기로도 쓰인다. 제목과 단추만 바뀐다
  titleEdit: "글 고치기",
  leadEdit: "고친 내용은 바로 반영됩니다.",
  update: "고치기",
  updating: "고치는 중…",
} as const;

/**
 * 글쓰기 칸에서 눌러 넣을 수 있는 태그들.
 *
 * 손으로만 적게 두면 "한그릇"·"한 그릇"·"한끼" 처럼 조금씩 다른 태그가 흩어지고,
 * 그러면 태그를 눌러도 세 글 중 하나만 모인다. 자주 쓰는 것을 눌러 넣게 해
 * **같은 말로 모이게** 하려는 것이다. 여기 없는 태그는 손으로 적으면 된다.
 *
 * 이미 올라와 있는 글들이 쓰고 있는 말에서 골랐다. 새로 지어내면
 * 목록에 그 태그를 단 글이 하나도 없다.
 */
export const badgePicks: readonly string[] = [
  "한 그릇",
  "메인",
  "밑반찬",
  "파스타",
  "베이킹",
  "디저트",
  "간식",
  "야식",
  "자취요리",
  "에어프라이어",
  "10분완성",
  "비건",
];

/**
 * 안 됐을 때 나오는 말.
 *
 * 까닭만 도메인·유스케이스가 정하고 문장은 여기서 고른다.
 * 무엇을 고쳐야 하는지가 문장에 들어 있어야 한다 — "실패했습니다" 만으로는
 * 사람이 할 수 있는 일이 없다.
 */
export const writeMessages = {
  "title-empty": "제목을 적어 주세요.",
  "title-long": "제목이 너무 깁니다. 80자 안으로 줄여 주세요.",
  "summary-long": "한 줄 설명이 너무 깁니다. 300자 안으로 줄여 주세요.",
  "body-short": "본문을 열 자 이상 적어 주세요.",
  "body-long": "본문이 너무 깁니다. 조금 줄여 주세요.",
  "badge-empty": "카테고리를 적어 주세요. 예: 한 그릇, 파스타, 밑반찬",
  "badge-long": "카테고리가 너무 깁니다. 열두 자 안으로 줄여 주세요.",
  "minutes-range": "걸리는 시간은 1분에서 1440분 사이의 숫자로 적어 주세요.",
  "signed-out": "로그인해야 글을 쓸 수 있습니다.",
  rejected: "저장하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.",
  unreachable: "서버에 다녀오지 못했습니다. 인터넷 연결을 확인해 주세요.",
} as const;

/** 계정 설정 화면에 적히는 말 */
export const accountCopy = {
  title: "계정 설정",
  lead: "커뮤니티에 글을 쓸 때 보이는 이름과 사진, 그리고 요리 채비를 여기서 바꿉니다.",
  nameLabel: "닉네임",
  namePlaceholder: "2~20자",
  save: "바꾸기",
  saving: "바꾸는 중…",
  // 바꾸고 나서 (뒤에 이름이 붙는다)
  done: "닉네임을 바꿨습니다 ·",
  signedOut: "로그인해야 닉네임을 바꿀 수 있습니다.",

  // ---------- 프로필 사진 ----------
  photoLabel: "프로필 사진",
  photoNote:
    "글과 댓글 옆에 동그랗게 붙습니다. 가운데를 정사각형으로 잘라 작게 줄여 올립니다.",
  photoPick: "사진 고르기",
  photoBusy: "올리는 중…",
  photoDone: "프로필 사진을 바꿨습니다.",
  photoDrop: "사진 떼기",
  photoDropped: "프로필 사진을 뗐습니다. 이제 이름 첫 글자가 보입니다.",
  photoNone: "아직 사진이 없습니다. 이름 첫 글자가 대신 보입니다.",

  // ---------- 요리 채비 ----------
  // 홈에 흩어져 있던 링크 셋을 여기로 모았다
  setupLabel: "요리 채비",
  setupNote: "홈 왼쪽에 흩어져 있던 것을 여기로 모았습니다.",
  toVoice: "목소리 바꾸기",
  toKey: "API 키 넣기·바꾸기",
  toShelf: "내 서재 열기",
} as const;

/** 프로필 사진을 못 바꾼 까닭 */
export const photoMessages = {
  "bad-url": "우리 저장소에서 온 사진이 아닙니다. 다시 올려 주세요.",
  "signed-out": "로그인해야 사진을 바꿀 수 있습니다.",
  taken: "저장하지 못했습니다. 잠시 뒤에 다시 해 주세요.",
  rejected: "저장하지 못했습니다. 잠시 뒤에 다시 해 주세요.",
  unreachable: "서버에 다녀오지 못했습니다. 인터넷 연결을 확인해 주세요.",
} as const;

/** 사진을 올리다 걸렸을 때. 올리는 일은 브라우저가 하므로 까닭도 따로다 */
export const uploadMessages = {
  "signed-out": "로그인해야 사진을 올릴 수 있습니다.",
  "not-image": "그림 파일이 아닙니다. png·jpg·webp 로 올려 주세요.",
  rejected: "올리지 못했습니다. 파일이 너무 크거나 형식이 맞지 않습니다.",
  unreachable: "올리지 못했습니다. 인터넷 연결을 확인해 주세요.",
} as const;

/** 닉네임을 못 바꾼 까닭 */
export const renameMessages = {
  "name-empty": "닉네임을 적어 주세요.",
  "name-short": "두 글자 이상 적어 주세요.",
  "name-long": "스무 자 안으로 줄여 주세요.",
  "signed-out": "로그인해야 닉네임을 바꿀 수 있습니다.",
  taken: "이미 누가 쓰고 있는 이름입니다. 다른 이름으로 해 주세요.",
  rejected: "바꾸지 못했습니다. 잠시 뒤에 다시 눌러 주세요.",
  unreachable: "서버에 다녀오지 못했습니다. 인터넷 연결을 확인해 주세요.",
} as const;
