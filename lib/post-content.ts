/**
 * 글을 열고 들어갔을 때 나오는 것들 — 본문, 레시피, 댓글, 사진 출처.
 *
 * 목록 카드에 필요한 것(제목·좋아요·꼬리표)은 [[site-content]] 에 있다.
 * 여기서 나누어 둔 까닭은 무게다. 목록 화면은 열여섯 편을 한꺼번에 그리는데
 * 본문과 댓글까지 한 파일에 있으면 카드만 보러 온 사람에게도 다 실려 간다.
 *
 * 나중에 수파베이스 `posts` 표에서 가져오게 되면 이 파일만 없어지고 화면은 그대로다.
 * 그래서 화면이 이 배열을 직접 뒤지지 않고 도메인의 findPostDetail() 을 거치게 해 두었다.
 *
 * **사진은 위키미디어 공용에서 받아 온 것이다.** 우리가 찍은 것이 아니라서
 * 찍은 사람과 허락(라이선스)을 글마다 함께 적어 두고 화면에도 그대로 내보낸다.
 * 지어낸 이름을 넣느니 자리를 비워 두는 편이 낫고, 아예 안 적는 것은 안 된다.
 */

// [F1][데이터] 예시 글 열여섯 편의 속 — 본문·레시피·사진 출처·미리 달린 댓글
// 실행 흐름 없음. 읽는 곳: app/posts/[id]/page.tsx (findPostDetail 로 하나를 고른다)
// 사진마다 찍은 사람과 허락(CC)이 함께 적혀 있다. 화면이 그걸 빠뜨릴 수 없게 타입이 막는다

import type { PhotoCredit, PostDetail } from "@/lib/domain/post";

/**
 * 사진마다의 출처.
 *
 * 이 값은 손으로 옮겨 적은 것이 아니라 커먼즈 API 가 파일 이름으로 돌려준 것을
 * 그대로 넣었다. 검색 차례로 집어 오면 부를 때마다 순서가 흔들려서
 * 사진과 찍은 사람이 어긋난다 — 틀린 출처는 안 적느니만 못하다.
 */
