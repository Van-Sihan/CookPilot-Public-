# 버셀 배포 절차

CookPilot 을 버셀에 올리는 순서다. **각 단계에 "누가 하는 일"** 을 적어 두었다.

| 표시 | 뜻 |
| --- | --- |
| 🧑 | 사람이 손으로 하는 일 (계정 · 대시보드 · 값 붙여넣기) |
| 🤖 | 코드로 하는 일. 값만 알려 주면 처리 가능 |
| ✅ | 이미 끝난 일 |

---

## 0. 이미 끝난 준비 ✅

| 항목 | 상태 |
| --- | --- |
| 프로덕션 빌드 | `npm run build` 통과. TypeScript 오류 0, 라우트 21개 |
| 코드 푸시 | `main` 이 `github.com/Van-Sihan/CookPilot.v2` 와 같음 |
| 비밀정보 | `.env.local` 은 `.gitignore` 에 걸려 있어 올라가지 않음 |
| 환경 변수 견본 | `.env.example` 에 필요한 변수 7개를 적어 둠 |
| 배포 주소 자동 인식 | 버셀 운영 도메인을 링크 미리보기 뿌리로 쓰도록 처리 (`app/layout.tsx`) |
| CSV 번들 포함 | `samples/reviews.csv` 가 서버리스 번들에 들어가는 것을 빌드 산출물에서 확인 |
| 이미지 호스트 | 원격 이미지는 모두 `unoptimized` 또는 등록된 호스트. 설정 변경 불필요 |
| Supabase 마이그레이션 | 5개 전부 적용 완료. 표 · 칸 · 버킷 · 정책 · 트리거 확인함 (5단계) |

**버셀 설정 파일(`vercel.json`)은 만들지 않았다.** Next.js 프로젝트는 버셀이 자동으로
인식하고, 지금 구조에는 따로 지정할 것이 없다. 리전을 고정하고 싶어지면 그때 만든다.

---

## 1. 버셀 가입 🧑

<https://vercel.com/signup> → **Continue with GitHub**

GitHub 으로 가입해야 저장소를 바로 가져올 수 있다. Hobby(무료) 플랜으로 충분하다.

---

## 2. 프로젝트 가져오기 🧑

1. **Add New… → Project**
2. `Van-Sihan/CookPilot.v2` 옆의 **Import**
3. 설정 화면에서 **아무것도 바꾸지 않는다**
   - Framework Preset: `Next.js` (자동)
   - Build Command · Output Directory · Install Command: 기본값
4. 아래 3단계를 먼저 하고 **Deploy** 를 누른다

---

## 3. 환경 변수 넣기 🧑

Import 화면의 **Environment Variables** 를 펼치고 아래를 넣는다.
값은 지금 컴퓨터의 `.env.local` 에 있다.

