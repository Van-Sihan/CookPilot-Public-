-- =====================================================================
-- 커뮤니티 글 — 로그인한 사람이 쓰는 레시피 글.
--
-- 칸 이름은 화면이 이미 쓰고 있는 이름(lib/site-content.ts 의 CommunityPost)에
-- 맞춰 두었다. 이름이 어긋나면 화면과 표 사이에 옮겨 적는 코드가 하나 더 생긴다.
--
-- 이 파일의 요점은 RLS 다. 정리하면 이렇다.
--   · 펴낸 글은 로그인 안 한 사람도 본다
--   · 아직 안 펴낸 글(초안)은 쓴 사람만 본다
--   · 글은 로그인한 사람만 쓸 수 있고, 늘 자기 이름으로만 쓰인다
--   · 고치고 지우는 것은 자기 글만
--   · 브랜드 레시피는 브랜드 계정만 쓸 수 있다
-- =====================================================================

-- 커뮤니티 글 한 편
create table public.posts (
  -- 주소에 실릴 값이라 순번(1, 2, 3…)을 쓰지 않는다. 순번이면 남의 글 개수가 드러난다
  id uuid primary key default gen_random_uuid(),

  -- 누가 썼는지. 기본값을 auth.uid() 로 두는 것이 중요하다 —
  -- 아래에서 이 칸에 넣을 권한을 아예 안 주므로, 넣지 않으면 이 값이 자동으로 박힌다
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,

  -- 어느 탭에 걸리는지. popular 와 recent 는 정렬만 다른 것이라 여기 없다 —
  -- 인기는 좋아요 순, 최신은 펴낸 시각 순으로 뽑으면 된다. 저장할 값이 아니다
  kind text not null default 'community' check (kind in ('community', 'brand', 'trend')),

  -- 카드 제목
  title text not null check (char_length(title) between 1 and 80),

  -- 큰 카드에만 두세 줄 보이는 요약
  summary text check (char_length(summary) <= 300),

  -- 본문. 초안일 때는 비어 있을 수 있다
  body text,

  -- 그림 왼쪽 위에 붙는 분류 딱지("한식", "파스타")
  badge text not null check (char_length(badge) between 1 and 12),

  -- 걸리는 시간(분). 0분 요리는 없고, 하루를 넘기는 것도 이 앱이 다룰 일이 아니다
  minutes integer check (minutes between 1 and 1440),

  -- 접시 그림의 색조. 사진을 안 쓰고 CSS 로 그리기 때문에 색만 고른다
  tone text not null default 'ember' check (tone in ('ember', 'herb', 'cocoa', 'cream')),

  -- 좋아요 수. 아래에서 고칠 권한을 안 주므로 글쓴이가 제 손으로 못 올린다
  like_count integer not null default 0 check (like_count >= 0),

  -- 펴냈는지. false 면 초안이라 쓴 사람에게만 보인다
  published boolean not null default false,

  -- 처음 펴낸 시각. "최신" 탭이 이 값으로 줄을 세운다.
  -- created_at 을 쓰지 않는 이유는, 오래전에 써 둔 초안을 오늘 펴내면
  -- 오늘 글로 보여야 맞기 때문이다
  published_at timestamptz,

  -- 언제 만들고 언제 고쳤는지
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 펴낸 글에는 반드시 펴낸 시각이 있어야 한다. 둘이 어긋나면 최신 탭에서 사라진다
  constraint posts_published_needs_time check (published = false or published_at is not null)
);

comment on table public.posts is '커뮤니티에 올라가는 레시피 글. 초안은 쓴 사람만 본다.';
comment on column public.posts.kind is 'community=일반, brand=브랜드 레시피(광고), trend=SNS 유행. popular·recent 는 정렬이라 여기 없다.';
comment on column public.posts.like_count is '좋아요 수. 글쓴이가 못 고치도록 update 권한에서 뺐다.';

-- ---------------------------------------------------------------------
-- 찾아보기 — 목록 화면이 훑는 길
-- ---------------------------------------------------------------------