const credits: Record<string, PhotoCredit> = {
  ribeye: { by: "Missvain", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", page: "https://commons.wikimedia.org/wiki/File:Noyo_River_Grill_-_August_2022_-_Sarah_Stierch_03.jpg" },
  carbonara: { by: "Javier Somoza", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Espaguetis_carbonara.jpg" },
  cacao: { by: "Daria Yakovleva", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Piece_of_chocolate_cake_on_a_white_plate_decorated_with_chocolate_sauce.jpg" },
  gyeran: { by: "Nuyos (en.wikipedia)", license: "Public domain", licenseUrl: "", page: "https://commons.wikimedia.org/wiki/File:1005_eggjjim.jpg" },
  bibim: { by: "JeongHO Suh (daecheonnet)", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Bibim-guksu.jpg" },
  curry: { by: "Ocdp", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Beef_curry_rice_003.jpg" },
  focaccia: { by: "Fred Benenson", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Focaccia_Crust.jpg" },
  tofu: { by: "angela n. (Flickr)", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", page: "https://commons.wikimedia.org/wiki/File:Korean_cuisine-Dubu_jorim-01.jpg" },
  "brand-gochujang": { by: "Chloe Lim", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Bibimbap_7.jpg" },
  "brand-oil": { by: "pcamp", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Korean_noodles-Makguksu-02.jpg" },
  "brand-garlic": { by: "Infrogmation", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Garlic_bread_baguettes_2.jpg" },
  "brand-sugar": { by: "Korea.net / Korean Culture and Information Service", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0", page: "https://commons.wikimedia.org/wiki/File:KOCIS_yakgwa,_honey_cookies_(4646996556).jpg" },
  malatanghulu: { by: "N509FZ", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:Malatang_from_Hope_Tree_(20220226172344).jpg" },
  dubai: { by: "Viktorija N. Ivanov", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", page: "https://commons.wikimedia.org/wiki/File:%D0%A7%D0%BE%D0%BA%D0%BE%D0%BB%D0%B0%D0%B4%D0%BD%D0%B8_%D1%98%D0%B0%D0%B3%D0%BE%D0%B4%D0%B8_%D0%B8_%D0%B1%D0%B0%D0%BD%D0%B0%D0%BD%D0%B8.jpg" },
  rose: { by: "jetalone (Flickr)", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", page: "https://commons.wikimedia.org/wiki/File:Korean.snacks-Tteokbokki-08.jpg" },
  croffle: { by: "Andy Li", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", page: "https://commons.wikimedia.org/wiki/File:Oreo_Croffle_-_Fluffy_Fluffy_Dessert_Cafe_2025-06-10.jpg" },
};

/**
 * 열여섯 편의 속.
 *
 * 차례는 [[site-content]] 의 communityPosts 와 맞춰 두었다. 눈으로 대조할 때
 * 두 파일을 나란히 놓고 위에서부터 짚어 갈 수 있어야 빠진 글을 알아챈다.
 */
export const postDetails: readonly PostDetail[] = [
  /* ---------- 인기 ---------- */
  {
    id: "ribeye",
    published: "2026년 8월 9일",
    alt: "그릴 자국이 난 등심 스테이크가 흰 접시에 담겨 있다",
    credit: credits.ribeye,
    intro:
      "집에서 굽는 스테이크가 실패하는 지점은 거의 언제나 하나입니다. 팬이 덜 달았을 때 고기를 올리는 것. 그 한 가지만 고치면 나머지는 저절로 따라옵니다.",
    sections: [
      {
        heading: "굽기 전에 끝나는 일",
        paragraphs: [
          "냉장고에서 꺼낸 고기를 바로 올리지 않습니다. 겉만 익고 속은 차가운 채로 남습니다. 30분 정도 밖에 두어 속까지 실온이 되게 하세요.",
          "그동안 표면의 물기를 키친타월로 눌러 닦습니다. 물기가 남아 있으면 팬 위에서 그 물이 먼저 끓느라 온도가 떨어지고, 구워지는 대신 삶아집니다. 갈색 껍질이 안 생기는 이유가 대개 여기 있습니다.",
        ],
      },
      {
        heading: "불을 다루는 법",
        paragraphs: [
          "팬에서 연기가 얇게 올라올 때까지 기다립니다. 손을 20cm 위에 댔을 때 오래 못 버티는 정도면 됩니다.",
          "올린 뒤 90초 동안은 건드리지 않습니다. 자꾸 들추면 붙으려던 면이 뜯어집니다. 뒤집고 다시 90초, 그다음부터는 30초마다 뒤집어 주면 속이 고르게 익습니다.",
          "버터는 마지막에, 불을 끄고 넣습니다. 처음부터 넣으면 버터가 먼저 타서 쓴맛이 고기에 밴 채로 끝납니다.",
        ],
      },
    ],
    tags: ["스테이크", "혼술안주", "주말요리"],
    recipe: {
      title: "숯불 향 입힌 등심 스테이크",
      servings: 2,
      ingredients: [
        { name: "등심 스테이크용 소고기", amount: "500g (2.5cm 두께)", pantry: false },
        { name: "버터", amount: "30g", pantry: false },
        { name: "통마늘", amount: "5쪽", pantry: false },
        { name: "타임 또는 로즈메리", amount: "2줄기", pantry: false },
        { name: "굵은소금", amount: "1작은술", pantry: true },
        { name: "통후추", amount: "적당량", pantry: true },
        { name: "식용유", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "고기를 냉장고에서 꺼내 실온에 둡니다.", minutes: 30 },
        { text: "키친타월로 표면의 물기를 눌러 닦고 소금과 후추를 양면에 뿌립니다." },
        { text: "팬에 식용유를 두르고 연기가 얇게 오를 때까지 강불로 달굽니다.", minutes: 3 },
        { text: "고기를 올리고 건드리지 않은 채 굽습니다.", minutes: 2 },
        { text: "뒤집어 같은 시간 굽고, 이후 30초마다 뒤집습니다.", minutes: 2 },
        { text: "불을 끄고 버터와 마늘, 허브를 넣어 녹은 버터를 고기 위에 끼얹습니다.", minutes: 1 },
        { text: "도마에 옮겨 덮지 말고 쉬게 둔 뒤 결 반대로 썹니다.", minutes: 8 },
      ],
      source: { kind: "community", chef: "불꽃요리사" },
    },
    comments: [
      { id: "ribeye-1", who: "야식대장", when: "2시간 전", text: "30초마다 뒤집는 거 반신반의했는데 진짜 속이 고르게 익네요. 회색 띠가 거의 안 생겼습니다." },
      { id: "ribeye-2", who: "십오분한끼", when: "5시간 전", text: "쉬게 두는 8분을 못 참고 바로 썰었더니 육즙이 도마에 다 흘렀습니다. 이 단계 진짜 중요하네요." },
      { id: "ribeye-3", who: "냉털장인", when: "1일 전", text: "집 인덕션이라 연기가 잘 안 나서 3분 더 달궜습니다. 화력 약한 분들 참고하세요." },
    ],
  },
  {
    id: "carbonara",
    published: "2026년 8월 7일",
    alt: "검은 접시에 담긴 까르보나라 스파게티",
    credit: credits.carbonara,
    intro:
      "까르보나라가 스크램블이 되는 건 실력이 아니라 온도 문제입니다. 계란은 70도쯤에서 굳습니다. 그 온도를 넘기지 않는 방법만 알면 끝입니다.",
    sections: [
      {
        heading: "불을 끄고 섞는다",
        paragraphs: [
          "면을 건져 팬에 넣은 다음, 계란물을 붓기 전에 불을 완전히 끕니다. 약불로 줄이는 게 아니라 끕니다.",
          "팬 바닥에 남은 열만으로도 계란은 충분히 익습니다. 불이 켜져 있으면 팬 바닥이 100도를 넘어서 닿는 순간부터 덩어리가 집니다.",
        ],
      },
      {
        heading: "면수는 버리지 않는다",
        paragraphs: [
          "면을 삶은 물에는 녹말이 녹아 있습니다. 이 물이 계란과 치즈, 기름을 하나로 붙여 주는 역할을 합니다.",
          "한 국자 떠 두었다가 소스가 뻑뻑하면 한 큰술씩 넣으며 풀어 줍니다. 맹물을 넣으면 묽어지기만 하고 붙지 않습니다.",
        ],
      },
    ],
    tags: ["파스타", "10분완성", "자취요리"],
    recipe: {
      title: "계란 안 익히는 까르보나라",
      servings: 2,
      ingredients: [
        { name: "스파게티면", amount: "180g", pantry: false },
        { name: "관찰레 또는 베이컨", amount: "100g", pantry: false },
        { name: "달걀노른자", amount: "3개", pantry: false },
        { name: "달걀", amount: "1개", pantry: false },
        { name: "페코리노 또는 파르미지아노 치즈", amount: "60g", pantry: false },
        { name: "통후추", amount: "넉넉히", pantry: true },
        { name: "소금", amount: "면 삶는 물용", pantry: true },
      ],
      steps: [
        { text: "큰 냄비에 물을 끓이고 소금을 넣습니다.", minutes: 5 },
        { text: "노른자 3개와 달걀 1개, 간 치즈, 후추를 그릇에 넣고 섞어 둡니다." },
        { text: "베이컨을 팬에 볶아 기름을 냅니다.", minutes: 4 },
        { text: "면을 봉지에 적힌 시간보다 1분 짧게 삶습니다.", minutes: 8 },
        { text: "면수를 한 국자 떠 두고 면을 건져 팬에 넣습니다." },
        { text: "불을 완전히 끄고 30초 기다린 뒤 계란물을 붓고 빠르게 섞습니다.", minutes: 1 },
        { text: "뻑뻑하면 면수를 한 큰술씩 넣어 농도를 맞추고 후추를 더 뿌립니다." },
      ],
      source: { kind: "community", chef: "십오분한끼" },
    },
    comments: [
      { id: "carbonara-1", who: "자취9년차", when: "3시간 전", text: "불 끄고 30초 기다리라는 게 핵심이었네요. 여태 바로 부어서 다 망쳤습니다." },
      { id: "carbonara-2", who: "기름없이바삭", when: "2일 전", text: "베이컨으로 했는데 기름이 너무 많이 나와서 반쯤 덜어 냈습니다. 그래도 충분히 고소해요." },
    ],
  },
  {
    id: "cacao",
    published: "2026년 8월 3일",
    alt: "초콜릿 소스를 두른 케이크 한 조각이 흰 접시에 놓여 있다",
    credit: credits.cacao,
    intro:
      "흑임자와 카카오는 둘 다 볶은 향으로 먹는 재료입니다. 겹치는 듯하지만 흑임자의 고소함이 카카오의 쓴맛을 눌러 줘서 오히려 단맛이 또렷해집니다.",
    sections: [
      {
        heading: "템퍼링을 건너뛰는 방법",
        paragraphs: [
          "제대로 된 템퍼링은 온도계와 대리석판이 필요합니다. 집에서는 코팅용 초콜릿(컴파운드)을 쓰면 그 과정을 통째로 건너뛸 수 있습니다.",
          "맛은 카카오버터 초콜릿이 낫지만, 처음 만드는 사람에게는 굳지 않아 실패하는 쪽이 훨씬 아깝습니다.",
        ],
      },
      {
        heading: "흑임자 가나슈",
        paragraphs: [
          "흑임자는 갈아서 넣는 것보다 볶아서 갈아 넣는 편이 향이 세 배쯤 납니다. 마른 팬에 3분이면 됩니다.",
          "생크림을 끓기 직전까지만 데워 초콜릿에 붓고, 30초 기다렸다가 가운데부터 천천히 저으면 분리되지 않습니다.",
        ],
      },
    ],
    tags: ["디저트", "선물", "주말요리"],
    recipe: {
      title: "흑임자 카카오 스피어",
      servings: 4,
      ingredients: [
        { name: "코팅용 다크초콜릿", amount: "300g", pantry: false },
        { name: "생크림", amount: "120ml", pantry: false },
        { name: "흑임자", amount: "40g", pantry: false },
        { name: "꿀", amount: "1큰술", pantry: false },
        { name: "반구 몰드", amount: "지름 6cm 8개", pantry: false },
        { name: "소금", amount: "한 꼬집", pantry: true },
      ],
      steps: [
        { text: "흑임자를 마른 팬에 볶아 식힌 뒤 곱게 갑니다.", minutes: 3 },
        { text: "초콜릿을 중탕으로 녹입니다.", minutes: 8 },
        { text: "몰드 안쪽에 초콜릿을 얇게 발라 냉장고에서 굳힙니다.", minutes: 15 },
        { text: "생크림을 끓기 직전까지 데워 남은 초콜릿에 붓고 30초 둡니다.", minutes: 2 },
        { text: "가운데부터 천천히 저어 가나슈를 만들고 흑임자와 꿀, 소금을 섞습니다." },
        { text: "굳은 껍질 안에 가나슈를 채우고 다시 냉장합니다.", minutes: 30 },
        { text: "반구 두 개의 단면을 데운 팬에 살짝 녹여 붙입니다." },
      ],
      source: { kind: "community", chef: "디저트요정" },
    },
    comments: [
      { id: "cacao-1", who: "오븐없이굽기", when: "1일 전", text: "오븐 없이 되는 디저트라 반가웠습니다. 반구 붙이는 게 제일 어렵네요." },
      { id: "cacao-2", who: "마라중독자", when: "3일 전", text: "흑임자 볶는 3분 아까워서 그냥 갈았더니 향이 확실히 약합니다. 볶으세요." },
    ],
  },
  {
    id: "gyeran",
    published: "2026년 8월 1일",
    alt: "뚝배기 위로 부풀어 오른 계란찜",
    credit: credits.gyeran,
    intro:
      "식당 계란찜이 수플레처럼 부푸는 건 비법 재료 때문이 아닙니다. 물의 양과 뚜껑, 그리고 마지막 1분 강불. 세 가지가 전부입니다.",
    sections: [
      {
        heading: "계란과 물은 1 대 1",
        paragraphs: [
          "계란 세 개면 물도 같은 부피, 대략 종이컵 하나입니다. 물이 적으면 단단한 계란덩이가 되고, 많으면 익다 말고 흐릅니다.",
          "체에 한 번 거르면 알끈이 빠져 표면이 매끈해집니다. 한 단계 늘어나지만 결과가 눈에 띄게 다릅니다.",
        ],
      },
      {
        heading: "뚜껑을 언제 여는가",
        paragraphs: [
          "중불에서 젓다가 가장자리가 몽글해지면 뚜껑을 덮습니다. 이때부터는 젓지 않습니다.",
          "마지막 1분만 강불로 올리면 안에서 수증기가 몰려 위로 솟습니다. 이 1분을 빼면 그냥 평평한 계란찜입니다.",
        ],
      },
    ],
    tags: ["밑반찬", "10분완성", "아이반찬"],
    recipe: {
      title: "물 한 컵으로 만드는 계란찜",
      servings: 2,
      ingredients: [
        { name: "달걀", amount: "3개", pantry: false },
        { name: "대파", amount: "1/3대", pantry: false },
        { name: "물", amount: "180ml", pantry: true },
        { name: "새우젓 또는 소금", amount: "1작은술", pantry: true },
        { name: "참기름", amount: "1작은술", pantry: true },
      ],
      steps: [
        { text: "달걀을 풀어 체에 한 번 거릅니다." },
        { text: "물과 새우젓을 넣고 고루 섞습니다." },
        { text: "뚝배기에 붓고 중불에서 저으며 데웁니다.", minutes: 4 },
        { text: "가장자리가 몽글해지면 대파를 뿌리고 뚜껑을 덮습니다.", minutes: 4 },
        { text: "마지막에 강불로 올려 부풀립니다.", minutes: 1 },
        { text: "불을 끄고 참기름을 두릅니다." },
      ],
      source: { kind: "community", chef: "냉털장인" },
    },
    comments: [
      { id: "gyeran-1", who: "자취9년차", when: "6시간 전", text: "체에 거르는 거 귀찮아서 안 했는데 확실히 표면이 거칠어요. 다음엔 하겠습니다." },
      { id: "gyeran-2", who: "야식대장", when: "2일 전", text: "뚝배기 없어서 작은 냄비로 했더니 덜 부풉니다. 열이 오래 머무는 그릇이 중요한 듯." },
    ],
  },

  /* ---------- 최신 ---------- */
  {
    id: "bibim",
    published: "2026년 8월 20일",
    alt: "빨간 양념에 비빈 국수가 하얀 그릇에 담겨 있다",
    credit: credits.bibim,
    intro:
      "냉장고에 애매하게 남은 나물이 있으면 버리기 전에 이걸 하세요. 양념장 비율만 외워 두면 무엇을 넣어도 맛이 흔들리지 않습니다.",
    sections: [
      {
        heading: "외울 것은 비율 하나",
        paragraphs: [
          "고추장 2, 식초 1, 설탕 1, 참기름 1. 큰술로 세면 됩니다. 여기에 간장 반 큰술과 다진 마늘 반 큰술을 더하면 완성입니다.",
          "재료가 바뀌어도 이 비율은 그대로 갑니다. 나물이 짜면 식초를, 싱거우면 간장을 반 큰술씩만 조절하세요.",
        ],
      },
      {
        heading: "면을 헹구는 온도",
        paragraphs: [
          "삶은 면은 찬물에 두세 번 헹궈 겉의 전분을 씻어 냅니다. 이 전분이 남으면 양념이 겉돌고 면끼리 붙습니다.",
          "마지막에는 얼음물에 담갔다 건집니다. 면이 조여들면서 씹는 맛이 완전히 달라집니다.",
        ],
      },
    ],
    tags: ["한그릇", "냉털", "15분"],
    recipe: {
      title: "남은 나물로 만드는 비빔국수",
      servings: 2,
      ingredients: [
        { name: "소면", amount: "200g", pantry: false },
        { name: "남은 나물 아무거나", amount: "두 줌", pantry: false },
        { name: "오이", amount: "1/2개", pantry: false },
        { name: "삶은 달걀", amount: "1개", pantry: false },
        { name: "고추장", amount: "2큰술", pantry: true },
        { name: "식초", amount: "1큰술", pantry: true },
        { name: "설탕", amount: "1큰술", pantry: true },
        { name: "참기름", amount: "1큰술", pantry: true },
        { name: "간장", amount: "1/2큰술", pantry: true },
        { name: "다진 마늘", amount: "1/2큰술", pantry: true },
      ],
      steps: [
        { text: "양념 재료를 모두 그릇에 넣고 섞어 둡니다." },
        { text: "오이를 채 썰고 나물은 먹기 좋게 자릅니다." },
        { text: "소면을 삶습니다.", minutes: 3 },
        { text: "찬물에 두세 번 헹구고 얼음물에 담갔다 건집니다.", minutes: 1 },
        { text: "면에 양념장을 먼저 비빈 뒤 나물과 오이를 올려 섞습니다." },
        { text: "삶은 달걀을 반으로 잘라 얹습니다." },
      ],
      source: { kind: "community", chef: "냉털장인" },
    },
    comments: [
      { id: "bibim-1", who: "십오분한끼", when: "4시간 전", text: "양념장 미리 만들어 두니까 진짜 5분 컷이네요. 비율 외웠습니다." },
      { id: "bibim-2", who: "기름없이바삭", when: "1일 전", text: "얼음물 단계 넣었더니 면이 훨씬 쫄깃합니다. 안 하던 건데 계속 하게 될 듯." },
    ],
  },
  {
    id: "curry",
    published: "2026년 8월 18일",
    alt: "밥과 함께 접시에 담긴 카레",
    credit: credits.curry,
    intro:
      "시판 카레에 토마토 두 알만 더하면 값이 두 배쯤 나가는 맛이 납니다. 토마토의 산이 카레의 단맛을 붙잡아 줘서 뒷맛이 깔끔해집니다.",
    sections: [
      {
        heading: "토마토는 처음에 넣는다",
        paragraphs: [
          "양파를 볶다가 토마토를 넣고 형체가 없어질 때까지 으깨며 볶습니다. 이 과정에서 수분이 날아가고 감칠맛만 남습니다.",
          "카레 가루를 넣은 뒤에 토마토를 넣으면 산 때문에 가루가 뭉칩니다. 순서가 뒤바뀌면 안 됩니다.",
        ],
      },
      {
        heading: "불을 끄고 카레를 푼다",
        paragraphs: [
          "카레 고형분이나 가루는 반드시 불을 끄고 넣습니다. 끓는 상태에서 넣으면 겉만 녹고 속은 덩어리로 남습니다.",
          "다 풀린 뒤 약불에서 5분만 더 끓이면 농도가 잡힙니다. 오래 끓이면 탑니다.",
        ],
      },
    ],
    tags: ["한그릇", "밀프렙", "자취요리"],
    recipe: {
      title: "토마토 두 알로 끓인 카레",
      servings: 4,
      ingredients: [
        { name: "시판 카레", amount: "1/2팩 (100g)", pantry: false },
        { name: "완숙 토마토", amount: "2개", pantry: false },
        { name: "양파", amount: "1개", pantry: false },
        { name: "감자", amount: "2개", pantry: false },
        { name: "당근", amount: "1/2개", pantry: false },
        { name: "돼지고기 앞다리살", amount: "200g", pantry: false },
        { name: "물", amount: "700ml", pantry: true },
        { name: "식용유", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "채소를 한 입 크기로 썹니다.", minutes: 8 },
        { text: "냄비에 기름을 두르고 양파를 갈색이 돌 때까지 볶습니다.", minutes: 7 },
        { text: "토마토를 넣고 으깨며 수분이 날아갈 때까지 볶습니다.", minutes: 5 },
        { text: "고기를 넣어 겉면을 익힙니다.", minutes: 3 },
        { text: "감자와 당근, 물을 넣고 끓입니다.", minutes: 12 },
        { text: "불을 끄고 카레를 넣어 완전히 풀어 줍니다." },
        { text: "약불에서 저으며 농도를 잡습니다.", minutes: 5 },
      ],
      source: { kind: "community", chef: "자취9년차" },
    },
    comments: [
      { id: "curry-1", who: "냉털장인", when: "1일 전", text: "토마토 넣는 순서가 이유가 있었군요. 전에 가루 넣고 넣었다가 덩어리져서 고생했습니다." },
      { id: "curry-2", who: "오븐없이굽기", when: "3일 전", text: "4인분 해서 밀프렙으로 나눠 뒀습니다. 다음 날이 더 맛있어요." },
    ],
  },
  {
    id: "focaccia",
    published: "2026년 8월 16일",
    alt: "로즈메리와 굵은소금을 얹어 구운 포카치아 윗면",
    credit: credits.focaccia,
    intro:
      "반죽을 치대지 않습니다. 물을 많이 넣고 시간에게 일을 맡기면 손으로 하는 것보다 글루텐이 잘 잡힙니다.",
    sections: [
      {
        heading: "수분이 70%를 넘어야 한다",
        paragraphs: [
          "밀가루 500g에 물 350ml. 이 정도면 손에 심하게 들러붙습니다. 그게 정상입니다.",
          "물이 적으면 치대야만 반죽이 됩니다. 물이 많으면 반죽 속에서 밀가루가 스스로 늘어나며 연결됩니다.",
        ],
      },
      {
        heading: "접기 네 번, 그리고 기다림",
        paragraphs: [
          "30분마다 반죽 가장자리를 잡아 가운데로 접습니다. 네 번이면 충분합니다. 접을 때마다 반죽이 눈에 띄게 탄력을 얻습니다.",
          "그다음 냉장고에서 하룻밤 둡니다. 급하면 실온 2시간으로도 되지만, 하룻밤 둔 쪽이 향이 훨씬 깊습니다.",
        ],
      },
    ],
    tags: ["베이킹", "노반죽", "주말요리"],
    recipe: {
      title: "반죽 안 치는 포카치아",
      servings: 6,
      ingredients: [
        { name: "강력분", amount: "500g", pantry: false },
        { name: "인스턴트 드라이이스트", amount: "4g", pantry: false },
        { name: "올리브유", amount: "60ml", pantry: false },
        { name: "로즈메리", amount: "3줄기", pantry: false },
        { name: "물", amount: "350ml (미지근한 것)", pantry: true },
        { name: "소금", amount: "10g", pantry: true },
        { name: "굵은소금", amount: "적당량", pantry: true },
      ],
      steps: [
        { text: "물에 이스트를 풀고 밀가루와 소금을 넣어 주걱으로만 섞습니다.", minutes: 3 },
        { text: "30분마다 반죽을 네 귀퉁이에서 가운데로 접습니다. 네 번 반복합니다.", minutes: 120 },
        { text: "뚜껑을 덮어 냉장고에서 하룻밤 둡니다.", minutes: 720 },
        { text: "기름을 넉넉히 바른 팬에 반죽을 펴고 실온에서 부풀립니다.", minutes: 60 },
        { text: "손가락으로 반죽 곳곳을 깊이 눌러 구멍을 냅니다." },
        { text: "올리브유와 로즈메리, 굵은소금을 뿌립니다." },
        { text: "220도로 예열한 오븐에서 굽습니다.", minutes: 22 },
      ],
      source: { kind: "community", chef: "오븐없이굽기" },
    },
    comments: [
      { id: "focaccia-1", who: "디저트요정", when: "2일 전", text: "손에 들러붙는 게 정상이라는 말에 안심했습니다. 밀가루 더 넣을 뻔했어요." },
      { id: "focaccia-2", who: "자취9년차", when: "4일 전", text: "실온 2시간 버전으로 했는데도 충분히 맛있습니다. 다음엔 하룻밤 해 보겠습니다." },
    ],
  },
  {
    id: "tofu",
    published: "2026년 8월 14일",
    alt: "매콤한 양념을 두른 두부 조각이 그릇에 담겨 있다",
    credit: credits.tofu,
    intro:
      "튀기지 않고 바삭하게 만드는 방법은 물기를 빼는 것뿐입니다. 두부 안에 든 물이 에어프라이어 안에서 증기가 되어 겉을 눅눅하게 만듭니다.",
    sections: [
      {
        heading: "누르는 시간이 곧 식감",
        paragraphs: [
          "두부를 키친타월로 감싸고 접시 두어 장을 올려 20분 둡니다. 물이 눈에 띄게 나옵니다.",
          "급할 때는 전자레인지에 2분 돌린 뒤 눌러도 됩니다. 열이 물을 밖으로 밀어냅니다.",
        ],
      },
      {
        heading: "전분은 얇게, 양념은 나중에",
        paragraphs: [
          "감자전분을 얇게만 묻힙니다. 두껍게 묻히면 겉이 떡처럼 됩니다. 체에 쳐서 털어 내면 알맞습니다.",
          "양념은 다 구운 뒤 버무립니다. 굽기 전에 바르면 설탕이 타서 씁니다.",
        ],
      },
    ],
    tags: ["간식", "에어프라이어", "비건"],
    recipe: {
      title: "에어프라이어 두부강정",
      servings: 2,
      ingredients: [
        { name: "부침용 두부", amount: "1모 (300g)", pantry: false },
        { name: "감자전분", amount: "3큰술", pantry: false },
        { name: "고추장", amount: "1큰술", pantry: true },
        { name: "케첩", amount: "1큰술", pantry: true },
        { name: "물엿", amount: "1큰술", pantry: true },
        { name: "간장", amount: "1작은술", pantry: true },
        { name: "다진 마늘", amount: "1작은술", pantry: true },
        { name: "식용유", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "두부를 사방 3cm로 썰어 키친타월로 감싸고 눌러 물기를 뺍니다.", minutes: 20 },
        { text: "감자전분을 체에 쳐 얇게 묻히고 여분을 털어 냅니다." },
        { text: "기름을 살짝 뿌려 200도 에어프라이어에 굽습니다.", minutes: 12 },
        { text: "한 번 흔들어 뒤집고 더 굽습니다.", minutes: 5 },
        { text: "팬에 양념 재료를 넣고 약불에서 끓입니다.", minutes: 2 },
        { text: "불을 끄고 구운 두부를 넣어 재빨리 버무립니다." },
      ],
      source: { kind: "community", chef: "기름없이바삭" },
    },
    comments: [
      { id: "tofu-1", who: "마라중독자", when: "1일 전", text: "전자레인지 2분 방법 써 봤는데 물 진짜 많이 나옵니다. 시간 없을 때 좋네요." },
      { id: "tofu-2", who: "야식대장", when: "5일 전", text: "양념을 미리 발랐다가 태워 먹은 사람입니다. 나중에 버무리세요 정말." },
    ],
  },

  /* ---------- 브랜드 레시피 ----------
     여기 브랜드 이름은 지어낸 것이다. 진짜 회사 이름을 붙이면 그 회사가 쓰지도 않은
     글을 쓴 것처럼 된다. 제휴가 붙으면 그때 진짜 이름으로 바꾼다 */
  {
    id: "brand-gochujang",
    published: "2026년 8월 12일",
    alt: "나물과 고추장을 올린 비빔밥이 그릇에 담겨 있다",
    credit: credits["brand-gochujang"],
    intro:
      "비빔밥이 밋밋해지는 건 나물 탓이 아니라 밥 탓입니다. 질게 지은 밥에 비비면 양념이 밥알에 안 붙고 겉돕니다.",
    sections: [
      {
        heading: "밥을 고슬하게, 그리고 한 김 식혀",
        paragraphs: [
          "물을 평소보다 한 눈금 적게 잡습니다. 밥알이 서 있어야 비볐을 때 뭉치지 않습니다.",
          "지은 밥을 넓은 그릇에 옮겨 한 김 식힙니다. 뜨거운 밥에 바로 비비면 나물이 익어 물이 나옵니다.",
        ],
      },
      {
        heading: "양념장은 비율만",
        paragraphs: [
          "고추장 2, 참기름 1, 설탕 0.5, 다진 마늘 0.5. 큰술로 세면 됩니다.",
          "나물이 이미 간이 되어 있으므로 양념장은 이 정도가 맞습니다. 더 넣으면 나물 맛이 다 덮입니다.",
          "매실청이 있으면 설탕 대신 같은 양을 넣습니다. 단맛이 덜 튑니다.",
        ],
      },
    ],
    tags: ["한그릇", "나물", "20분"],
    recipe: {
      title: "태양초 고추장으로 비비는 나물 비빔밥",
      servings: 2,
      ingredients: [
        { name: "밥", amount: "2공기 (고슬하게)", pantry: false },
        { name: "시금치나물", amount: "한 줌", pantry: false },
        { name: "콩나물", amount: "한 줌", pantry: false },
        { name: "애호박", amount: "1/2개", pantry: false },
        { name: "당근", amount: "1/3개", pantry: false },
        { name: "달걀", amount: "2개", pantry: false },
        { name: "고추장", amount: "2큰술", pantry: true },
        { name: "참기름", amount: "1큰술", pantry: true },
        { name: "설탕", amount: "1/2큰술", pantry: true },
        { name: "다진 마늘", amount: "1/2큰술", pantry: true },
        { name: "소금", amount: "적당량", pantry: true },
        { name: "식용유", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "밥을 평소보다 물 한 눈금 적게 잡아 짓습니다.", minutes: 20 },
        { text: "고추장·참기름·설탕·다진 마늘을 섞어 양념장을 만듭니다." },
        { text: "콩나물을 소금 넣은 물에 삶아 건집니다.", minutes: 5 },
        { text: "애호박과 당근을 채 썰어 소금 간해 각각 볶습니다.", minutes: 6 },
        { text: "달걀을 반숙 프라이로 부칩니다.", minutes: 3 },
        { text: "지은 밥을 넓은 그릇에 옮겨 한 김 식힙니다.", minutes: 3 },
        { text: "밥 위에 나물을 돌려 담고 달걀을 올린 뒤 양념장을 곁들입니다." },
      ],
      source: { kind: "community", chef: "한들식품" },
    },
    comments: [
      { id: "bgo-1", who: "냉털장인", when: "2일 전", text: "밥을 한 김 식히라는 게 이유가 있었네요. 뜨거울 때 비볐더니 나물에서 물이 나왔습니다." },
      { id: "bgo-2", who: "자취9년차", when: "6일 전", text: "매실청으로 바꿔서 했는데 단맛이 덜 튀어서 좋았습니다." },
    ],
  },
  {
    id: "brand-oil",
    published: "2026년 8월 10일",
    alt: "김과 양념을 얹은 막국수 위에 수란이 올라가 있다",
    credit: credits["brand-oil"],
    intro:
      "막국수는 양념을 적게 쓸수록 좋아집니다. 들기름 한 큰술과 간장, 김만 있으면 메밀 향이 살아납니다.",
    sections: [
      {
        heading: "들기름은 새것으로",
        paragraphs: [
          "들기름은 산패가 빠릅니다. 열어 두고 몇 달 지난 것은 향 대신 쿰쿰한 냄새가 납니다.",
          "냉장고에 넣어 두면 훨씬 오래 갑니다. 이 요리는 기름 향이 주인공이라 여기서 갈립니다.",
        ],
      },
      {
        heading: "면은 찬물에 조여 준다",
        paragraphs: [
          "메밀면은 삶는 시간이 짧습니다. 봉지에 적힌 시간을 넘기면 뚝뚝 끊어집니다.",
          "삶자마자 찬물에 헹구고 얼음물에 한 번 담급니다. 이 과정이 메밀면의 씹는 맛을 만듭니다.",
        ],
      },
    ],
    tags: ["한그릇", "10분완성", "여름"],
    recipe: {
      title: "들기름 한 큰술로 끝내는 막국수",
      servings: 2,
      ingredients: [
        { name: "메밀 막국수 면", amount: "2인분", pantry: false },
        { name: "들기름", amount: "2큰술", pantry: false },
        { name: "김가루", amount: "한 줌", pantry: false },
        { name: "달걀", amount: "2개", pantry: false },
        { name: "간장", amount: "2큰술", pantry: true },
        { name: "통깨", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "물을 끓여 수란을 만듭니다.", minutes: 4 },
        { text: "면을 봉지에 적힌 시간대로 삶습니다.", minutes: 4 },
        { text: "찬물에 헹구고 얼음물에 담갔다 건집니다.", minutes: 1 },
        { text: "그릇에 면을 담고 들기름과 간장을 둘러 비빕니다." },
        { text: "김가루와 통깨를 뿌리고 수란을 올립니다." },
      ],
      source: { kind: "community", chef: "고운밥상" },
    },
    comments: [
      { id: "boi-1", who: "십오분한끼", when: "3일 전", text: "들기름 냉장 보관하라는 말 듣고 바꿨더니 향이 다릅니다." },
    ],
  },
  {
    id: "brand-garlic",
    published: "2026년 8월 8일",
    alt: "마늘과 허브를 올려 구운 바게트 두 조각",
    credit: credits["brand-garlic"],
    intro:
      "마늘빵이 쓴맛이 나는 건 마늘을 태웠기 때문입니다. 마늘은 버터 안에서 익혀 두고, 빵은 나중에 굽습니다.",
    sections: [
      {
        heading: "마늘버터를 먼저 만든다",
        paragraphs: [
          "실온에 둔 버터에 다진 마늘과 파슬리를 섞습니다. 불에 올리지 않습니다.",
          "이 상태로 냉장고에 30분 두면 마늘 향이 버터에 배어듭니다. 이 시간이 맛의 절반입니다.",
        ],
      },
      {
        heading: "굽는 온도는 180도",
        paragraphs: [
          "200도가 넘어가면 표면의 마늘 조각이 먼저 탑니다. 180도에서 조금 더 오래 굽는 편이 낫습니다.",
          "마지막 2분만 220도로 올리면 겉만 바삭해지고 마늘은 타지 않습니다.",
        ],
      },
    ],
    tags: ["베이킹", "간식", "혼술안주"],
    recipe: {
      title: "다진마늘 한 통으로 굽는 마늘빵",
      servings: 4,
      ingredients: [
        { name: "바게트", amount: "1개", pantry: false },
        { name: "버터", amount: "80g (실온)", pantry: false },
        { name: "다진 마늘", amount: "3큰술", pantry: false },
        { name: "파슬리 가루", amount: "1큰술", pantry: false },
        { name: "설탕", amount: "1작은술", pantry: true },
        { name: "소금", amount: "한 꼬집", pantry: true },
      ],
      steps: [
        { text: "실온 버터에 마늘, 파슬리, 설탕, 소금을 넣고 섞습니다.", minutes: 3 },
        { text: "냉장고에 두어 향이 배게 합니다.", minutes: 30 },
        { text: "바게트를 2cm 두께로 어슷하게 썹니다." },
        { text: "단면에 마늘버터를 고루 바릅니다." },
        { text: "180도 오븐에서 굽습니다.", minutes: 10 },
        { text: "마지막에 220도로 올려 겉만 바삭하게 합니다.", minutes: 2 },
      ],
      source: { kind: "community", chef: "청수식품" },
    },
    comments: [
      { id: "bga-1", who: "오븐없이굽기", when: "4일 전", text: "에어프라이어 180도로 8분 했더니 똑같이 됐습니다." },
      { id: "bga-2", who: "디저트요정", when: "6일 전", text: "버터 냉장 30분이 진짜 차이 납니다. 급할 때랑 비교해 봤어요." },
    ],
  },
  {
    id: "brand-sugar",
    published: "2026년 8월 5일",
    alt: "꽃 모양으로 찍어 낸 약과가 나무 그릇에 쌓여 있다",
    credit: credits["brand-sugar"],
    intro:
      "약과가 딱딱해지는 건 반죽을 치댔기 때문입니다. 밀가루에 기름을 먼저 비벼 넣으면 글루텐이 생기지 않아 부서지듯 부드럽습니다.",
    sections: [
      {
        heading: "기름을 먼저, 물을 나중에",
        paragraphs: [
          "밀가루와 참기름을 손으로 비벼 고슬고슬한 상태를 만든 다음 체에 내립니다. 이 과정이 약과의 결을 만듭니다.",
          "그다음에야 꿀물을 넣고 뭉칩니다. 치대지 말고 눌러 뭉치기만 합니다.",
        ],
      },
      {
        heading: "두 번 튀긴다",
        paragraphs: [
          "100도쯤 되는 낮은 기름에 넣어 천천히 떠오르게 합니다. 처음부터 뜨거우면 겉만 익고 속이 안 익습니다.",
          "떠오르면 건져 기름 온도를 160도로 올리고 다시 넣어 색을 냅니다.",
        ],
      },
    ],
    tags: ["디저트", "명절", "선물"],
    recipe: {
      title: "하얀설탕으로 굽는 홈메이드 약과",
      servings: 6,
      ingredients: [
        { name: "중력분", amount: "200g", pantry: false },
        { name: "참기름", amount: "4큰술", pantry: false },
        { name: "꿀", amount: "2큰술", pantry: false },
        { name: "생강청", amount: "1큰술", pantry: false },
        { name: "설탕", amount: "100g", pantry: true },
        { name: "물", amount: "100ml", pantry: true },
        { name: "소금", amount: "한 꼬집", pantry: true },
        { name: "튀김용 기름", amount: "넉넉히", pantry: true },
      ],
      steps: [
        { text: "설탕과 물을 끓여 조청을 만들고 식힙니다.", minutes: 15 },
        { text: "밀가루와 참기름, 소금을 손으로 비벼 체에 내립니다.", minutes: 5 },
        { text: "꿀과 생강청, 물을 넣고 치대지 말고 눌러 뭉칩니다." },
        { text: "1cm 두께로 밀어 틀로 찍고 가운데를 꼬치로 뚫습니다.", minutes: 10 },
        { text: "100도 기름에서 떠오를 때까지 천천히 튀깁니다.", minutes: 12 },
        { text: "160도로 올려 색이 날 때까지 다시 튀깁니다.", minutes: 3 },
        { text: "따뜻할 때 조청에 담가 하룻밤 재웁니다.", minutes: 720 },
      ],
      source: { kind: "community", chef: "달소금" },
    },
    comments: [
      { id: "bsu-1", who: "불꽃요리사", when: "1주 전", text: "낮은 온도에서 시작하는 게 핵심이네요. 급하게 했다가 속이 하얗게 남았습니다." },
    ],
  },

  /* ---------- SNS 유행 ---------- */
  {
    id: "malatanghulu",
    published: "2026년 8월 21일",
    alt: "채소와 두부가 담긴 마라탕 한 그릇",
    credit: credits.malatanghulu,
    intro:
      "매운 것 먹고 단 것 먹는 그 순서를 한 상에 차립니다. 마라탕과 탕후루를 같이 만들면 서로 기다리는 시간이 딱 맞습니다.",
    sections: [
      {
        heading: "마라 국물은 기름에 향을 연다",
        paragraphs: [
          "마라 소스는 물에 바로 풀지 않습니다. 기름에 먼저 볶아야 화자오와 고추의 향이 열립니다.",
          "약불에서 1분만 볶으면 됩니다. 이때 냄새가 확 올라오는데 그게 신호입니다. 더 볶으면 탑니다.",
        ],
      },
      {
        heading: "탕후루 시럽은 젓지 않는다",
        paragraphs: [
          "설탕과 물을 냄비에 넣고 끓이기 시작하면 그때부터는 손대지 않습니다. 저으면 설탕이 재결정되어 뿌옇게 굳습니다.",
          "젓가락으로 시럽을 찍어 찬물에 떨어뜨렸을 때 딱 소리가 나며 굳으면 다 된 것입니다. 온도계가 있으면 150도입니다.",
        ],
      },
    ],
    tags: ["야식", "SNS유행", "매운맛"],
    recipe: {
      title: "마라탕후루 한 상 차리기",
      servings: 2,
      ingredients: [
        { name: "마라탕 소스", amount: "2큰술", pantry: false },
        { name: "청경채", amount: "3포기", pantry: false },
        { name: "숙주", amount: "한 줌", pantry: false },
        { name: "건두부", amount: "100g", pantry: false },
        { name: "분모자", amount: "60g", pantry: false },
        { name: "딸기 또는 포도", amount: "10알", pantry: false },
        { name: "설탕", amount: "150g", pantry: true },
        { name: "물", amount: "800ml + 50ml", pantry: true },
        { name: "식용유", amount: "1큰술", pantry: true },
      ],
      steps: [
        { text: "분모자를 미지근한 물에 불립니다.", minutes: 20 },
        { text: "냄비에 기름을 두르고 마라 소스를 약불에 볶습니다.", minutes: 1 },
        { text: "물 800ml를 붓고 끓입니다.", minutes: 5 },
        { text: "단단한 재료부터 넣어 익힙니다.", minutes: 6 },
        { text: "과일을 씻어 물기를 완전히 닦고 꼬치에 꽂습니다.", minutes: 5 },
        { text: "다른 냄비에 설탕과 물 50ml를 넣고 젓지 않은 채 끓입니다.", minutes: 8 },
        { text: "시럽을 과일에 입혀 유산지 위에서 굳힙니다.", minutes: 3 },
      ],
      source: { kind: "community", chef: "마라중독자" },
    },
    comments: [
      { id: "mala-1", who: "야식대장", when: "1시간 전", text: "시럽 젓지 말라는 거 알면서도 손이 갔습니다. 뿌옇게 굳었어요. 두 번째는 성공." },
      { id: "mala-2", who: "기름없이바삭", when: "8시간 전", text: "과일 물기 안 닦으면 시럽이 안 붙습니다. 이거 중요하네요." },
      { id: "mala-3", who: "십오분한끼", when: "2일 전", text: "분모자 불리는 20분에 탕후루 만들면 시간이 딱 맞습니다." },
    ],
  },
  {
    id: "dubai",
    published: "2026년 8월 19일",
    alt: "초콜릿을 입힌 딸기가 검은 접시에 담겨 있다",
    credit: credits.dubai,
    intro:
      "두바이 초콜릿의 정체는 카다이프입니다. 이 얇은 면을 버터에 볶아 바삭하게 만든 뒤 피스타치오 크림과 섞는 것이 전부입니다.",
    sections: [
      {
        heading: "카다이프는 갈색이 될 때까지",
        paragraphs: [
          "카다이프를 잘게 잘라 버터에 볶습니다. 진한 갈색이 될 때까지 볶아야 바삭함이 오래 갑니다.",
          "덜 볶으면 크림의 수분을 먹고 금방 눅눅해집니다. 이 단계에서 인내심이 필요합니다.",
        ],
      },
      {
        heading: "컵으로 만들면 훨씬 쉽다",
        paragraphs: [
          "초콜릿 바 형태로 만들려면 몰드에 껍질을 올리고 굳히는 과정이 필요합니다. 컵에 층으로 쌓으면 그 과정이 없습니다.",
          "맨 아래 초콜릿, 가운데 카다이프 크림, 위에 딸기. 세 층이면 됩니다.",
        ],
      },
    ],
    tags: ["디저트", "SNS유행", "선물"],
    recipe: {
      title: "두바이 초콜릿 딸기컵",
      servings: 4,
      ingredients: [
        { name: "카다이프", amount: "100g", pantry: false },
        { name: "피스타치오 스프레드", amount: "150g", pantry: false },
        { name: "다크초콜릿", amount: "200g", pantry: false },
        { name: "딸기", amount: "12알", pantry: false },
        { name: "버터", amount: "40g", pantry: false },
        { name: "소금", amount: "한 꼬집", pantry: true },
      ],
      steps: [
        { text: "카다이프를 1cm 길이로 잘게 자릅니다.", minutes: 5 },
        { text: "버터를 녹인 팬에 진한 갈색이 될 때까지 볶습니다.", minutes: 8 },
        { text: "한 김 식힌 뒤 피스타치오 스프레드와 소금을 섞습니다." },
        { text: "초콜릿을 중탕으로 녹입니다.", minutes: 6 },
        { text: "컵 바닥에 초콜릿을 붓고 냉장고에서 굳힙니다.", minutes: 10 },
        { text: "카다이프 크림을 올리고 남은 초콜릿을 덮습니다." },
        { text: "반으로 자른 딸기를 얹고 다시 냉장합니다.", minutes: 15 },
      ],
      source: { kind: "community", chef: "디저트요정" },
    },
    comments: [
      { id: "dubai-1", who: "마라중독자", when: "1일 전", text: "카다이프 덜 볶았다가 다음 날 눅눅해졌습니다. 갈색 될 때까지가 맞아요." },
      { id: "dubai-2", who: "자취9년차", when: "4일 전", text: "컵으로 하니까 확실히 쉽네요. 바 만들려다 포기했던 사람입니다." },
    ],
  },
  {
    id: "rose",
    published: "2026년 8월 17일",
    alt: "붉은 양념에 버무린 떡볶이가 접시에 담겨 있다",
    credit: credits.rose,
    intro:
      "생크림 없이 우유로 로제를 만들면 대개 묽어집니다. 떡에서 나오는 전분으로 농도를 잡으면 우유만으로도 걸쭉해집니다.",
    sections: [
      {
        heading: "물을 적게, 우유는 나중에",
        paragraphs: [
          "처음에는 물을 조금만 넣고 떡을 익힙니다. 떡의 전분이 물에 녹아 나오면서 국물이 걸쭉해집니다.",
          "우유는 그 뒤에 넣습니다. 처음부터 넣고 끓이면 우유 단백질이 뭉쳐 알갱이가 생깁니다.",
        ],
      },
      {
        heading: "고춧가루보다 고추장을 줄인다",
        paragraphs: [
          "로제는 매운맛보다 색과 부드러움입니다. 고추장을 반으로 줄이고 고춧가루로 색을 채우면 텁텁하지 않습니다.",
          "마지막에 버터 한 조각을 넣으면 우유만으로도 생크림 비슷한 질감이 납니다.",
        ],
      },
    ],
    tags: ["야식", "SNS유행", "10분완성"],
    recipe: {
      title: "우유로 만드는 로제 떡볶이",
      servings: 2,
      ingredients: [
        { name: "밀떡", amount: "300g", pantry: false },
        { name: "우유", amount: "300ml", pantry: false },
        { name: "소시지", amount: "4개", pantry: false },
        { name: "양파", amount: "1/2개", pantry: false },
        { name: "버터", amount: "10g", pantry: false },
        { name: "고추장", amount: "1큰술", pantry: true },
        { name: "고춧가루", amount: "1큰술", pantry: true },
        { name: "설탕", amount: "1큰술", pantry: true },
        { name: "간장", amount: "1큰술", pantry: true },
        { name: "다진 마늘", amount: "1작은술", pantry: true },
        { name: "물", amount: "100ml", pantry: true },
      ],
      steps: [
        { text: "밀떡을 미지근한 물에 담가 둡니다.", minutes: 10 },
        { text: "팬에 물 100ml와 양념 재료를 넣고 끓입니다.", minutes: 2 },
        { text: "떡과 양파, 소시지를 넣고 저으며 익힙니다.", minutes: 5 },
        { text: "국물이 걸쭉해지면 우유를 붓고 약불로 줄입니다.", minutes: 4 },
        { text: "불을 끄고 버터를 넣어 녹입니다." },
      ],
      source: { kind: "community", chef: "야식대장" },
    },
    comments: [
      { id: "rose-1", who: "냉털장인", when: "2일 전", text: "우유를 나중에 넣으라는 이유가 있었네요. 전에 처음부터 넣었다가 알갱이 생겼습니다." },
      { id: "rose-2", who: "기름없이바삭", when: "5일 전", text: "버터 한 조각으로 이렇게 달라질 줄 몰랐습니다." },
    ],
  },
  {
    id: "croffle",
    published: "2026년 8월 15일",
    alt: "크림과 오레오 가루를 올린 크로플이 접시에 놓여 있다",
    credit: credits.croffle,
    intro:
      "냉동 생지를 와플기에 눌러 굽는 것이 전부입니다. 다만 눌러 두는 시간과 생지의 상태에서 결과가 크게 갈립니다.",
    sections: [
      {
        heading: "생지는 반쯤 녹은 상태로",
        paragraphs: [
          "꽁꽁 언 생지를 바로 누르면 겉만 타고 속이 안 익습니다. 실온에 10분쯤 두어 손가락으로 눌리는 정도가 되면 알맞습니다.",
          "완전히 녹으면 반대로 층이 무너져 그냥 빵이 됩니다. 반쯤이 정답입니다.",
        ],
      },
      {
        heading: "와플기는 예열이 전부",
        paragraphs: [
          "충분히 달군 와플기에 넣어야 버터가 순간적으로 녹으며 겉이 튀겨지듯 바삭해집니다.",
          "종이호일을 깔면 설탕이 눌어붙지 않고 설거지가 훨씬 쉽습니다.",
        ],
      },
    ],
    tags: ["간식", "SNS유행", "10분완성"],
    recipe: {
      title: "냉동 생지로 굽는 크로플",
      servings: 2,
      ingredients: [
        { name: "냉동 크루아상 생지", amount: "4개", pantry: false },
        { name: "휘핑크림", amount: "100ml", pantry: false },
        { name: "오레오 쿠키", amount: "4개", pantry: false },
        { name: "설탕", amount: "2큰술", pantry: true },
      ],
      steps: [
        { text: "생지를 실온에 두어 반쯤 녹입니다.", minutes: 10 },
        { text: "와플기를 충분히 예열합니다.", minutes: 5 },
        { text: "생지에 설탕을 살짝 묻혀 와플기에 넣고 누릅니다.", minutes: 4 },
        { text: "식힘망에 올려 바삭해질 때까지 식힙니다.", minutes: 3 },
        { text: "휘핑크림을 올리고 부순 오레오를 뿌립니다." },
      ],
      source: { kind: "community", chef: "오븐없이굽기" },
    },
    comments: [
      { id: "croffle-1", who: "디저트요정", when: "3일 전", text: "식힘망에 올려 식히는 거 안 하면 밑면이 눅눅해집니다. 꼭 하세요." },
      { id: "croffle-2", who: "야식대장", when: "1주 전", text: "종이호일 깔았더니 설거지가 없어졌습니다." },
    ],
  },
];
