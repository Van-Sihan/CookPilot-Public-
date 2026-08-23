-- =====================================================================
-- 챗봇이 뒤져 볼 후기 원본과, 주고받은 대화.
--
-- 표 넷이다.
--   reviews          후기 원본 100건. 파인콘에는 벡터만 들어가고 원본은 여기 남는다
--   chats            대화 한 뭉치
--   messages         그 안의 말 한 마디씩
--   message_feedback 답이 도움이 됐는지
--
-- **로그인을 요구하지 않는다.** 교재의 요구 사항이기도 하고, 물어보기만 하는
-- 화면에 회원가입을 세우면 아무도 안 쓴다.
--
-- 그래서 RLS 를 짜는 방식이 다른 표들과 다르다. auth.uid() 가 없으니
-- "자기 것만 본다" 를 데이터베이스가 확인할 방법이 없다. 대신 이렇게 했다.
--
--   · 표를 직접 읽는 길은 **막는다**. select 정책을 아예 안 만든다
--   · 대신 대화 id 를 아는 사람만 읽을 수 있는 함수를 하나 열어 둔다
--
-- 이러면 목록을 훑어 남의 대화를 긁어 가는 일은 막힌다. 다만 uuid 를
-- 알아낸 사람은 그 대화를 볼 수 있다 — **추측하기 어렵다는 것에 기대는 방식**이고,
-- 진짜 비밀을 담을 자리는 아니다. 로그인을 붙이면 그때 auth.uid() 로 바꾼다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 후기 원본
-- ---------------------------------------------------------------------

create table public.reviews (
  -- samples/reviews.csv 의 id 를 그대로 쓴다. 다시 올려도 같은 줄을 덮어쓰려는 것이다
  id text primary key,

  -- 어느 요리 글의 후기인지. 커뮤니티 글 id 와 짝을 이룬다.
  -- posts 표를 참조하지 않는 까닭 — 지금 글은 아직 파일에 있고, 표에 없는 id 를
  -- 외래키로 걸면 시드가 통째로 실패한다. 글이 표로 옮겨 가면 그때 건다
  dish_id text not null,

  -- 요리 이름. dish_id 로 찾을 수 있지만 같이 담는다 —
  -- 답변에 붙일 때 표를 한 번 더 뒤지지 않아도 된다
  dish text not null,

  -- 별점. 1에서 5 사이가 아니면 잘못 들어온 값이다
  rating smallint not null check (rating between 1 and 5),

  title text not null check (char_length(title) between 1 and 80),
  content text not null check (char_length(content) between 1 and 2000),

  -- 쓴 사람의 닉네임. 로그인과 이어져 있지 않아서 그냥 글자다
  author text not null check (char_length(author) between 1 and 30),

  -- 언제 쓴 후기인지. 시각까지 필요하지 않아 날짜만 담는다
  date date not null,

  -- 도움이 됐다고 누른 수
  helpful_votes integer not null default 0 check (helpful_votes >= 0),

  -- 실제로 만들어 보고 쓴 후기인지. 안 만들고 쓴 것과는 무게가 다르다
  verified_cook boolean not null default false,

  created_at timestamptz not null default now()
);

-- 요리별로 후기를 뽑는 일이 잦다. 그때마다 100줄을 다 훑지 않게 한다
create index reviews_dish_id_idx on public.reviews (dish_id);

comment on table public.reviews is
  '챗봇이 근거로 삼는 후기 원본. 벡터는 파인콘에 있고 읽을 수 있는 글자는 여기 있다.';

alter table public.reviews enable row level security;

-- 후기는 누구나 읽는다. 커뮤니티에 이미 공개된 글이라 감출 것이 없다
create policy "누구나 후기를 읽는다"
  on public.reviews for select
  to anon, authenticated
  using (true);

/* 넣고 고치는 정책은 만들지 않는다. RLS 는 정책이 없으면 막는 쪽이 기본이라,
   이 표에 글을 넣을 수 있는 것은 서비스 키를 쥔 쪽(시드·관리자)뿐이다.
   지금 후기는 우리가 적은 예시라 사람이 늘릴 일이 없다 */

-- ---------------------------------------------------------------------
-- 대화
-- ---------------------------------------------------------------------

create table public.chats (
  -- 브라우저가 만들어 오는 값이 아니라 여기서 만든다. 추측을 어렵게 하려면
  -- 만드는 쪽이 한 곳이어야 한다
  id uuid primary key default gen_random_uuid(),

  -- 목록에 보일 이름. 첫 물음을 잘라 넣는다
  title text not null default '새 대화' check (char_length(title) between 1 and 120),

  created_at timestamptz not null default now()
);