-- "최신" 탭. 초안은 목록에 안 나오므로 펴낸 글만 담는 부분 색인으로 둔다.
-- 그러면 색인이 작아져서 읽는 속도도 넣는 속도도 같이 빨라진다
create index posts_published_at_idx
  on public.posts (published_at desc)
  where published;

-- "인기" 탭
create index posts_like_count_idx
  on public.posts (like_count desc)
  where published;

-- "브랜드 레시피" · "SNS 유행" 탭
create index posts_kind_idx
  on public.posts (kind, published_at desc)
  where published;

-- 내가 쓴 글 목록, 그리고 아래 RLS 정책이 author_id 로 줄을 고를 때 쓴다
create index posts_author_id_idx on public.posts (author_id);

-- ---------------------------------------------------------------------
-- 고친 시각을 자동으로 남긴다
-- ---------------------------------------------------------------------

-- 앱이 updated_at 을 챙겨 넣게 두면 언젠가 빠뜨린다. 데이터베이스가 직접 찍는 편이 낫다
create function public.touch_updated_at()
returns trigger
language plpgsql
-- 남의 스키마를 부르지 않도록 검색 경로를 비워 둔다
set search_path = ''
as $$
begin
  -- 앱이 무슨 값을 보냈든 지금 시각으로 덮는다
  new.updated_at = now();
  return new;
end;
$$;

-- 값이 바뀌기 전에 돈다. after 로 두면 이미 저장된 뒤라 고쳐도 소용없다
create trigger posts_touch_updated_at
  before update on public.posts
  for each row
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

-- 정책보다 이 줄이 먼저다. 이걸 빠뜨리면 아래를 아무리 잘 써 놔도 표가 통째로 열려 있다
alter table public.posts enable row level security;

-- 펴낸 글은 로그인 안 한 사람도 본다. 커뮤니티는 들어와 보고 나서 가입하는 자리다
create policy "펴낸 글은 누구나 본다"
  on public.posts
  for select
  to anon, authenticated
  using (published);

-- 초안은 쓴 사람만 본다. 위 정책과 따로 두는 이유는, 정책이 여럿이면 OR 로 묶이기 때문이다 —
-- 하나로 합쳐 쓰면 로그인 안 한 사람에게도 auth.uid() 비교를 시키게 된다
create policy "내 초안은 나만 본다"
  on public.posts
  for select
  to authenticated
  using ((select auth.uid()) = author_id);

-- 글쓰기. 이 파일이 있는 까닭이다
create policy "로그인한 사람은 자기 이름으로 글을 쓴다"
  on public.posts
  for insert
  to authenticated
  with check (
    -- 남의 이름으로 쓰지 못하게 막는다. author_id 는 기본값이 auth.uid() 이고
    -- 넣을 권한도 안 줬지만, 권한을 나중에 넓히더라도 이 줄이 남아 막아 준다
    (select auth.uid()) = author_id
    and (
      -- 보통 글은 누구나
      kind <> 'brand'
      -- 브랜드 레시피는 브랜드 계정만. 광고 자리라 아무나 올리면 안 된다
      or exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.is_brand
      )
    )
  );

-- 자기 글만 고친다
create policy "자기 글만 고친다"
  on public.posts
  for update
  to authenticated
  -- 어느 줄에 손댈 수 있나
  using ((select auth.uid()) = author_id)
  with check (
    -- 고친 뒤에도 여전히 자기 글이어야 한다. 이 줄이 없으면 남에게 글을 떠넘길 수 있다
    (select auth.uid()) = author_id
    -- 넣을 때와 똑같은 검사를 여기서도 한다. 이 줄이 없으면 보통 글로 써 놓고
    -- 나중에 kind 만 brand 로 고쳐서 광고 자리로 옮길 수 있다
    and (
      kind <> 'brand'
      or exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.is_brand
      )
    )
  );

-- 자기 글만 지운다
create policy "자기 글만 지운다"
  on public.posts
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ---------------------------------------------------------------------
-- 열 단위 권한 — RLS 가 못 하는 몫
--
-- RLS 는 "이 줄에 손대도 되나" 까지만 본다. "이 칸은 안 된다" 는 못 막는다.
-- 그래서 아래를 안 적어 두면, 자기 글이기만 하면 like_count 를 999999 로 고칠 수 있다.
-- ---------------------------------------------------------------------

