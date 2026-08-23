# 요리 사진 출처

이 폴더의 사진은 **우리가 찍은 것이 아니다.** 위키미디어 공용(Wikimedia
Commons)에서 받아 온, 허락(라이선스)이 분명한 사진들이다.

CC BY / CC BY-SA 는 **찍은 사람을 밝히는 것이 조건**이다. 그래서 글을 열면
사진 바로 밑에 찍은 사람과 허락문 링크가 나온다 —
`components/post/post-article.tsx` 의 `.pd-credit` 줄이 그 자리다.
사진을 바꾸거나 더할 때 그 줄을 빠뜨리면 조건을 어기는 것이 된다.

출처 값은 손으로 옮겨 적지 않았다. 커먼즈 API 에 **파일 이름으로** 물어
받은 것을 그대로 넣었다. 검색 차례로 집어 오면 부를 때마다 순서가 흔들려
사진과 찍은 사람이 어긋난다 — 틀린 출처는 안 적느니만 못하다.

값이 적힌 곳은 `lib/post-content.ts` 의 `credits` 다. 이 표는 사람이 읽으려고
따로 적어 둔 사본이므로, 한쪽만 고치면 두 곳이 어긋난다.

| 파일 | 찍은 사람 | 허락 | 원래 자리 |
|---|---|---|---|
| `ribeye.jpg` | Missvain | CC BY 4.0 | [Noyo River Grill - August 2022 - Sarah Stierch 03.jpg](https://commons.wikimedia.org/wiki/File:Noyo_River_Grill_-_August_2022_-_Sarah_Stierch_03.jpg) |
| `carbonara.jpg` | Javier Somoza | CC BY-SA 4.0 | [Espaguetis carbonara.jpg](https://commons.wikimedia.org/wiki/File:Espaguetis_carbonara.jpg) |
| `cacao.jpg` | Daria Yakovleva Minor edits made by Subsidiary account | CC0 | [Piece of chocolate cake on a white plate decorated with chocolate sauce.jpg](https://commons.wikimedia.org/wiki/File:Piece_of_chocolate_cake_on_a_white_plate_decorated_with_chocolate_sauce.jpg) |
| `gyeran.jpg` | Nuyos at en.wikipedia | Public domain | [1005 eggjjim.jpg](https://commons.wikimedia.org/wiki/File:1005_eggjjim.jpg) |
| `bibim.jpg` | JeongHO Suh (daecheonnet) | CC0 | [Bibim-guksu.jpg](https://commons.wikimedia.org/wiki/File:Bibim-guksu.jpg) |
| `curry.jpg` | Ocdp | CC0 | [Beef curry rice 003.jpg](https://commons.wikimedia.org/wiki/File:Beef_curry_rice_003.jpg) |
| `focaccia.jpg` | Fred Benenson | CC BY-SA 4.0 | [Focaccia Crust.jpg](https://commons.wikimedia.org/wiki/File:Focaccia_Crust.jpg) |
| `tofu.jpg` | angela n. at Flickr | CC BY-SA 2.0 | [Korean cuisine-Dubu jorim-01.jpg](https://commons.wikimedia.org/wiki/File:Korean_cuisine-Dubu_jorim-01.jpg) |
| `brand-gochujang.jpg` | Chloe Lim | CC BY 2.0 | [Bibimbap 7.jpg](https://commons.wikimedia.org/wiki/File:Bibimbap_7.jpg) |
| `brand-oil.jpg` | pcamp | CC BY 2.0 | [Korean noodles-Makguksu-02.jpg](https://commons.wikimedia.org/wiki/File:Korean_noodles-Makguksu-02.jpg) |
| `brand-garlic.jpg` | Infrogmation | CC BY-SA 4.0 | [Garlic bread baguettes 2.jpg](https://commons.wikimedia.org/wiki/File:Garlic_bread_baguettes_2.jpg) |
| `brand-sugar.jpg` | Korea.net / Korean Culture and Information Service | CC BY-SA 2.0 | [KOCIS yakgwa, honey cookies (4646996556).jpg](https://commons.wikimedia.org/wiki/File:KOCIS_yakgwa,_honey_cookies_(4646996556).jpg) |
| `malatanghulu.jpg` | N509FZ | CC BY-SA 4.0 | [Malatang from Hope Tree (20220226172344).jpg](https://commons.wikimedia.org/wiki/File:Malatang_from_Hope_Tree_(20220226172344).jpg) |
| `dubai.jpg` | Viktorija N. Ivanov | CC BY-SA 4.0 | [Чоколадни јагоди и банани.jpg](https://commons.wikimedia.org/wiki/File:%D0%A7%D0%BE%D0%BA%D0%BE%D0%BB%D0%B0%D0%B4%D0%BD%D0%B8_%D1%98%D0%B0%D0%B3%D0%BE%D0%B4%D0%B8_%D0%B8_%D0%B1%D0%B0%D0%BD%D0%B0%D0%BD%D0%B8.jpg) |
| `rose.jpg` | by jetalone (flickr) | CC BY 2.0 | [Korean.snacks-Tteokbokki-08.jpg](https://commons.wikimedia.org/wiki/File:Korean.snacks-Tteokbokki-08.jpg) |
| `croffle.jpg` | Andy Li | CC0 | [Oreo Croffle - Fluffy Fluffy Dessert Cafe 2025-06-10.jpg](https://commons.wikimedia.org/wiki/File:Oreo_Croffle_-_Fluffy_Fluffy_Dessert_Cafe_2025-06-10.jpg) |