| Name | Value | 어디서 가져오나 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | (필수) | `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (필수) | `.env.local` |
| `PINECONE_API_KEY` | (필수) | `.env.local` |
| `PINECONE_HOST` | (필수) | `.env.local` |

`NEXT_PUBLIC_SITE_URL` 은 **지금 넣지 않는다.** 도메인이 정해진 뒤 7단계에서 넣는다.
`PINECONE_INDEX` 와 `GOOGLE_API_KEY` 는 없어도 된다 (`.env.example` 참고).

### ⚠️ 값이 빈 줄은 반드시 지운다

버셀은 저장소의 `.env.example` 을 읽어 **빈 칸을 미리 만들어 둔다.** 붙여넣기를
하면 그 빈 줄 위에 값 있는 줄이 더해져 **같은 이름이 두 줄**이 된다.

- 값 칸이 비어 있는 줄은 오른쪽 `—` 로 **전부 지운다.**
- 남는 줄은 값이 들어간 **4개뿐**이어야 한다.
- 상단의 "N Detected" 숫자는 무시한다.

빈 값을 남기면 그 변수는 `undefined` 가 아니라 **빈 문자열**로 들어온다.
코드에서 빈 값을 '없음' 으로 보도록 고쳐 두었지만(`||` · `pickEnv`),
중복된 이름 중 어느 쪽이 이길지는 알 수 없으므로 지우는 것이 맞다.

> Environment 는 Production · Preview · Development 셋 다 체크해 두면 편하다.

---

## 4. 첫 배포 🧑

**Deploy** 를 누른다. 2~3분 걸린다.

끝나면 `cookpilot-v2-xxxx.vercel.app` 같은 주소가 나온다. **이 주소를 적어 둔다.**

> 마이그레이션(5단계)은 끝나 있으므로 표는 이미 준비돼 있다. 다만 **가입 확인
> 메일 링크가 아직 `localhost` 로 간다.** 6단계를 해야 로그인 흐름이 완성된다.

---

## 5. Supabase 마이그레이션 적용 ✅ (2026-08-24 완료)

**다섯 개 모두 적용을 마쳤다.** 아래는 기록이며, 새 Supabase 프로젝트를 만들 때
다시 밟을 순서다. 대시보드 → **SQL Editor** 에 파일 전체를 붙여넣고 번호 순서대로
한 번씩 실행한다. 이 파일들은 재실행에 안전하지 않으니 **한 번만** 돌린다.

```
supabase/migrations/
├─ 20260822120000_create_profiles.sql
├─ 20260822120100_create_posts.sql
├─ 20260823090000_create_reviews_and_chats.sql
├─ 20260823140000_post_images_and_covers.sql
└─ 20260824090000_likes_bookmarks_comments_avatars.sql
```

**무엇이 이미 적용됐는지 확인하는 법** — SQL Editor 에서:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
```

| 이 표가 보이면 | 이 파일까지 적용된 것 |
| --- | --- |
| `profiles` | 20260822120000 |
| `posts` | 20260822120100 |
| `chats` · `messages` | 20260823090000 |
| `post_likes` · `post_bookmarks` · `post_comments` | 20260824090000 |

마지막 파일이 하는 일 — `post_likes` · `post_bookmarks` · `post_comments` 표,
`profiles.avatar_url` 칸, `avatars` 스토리지 버킷, 좋아요 수 트리거.
**이게 없으면 좋아요 · 즐겨찾기 · 댓글 · 프로필 이미지가 동작하지 않는다.**

### 적용 결과 확인 (2026-08-24)

| 항목 | 기대 | 실제 |
| --- | --- | --- |
| 표 `post_likes` · `post_bookmarks` · `post_comments` | 3 | 3 |
| `profiles.avatar_url` 칸 | 1 | 1 |
| 버킷 `post-covers` · `avatars` | 2 | 2 |
| 표 정책 | 10 | 10 |
| 스토리지 정책 | 4 | 4 |
| 트리거 | 2 | 2 |
| 함수 `sync_post_like_count` | 1 | 1 |

트리거를 셀 때 `information_schema.triggers` 를 쓰면 **이벤트마다 한 줄**이 나온다.
`post_likes_sync_count` 는 `after insert or delete` 라 두 줄이 되어 합이 3으로 보인다.
객체 수로 세려면 `pg_trigger` 를 쓴다.

```sql
select tgname, tgrelid::regclass from pg_trigger
where not tgisinternal
  and tgname in ('post_likes_sync_count','post_comments_touch_updated_at');
```

---

## 6. Supabase Auth 주소 바꾸기 🧑

**이 단계를 빠뜨리면 가입 확인 메일의 링크가 `localhost:3000` 으로 간다.**

Supabase 대시보드 → **Authentication → URL Configuration**

| 항목 | 값 |
| --- | --- |
| Site URL | `https://<4단계에서 받은 주소>` |
| Redirect URLs | `https://<4단계 주소>/**` 를 추가 |

코드에 `emailRedirectTo` 를 지정하지 않았기 때문에 여기 값이 그대로 쓰인다
(`lib/adapter/supabase-auth-gateway.ts`).

---

## 7. 배포 주소 알려 주고 재배포 🧑

