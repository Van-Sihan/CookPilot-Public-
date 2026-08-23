-- =====================================================================
-- 좋아요 · 즐겨찾기 · 댓글 · 프로필 사진
--
-- 지금까지 글은 표에 있었지만 그 글에 **반응할 자리**가 없었다.
-- 좋아요 숫자는 카드에 찍혀 있었지만 아무도 못 눌렀고(그냥 보여 주는 값이었다),
-- 댓글은 브라우저에만 쌓여서 쓴 사람 말고는 아무도 못 봤다.
--
-- 표를 넷으로 나눈 까닭.
--   · post_likes — 남에게 보이는 값(숫자). 누가 눌렀는지는 자기만 본다
--   · post_bookmarks — 남에게 안 보이는 값. 내 서랍이다
--   · post_comments — 남에게 보이는 값. 글이 펴내진 동안만 보인다
--   · profiles.avatar_url — 프로필 사진 주소
--
-- 좋아요와 즐겨찾기를 한 표에 "kind" 로 합치지 않은 까닭이 있다. 둘은
-- **누가 볼 수 있느냐가 다르다.** 한 표에 두면 정책 하나가 둘을 같이 다뤄야 하고,
-- 그러다 보면 어느 한쪽이 느슨해진다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. 프로필 사진
-- ---------------------------------------------------------------------

-- 사진 자체가 아니라 **주소**만 담는다. 표지 그림과 같은 까닭이다 —
-- 사진을 base64 로 표에 넣으면 프로필을 읽을 때마다 수백 KB 가 딸려 온다
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  '프로필 사진 주소. avatars 버킷에 올린 파일을 가리킨다. 없으면 이름 첫 글자로 대신한다.';

-- 닉네임과 같은 자리에 놓는다. 이 칸이 grant 에 없으면 RLS 를 통과해도 못 고친다
grant update (avatar_url) on table public.profiles to authenticated;


-- ---------------------------------------------------------------------
-- 2. 프로필 사진을 담는 곳 (스토리지)
--
-- post-covers 버킷과 같은 모양이다. 공개로 읽되 **올리는 쪽을 자기 폴더로 좁힌다.**
-- 안 묶어 두면 로그인한 아무나 남의 프로필 사진을 덮어쓴다.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  -- 공개. 커뮤니티 글 옆에 붙는 사진이라 로그인 없이도 보여야 한다
  true,
  -- 2MB. 프로필 사진에 그보다 큰 파일이 필요할 일이 없다
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
-- 이미 있으면 그냥 둔다. 마이그레이션을 두 번 돌려도 깨지지 않게
on conflict (id) do nothing;

create policy "누구나 프로필 사진을 본다"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "로그인한 사람이 자기 폴더에 프로필 사진을 올린다"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    -- 파일 경로의 첫 칸이 내 uuid 여야 한다. "<uuid>/1756...png" 모양이다
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "자기 프로필 사진만 덮어쓴다"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "자기 프로필 사진만 지운다"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ---------------------------------------------------------------------
-- 3. 좋아요
-- ---------------------------------------------------------------------

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,

  -- 기본값을 auth.uid() 로 두고 아래에서 이 칸에 넣을 권한을 안 준다.
  -- 그래야 남의 이름으로 좋아요를 누를 수가 없다
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,

  created_at timestamptz not null default now(),

  -- 한 사람이 한 글에 한 번만. 이 줄이 곧 "두 번 눌러도 하나" 라는 규칙이다.
  -- 앱에서 세는 것보다 표에서 막는 편이 확실하다
  primary key (post_id, user_id)
);

comment on table public.post_likes is
  '누가 어느 글에 좋아요를 눌렀는지. 숫자는 posts.like_count 가 따로 들고 있다.';

-- "이 사람이 좋아요 누른 글" 을 뽑을 때 쓴다. 기본 키는 (post_id, user_id) 라
-- user_id 로 시작하는 길이 따로 있어야 빠르다
create index post_likes_user_id_idx on public.post_likes (user_id, created_at desc);

alter table public.post_likes enable row level security;

-- 내가 누른 것만 본다. 남이 누른 목록은 알 까닭이 없다 —
-- 화면에 필요한 것은 "내가 눌렀나" 와 "모두 몇 명인가" 둘뿐이고,
-- 뒤엣것은 posts.like_count 로 이미 보인다
create policy "내가 누른 좋아요만 본다"
  on public.post_likes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 펴낸 글에만 누를 수 있다. 남의 초안에 좋아요를 눌러 두면
-- 그 글이 있다는 사실 자체가 드러난다
create policy "펴낸 글에만 좋아요를 누른다"
  on public.post_likes
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.published
    )
  );

create policy "내가 누른 것만 취소한다"
  on public.post_likes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.post_likes from anon, authenticated;
grant select on table public.post_likes to authenticated;
-- user_id 가 없는 것이 요점이다. 넣을 수 없으니 기본값 auth.uid() 가 박힌다
grant insert (post_id) on table public.post_likes to authenticated;
grant delete on table public.post_likes to authenticated;


-- ---------------------------------------------------------------------
-- 4. 좋아요 숫자를 자동으로 맞춘다
--
-- posts.like_count 는 앱이 못 고친다(grant 에서 뺐다). 그래서 이 방아쇠가 맡는다.
-- 앱이 세어서 넣게 두면 언젠가 두 번 세거나 빼먹는다.
-- ---------------------------------------------------------------------

