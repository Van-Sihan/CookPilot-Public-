/**
 * 글쓰기 화면에 적히는 말.
 *
 * 화면이 브라우저에서 도는지라 본문이 든 큰 내용 파일과 섞지 않는다.
 */

export const writeCopy = {
  // 가장 큰 제목
  title: "커뮤니티에 글쓰기",
  lead: "만든 요리를 남기면 다른 사람이 그대로 따라 만들 수 있습니다.",
  // 요리에서 넘어왔을 때의 제목
  titleFromCook: "만든 요리 올리기",
  leadFromCook: "방금 만든 요리로 미리 채워 뒀습니다. 하고 싶은 말만 보태 주세요.",

  titleLabel: "제목",
  titlePlaceholder: "예: 계란 안 익히는 까르보나라",
  summaryLabel: "한 줄 요약 (없어도 됩니다)",
  summaryPlaceholder: "목록 카드에 두세 줄 보이는 글입니다",
  badgeLabel: "딱지",
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
} as const;

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
  "summary-long": "요약이 너무 깁니다. 300자 안으로 줄여 주세요.",
  "body-short": "본문을 열 자 이상 적어 주세요.",
  "body-long": "본문이 너무 깁니다. 조금 줄여 주세요.",
  "badge-empty": "딱지를 적어 주세요. 예: 파스타, 밑반찬",
  "badge-long": "딱지가 너무 깁니다. 열두 자 안으로 줄여 주세요.",
  "minutes-range": "걸리는 시간은 1분에서 1440분 사이의 숫자로 적어 주세요.",
  "signed-out": "로그인해야 글을 쓸 수 있습니다.",
  rejected: "저장하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.",
  unreachable: "서버에 다녀오지 못했습니다. 인터넷 연결을 확인해 주세요.",
} as const;

/** 닉네임 화면에 적히는 말 */
export const accountCopy = {
  title: "내 계정",
  lead: "커뮤니티에 글을 쓸 때 이 이름으로 보입니다.",
  nameLabel: "닉네임",
  namePlaceholder: "2~20자",
  save: "바꾸기",
  saving: "바꾸는 중…",
  // 바꾸고 나서 (뒤에 이름이 붙는다)
  done: "닉네임을 바꿨습니다 ·",
  signedOut: "로그인해야 닉네임을 바꿀 수 있습니다.",
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