버셀 → Project → **Settings → Environment Variables**

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<4단계 주소>` |

넣은 뒤 **Deployments → 맨 위 → ⋯ → Redeploy**.

> 안 넣어도 링크 미리보기는 동작한다. 버셀이 넣어 주는 운영 도메인을 대신 쓰기
> 때문이다. 다만 직접 적어 두는 쪽이 확실하고, 나중에 개인 도메인을 붙이면
> 반드시 이 값을 그 도메인으로 바꿔야 한다.

---

## 8. Pinecone 인덱스와 후기 색인 🧑

**8-1. 인덱스 확인** — Pinecone 콘솔에서 `PINECONE_HOST` 가 가리키는 인덱스가
살아 있는지 본다. 무료 플랜은 오래 안 쓰면 잠들 수 있다.

**8-2. 후기 색인 1회 실행** — 배포한 뒤 한 번만 돌린다.

```bash
curl -X POST https://<배포 주소>/api/kitchen/index
```

`{"ok":true,"count":...}` 가 나오면 성공이다.
**이걸 안 돌리면 AI 요리 상담이 늘 "관련 후기를 찾지 못했습니다" 로 답한다.**

몇 건이 걸리는지만 보고 싶으면:

```bash
curl "https://<배포 주소>/api/kitchen/index?q=김치찌개"
```

---

## 9. 배포 확인 🧑

| 확인할 것 | 방법 | 안 되면 |
| --- | --- | --- |
| 화면이 뜨는가 | `/` 접속 | 버셀 Deployments → 로그 |
| 커뮤니티 목록 | `/community` 에 글이 보이는가 | Supabase URL · 키 확인 |
| 회원가입 | `/signup` → 확인 메일 링크가 배포 주소로 오는가 | 6단계 |
| 요리 | `/start` 에 Gemini 키 입력 → `/pick` | 키는 브라우저마다 새로 넣어야 한다 |
| 좋아요 · 댓글 | 글 하나에 눌러 보기 | 마이그레이션은 적용됨. 로그인 상태와 예시 글(uuid 아님) 여부 확인 |
| 프로필 이미지 | `/account` 에서 올려 보기 | `avatars` 버킷 |
| AI 상담 | `/ask` 에 질문 | 8단계 색인 |

---

## 나에게(클로드) 알려 주면 처리할 것 🤖

아래 값을 알려 주면 그 자리에서 정리한다. **키 값 자체는 알려 주지 않아도 된다.**

| 무엇 | 왜 필요한가 | 알려 주는 예 |
| --- | --- | --- |
| **배포 주소** | 배포 후 실제로 도는지 점검하고, 문서의 `<배포 주소>` 자리를 채운다 | `cookpilot-v2.vercel.app` |
| **Supabase 리전** | 버셀 함수 리전을 가깝게 고정해 응답을 줄인다 (`vercel.json`) | `Northeast Asia (Seoul)` |
| **적용한 마이그레이션** | 5단계에서 어디까지 됐는지 | "3번째까지 적용됨" |
| **막힌 화면과 오류 문구** | 원인을 짚는다 | 콘솔 · 버셀 로그 원문 |
| **개인 도메인 여부** | `NEXT_PUBLIC_SITE_URL` 과 Supabase Site URL 을 같이 바꿔야 한다 | `cookpilot.kr` |

### 알려 주지 않아도 되는 것

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `PINECONE_API_KEY` · Gemini 키 같은
**값 자체는 필요 없다.** 버셀 대시보드에 직접 붙여 넣으면 된다.

---

## 배포 후에도 남는 제약

| 제약 | 내용 |
| --- | --- |
| Gemini 키는 브라우저마다 | 서버에 저장하지 않는다. 기기를 바꾸면 `/start` 에서 다시 넣어야 한다 |
| 예시 게시글 16편 | 표가 아니라 파일에 있다. 좋아요 · 즐겨찾기가 걸리지 않고 댓글은 브라우저에만 쌓인다 |
| 즐겨찾기 목록 화면 없음 | 표와 정책은 있지만 모아 보는 화면을 아직 안 만들었다 |
| 태그 1개 제한 | `posts.badge` 가 단일 칸이라 게시글당 태그 하나다 |
| `?next=` 미사용 | 로그인 후에는 원래 화면이 아니라 항상 `/start` 로 간다 |
| 테스트 계정 | `cookpilot.test+e2e@example.com` 이 남아 있다. 서비스 키가 없어 지우지 못했다 |

자세한 것은 `docs/spec/CookPilot_기능명세서_HIPO.xlsx` 의 `02_기능체크리스트` 를 본다.