create function public.sync_post_like_count()
returns trigger
language plpgsql
-- 만든 사람 권한으로 돈다. 누르는 사람에게는 남의 글 like_count 를 고칠 권한이
-- 없어서, 부르는 사람 권한(security invoker)으로 두면 이 방아쇠가 늘 실패한다
security definer
-- 남이 만들어 둔 같은 이름을 부르지 않도록 검색 경로를 비운다
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
       set like_count = like_count + 1
     where id = new.post_id;

    return new;
  end if;

  /* 뺄 때 0 아래로 안 내려가게 막는다. like_count 에 붙은 check 에 걸리면
     좋아요 취소가 통째로 실패해서, 취소를 못 하는 글이 생긴다 */
  update public.posts
     set like_count = greatest(0, like_count - 1)
   where id = old.post_id;

  return old;
end;
$$;

-- 줄이 실제로 들어가고 빠진 뒤에 센다. before 로 두면 실패한 삽입까지 세어 버린다
create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row
  execute function public.sync_post_like_count();


-- ---------------------------------------------------------------------
-- 5. 즐겨찾기 (나만 보는 서랍)
-- ---------------------------------------------------------------------

create table public.post_bookmarks (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

comment on table public.post_bookmarks is
  '나중에 볼 글. 좋아요와 달리 남에게 안 보이고 숫자도 세지 않는다.';

-- "내가 저장한 글" 목록을 최근 저장 순으로 뽑는다
create index post_bookmarks_user_id_idx on public.post_bookmarks (user_id, created_at desc);

alter table public.post_bookmarks enable row level security;

-- 좋아요와 달리 **숫자도 안 보여 준다.** 내 서랍이라 남이 셀 까닭이 없다
create policy "내 즐겨찾기만 본다"
  on public.post_bookmarks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "펴낸 글만 즐겨찾기에 담는다"
  on public.post_bookmarks
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.published
    )
  );

create policy "내 즐겨찾기만 뺀다"
  on public.post_bookmarks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.post_bookmarks from anon, authenticated;
grant select on table public.post_bookmarks to authenticated;
grant insert (post_id) on table public.post_bookmarks to authenticated;
grant delete on table public.post_bookmarks to authenticated;


-- ---------------------------------------------------------------------
-- 6. 댓글
-- ---------------------------------------------------------------------

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null references public.posts (id) on delete cascade,

  -- 글과 같은 방식. 기본값 auth.uid() 에 맡기고 넣을 권한은 안 준다
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,

  -- 길이 규칙은 도메인(lib/domain/post.ts)의 MIN_COMMENT·MAX_COMMENT 와 같은 값이다.
  -- 두 곳에 적는 것이 마음에 걸리지만, 앱을 거치지 않고 들어오는 길이 있는 한
  -- 표에도 있어야 한다
  body text not null check (char_length(btrim(body)) between 2 and 500),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.post_comments is
  '커뮤니티 글에 달리는 댓글. 글이 펴내져 있는 동안만 남에게 보인다.';

-- 글 하나를 열 때 그 글의 댓글을 시간 순으로 훑는다
create index post_comments_post_id_idx
  on public.post_comments (post_id, created_at);

-- 고친 시각은 표가 직접 찍는다. 앱에 맡기면 언젠가 빠뜨린다
create trigger post_comments_touch_updated_at
  before update on public.post_comments
  for each row
  execute function public.touch_updated_at();

alter table public.post_comments enable row level security;

-- 펴낸 글의 댓글은 로그인 안 한 사람도 본다. 글이 그런 것과 같은 이치다
create policy "펴낸 글의 댓글은 누구나 본다"
  on public.post_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.published
    )
  );

create policy "로그인한 사람은 자기 이름으로 댓글을 쓴다"
  on public.post_comments
  for insert
  to authenticated
  with check (
    (select auth.uid()) = author_id
    -- 초안에는 못 단다. 아직 아무에게도 안 보이는 글이다
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.published
    )
  );

-- 고치는 것은 쓴 사람만. 글쓴이라도 남의 말을 고쳐 놓을 수는 없다
create policy "자기 댓글만 고친다"
  on public.post_comments
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

/* 지우는 것은 둘 다 할 수 있다 — 쓴 사람과 **그 글의 주인**.
   고치기와 다르게 두는 까닭이 있다. 남의 집에 붙은 험한 말을 떼어 낼 길이
   없으면 글쓴이는 글을 통째로 지우는 수밖에 없다. 다만 고쳐 쓸 수는 없게
   막아 둔다 — 지우는 것은 없애는 일이지만 고치는 것은 말을 지어내는 일이다 */
create policy "자기 댓글이나 내 글에 달린 댓글을 지운다"
  on public.post_comments
  for delete
  to authenticated
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

revoke all on table public.post_comments from anon, authenticated;
grant select on table public.post_comments to anon, authenticated;
-- author_id 와 시각 칸이 없는 것이 요점이다
grant insert (post_id, body) on table public.post_comments to authenticated;
-- 고칠 수 있는 것은 내용뿐. post_id 를 열어 두면 댓글을 남의 글로 옮길 수 있다
grant update (body) on table public.post_comments to authenticated;
grant delete on table public.post_comments to authenticated;