-- 수파베이스가 기본으로 다 열어 두므로 먼저 걷어 낸다
revoke all on table public.posts from anon, authenticated;

-- 읽기는 둘 다. 어느 줄이 보일지는 위 정책이 정한다
grant select on table public.posts to anon, authenticated;

-- 새 글에 담을 수 있는 칸.
-- author_id 가 없는 것이 요점이다 — 넣을 수 없으니 기본값 auth.uid() 가 그대로 박힌다.
-- published 도 없다. 새 글은 늘 초안으로 시작하고, 펴내는 일은 아래 함수가 맡는다 —
-- 여기서 published 를 열어 두면 published_at 없이 펴낸 글이 만들어져
-- 위 posts_published_needs_time 검사에 걸린다.
-- like_count 는 남이 눌러 주는 값이라 애초에 손댈 자리가 아니다
grant insert (kind, title, summary, body, badge, minutes, tone)
  on table public.posts to authenticated;

-- 고칠 수 있는 칸. 여기에도 author_id · like_count · published_at 이 없다
grant update (kind, title, summary, body, badge, minutes, tone)
  on table public.posts to authenticated;

-- 지우는 것은 줄 단위라 칸을 따질 것이 없다
grant delete on table public.posts to authenticated;

-- ---------------------------------------------------------------------
-- 펴내기 · 내리기 — published 와 published_at 을 한꺼번에 맞춘다
-- ---------------------------------------------------------------------

-- 앱은 published 와 published_at 을 직접 못 고친다(위 grant 에서 뺐다).
-- 두 칸을 따로 열어 두면 언젠가 한쪽만 바뀌어 "펴냈는데 최신 탭에 없는 글" 이 생긴다.
-- 그래서 둘을 같이 맞추는 이 함수 하나만 열어 준다
create function public.set_post_published(post_id uuid, publish boolean)
returns public.posts
language plpgsql
-- 만든 사람 권한으로 돈다. 부르는 사람 권한(security invoker)으로 두면
-- 그 사람에게 published 칸을 고칠 권한이 없어서 이 함수 자체가 돌지 못한다.
--
-- 대신 권한을 넘겨받은 만큼 RLS 도 함께 비켜 가므로, 아래 where 에 author_id 검사를
-- 손으로 적어 둔다. 이 한 줄이 남의 글을 펴내지 못하게 막는 전부다
security definer
-- 남이 만들어 둔 같은 이름의 함수를 부르지 않도록 검색 경로를 비운다
set search_path = ''
as $$
declare
  updated public.posts;
begin
  update public.posts
     set published = publish,
         published_at = case
           -- 내릴 때는 시각을 지우지 않는다. 다시 올릴 때 처음 펴낸 날을 되살리려는 것이다
           when not publish then published_at
           -- 이미 펴낸 적이 있으면 그때 시각을 그대로 둔다.
           -- 안 그러면 잠깐 내렸다 다시 올릴 때마다 최신 글로 올라온다
           else coalesce(published_at, now())
         end
   where id = post_id
     -- security definer 라 RLS 가 안 걸린다. 그래서 여기서 직접 따진다
     and author_id = auth.uid()
  returning * into updated;

  -- 없는 글이거나 남의 글이면 한 줄도 안 고쳐진다.
  -- 어느 쪽인지는 알려 주지 않는다 — 알려 주면 남의 글 번호를 떠보는 데 쓰인다
  if not found then
    raise exception '펴내거나 내릴 수 있는 글이 없습니다';
  end if;

  return updated;
end;
$$;

-- security definer 함수는 누가 부를 수 있는지가 곧 권한이다. 기본으로 다 열려 있으니 걷어 낸다
revoke all on function public.set_post_published(uuid, boolean) from public, anon;

-- 로그인한 사람에게만 열어 준다
grant execute on function public.set_post_published(uuid, boolean) to authenticated;

comment on function public.set_post_published(uuid, boolean) is 'published 와 published_at 을 한꺼번에 맞춘다. 앱은 두 칸을 직접 못 고친다.';