comment on table public.chats is
  '대화 한 뭉치. 로그인이 없어서 주인을 적지 않는다 — id 를 아는 사람이 주인이다.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),

  -- 어느 대화에 속하는지. 대화를 지우면 말도 같이 지운다
  chat_id uuid not null references public.chats (id) on delete cascade,

  -- 사람이 한 말인지 챗봇이 한 말인지. 랭체인이 쓰는 낱말을 그대로 쓴다
  role text not null check (role in ('user', 'assistant')),

  content text not null check (char_length(content) between 1 and 8000),

  /* 답의 근거가 된 글들. 어느 요리 글에서 왔는지를 담는다.
     따로 표를 만들지 않고 jsonb 로 두는 까닭 — 이 값은 그때 그 답과 한 몸이고,
     따로 뒤져 볼 일이 없다. 뒤져 볼 일이 생기면 그때 표로 뺀다 */
  sources jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

-- 대화 하나를 펼칠 때 그 대화의 말만 시간순으로 뽑는다
create index messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at);

comment on table public.messages is
  '대화 안의 말 한 마디. 새로 고쳐도 대화가 남게 하려고 담는다.';

create table public.message_feedback (
  id uuid primary key default gen_random_uuid(),

  -- 어느 답에 대한 것인지
  message_id uuid not null references public.messages (id) on delete cascade,

  -- 도움이 됐는지 아닌지. 별점 대신 둘 중 하나로 둔다 —
  -- 다섯 칸을 주면 사람들이 잘 안 누르고, 눌러도 3점만 나온다
  helpful boolean not null,

  created_at timestamptz not null default now(),

  -- 한 답에 여러 번 누르지 못하게 막는다
  unique (message_id)
);

comment on table public.message_feedback is
  '답이 도움이 됐는지. 어떤 물음에서 RAG 가 헛짚는지 나중에 세어 보려고 모은다.';

alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.message_feedback enable row level security;

/* 넣는 것은 누구나 할 수 있다. 로그인 없이 쓰는 화면이라 다른 수가 없다.
   with check (true) 가 위험해 보이지만, 넣을 수 있는 것과 읽을 수 있는 것은
   별개다 — 아래에서 읽는 길을 막아 둔다 */
create policy "누구나 대화를 연다"
  on public.chats for insert
  to anon, authenticated
  with check (true);

create policy "누구나 말을 남긴다"
  on public.messages for insert
  to anon, authenticated
  with check (true);

create policy "누구나 도움 여부를 남긴다"
  on public.message_feedback for insert
  to anon, authenticated
  with check (true);

/*
 * **읽는 정책은 만들지 않는다.**
 *
 * select 정책이 하나도 없으면 RLS 는 전부 막는다. 그래서 `select * from messages`
 * 는 한 줄도 안 나온다 — 남의 대화를 훑어 갈 수 없다.
 *
 * 대신 아래 함수 하나만 열어 둔다. 대화 id 를 알아야만 부를 수 있다.
 */
create or replace function public.chat_messages(chat uuid)
returns table (
  id uuid,
  role text,
  content text,
  sources jsonb,
  created_at timestamptz
)
language sql
stable
/* security definer 는 "표 주인의 권한으로 돈다" 는 뜻이다. 이게 있어야
   RLS 에 막히지 않고 읽는다. 대신 무엇을 읽을지 아래 where 로 못 박아야 한다 —
   못 박지 않으면 이 함수가 RLS 를 통째로 우회하는 구멍이 된다 */
security definer
-- 검색 경로를 고정한다. 안 하면 같은 이름의 가짜 표를 만들어 끼워 넣을 수 있다
set search_path = public, pg_temp
as $$
  select m.id, m.role, m.content, m.sources, m.created_at
  from public.messages m
  -- 넘겨받은 대화 하나만. 이 줄이 이 함수의 자물쇠다
  where m.chat_id = chat
  order by m.created_at;
$$;

comment on function public.chat_messages(uuid) is
  '대화 id 를 아는 사람만 그 대화의 말을 읽는다. 목록을 훑는 길은 막혀 있다.';

-- 함수는 만들면 누구나 부를 수 있게 되어 있다. 그대로 두되 뜻을 밝혀 둔다
grant execute on function public.chat_messages(uuid) to anon, authenticated;
