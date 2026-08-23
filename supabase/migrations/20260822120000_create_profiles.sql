-- =====================================================================
-- 프로필 — 글쓴이 이름을 담아 두는 표.
--
-- 왜 이 표가 따로 필요한가. 로그인 정보는 auth.users 에 있는데, 그 표는
-- 우리 앱이 읽을 수 없다. 남의 이메일을 아무나 조회할 수 있게 되면
-- 회원 명단이 통째로 새어 나가기 때문에 수파베이스가 막아 둔 것이다.
--
-- 그래서 "남에게 보여도 되는 것" 만 따로 담는 표를 만든다.
-- 커뮤니티 카드에 "김도현 · 불 다루는 법" 처럼 나오는 그 값이 여기 있다.
-- =====================================================================

-- 글쓴이 한 사람. 로그인 계정 하나에 프로필 하나다
create table public.profiles (
  -- auth.users 의 id 를 그대로 열쇠로 쓴다. 따로 번호를 만들면 둘을 잇는 표가 하나 더 필요해진다
  id uuid primary key references auth.users (id) on delete cascade,

  -- 카드에 크게 나오는 이름.
  -- 이 2~20 은 lib/domain/display-name.ts 의 MIN_DISPLAY_NAME·MAX_DISPLAY_NAME 과
  -- 같은 값이다. 한쪽만 고치면 화면은 통과시켰는데 여기서 거절하는 일이 생긴다
  display_name text not null check (char_length(display_name) between 2 and 20),

  -- 이름 밑에 붙는 한 줄 소개("불 다루는 법"). 없어도 된다
  note text check (char_length(note) <= 60),

  -- 브랜드 계정인지. 식품 브랜드가 올리는 글은 일반 글과 다른 탭에 걸린다
  is_brand boolean not null default false,

  -- 언제 만들어졌는지. 시간은 늘 시간대까지 담는다 — 서버와 사용자가 다른 나라에 있을 수 있다
  created_at timestamptz not null default now()
);

-- 표가 무엇인지 데이터베이스 안에도 적어 둔다. 대시보드에서 이 설명이 보인다
comment on table public.profiles is '남에게 보여도 되는 글쓴이 정보. auth.users 는 앱에서 읽을 수 없어서 따로 둔다.';
comment on column public.profiles.is_brand is '식품 브랜드 계정. 브랜드 레시피를 올릴 수 있는지를 이 값으로 가른다.';

-- ---------------------------------------------------------------------
-- 계정이 생기면 프로필도 같이 만든다
-- ---------------------------------------------------------------------

-- 닉네임을 안 받은 계정에 붙일 임시 이름을 만든다.
--
-- 이메일 앞부분을 그대로 쓰면 위 2~20 규칙에 걸린다. a@b.com 은 한 글자라 짧고,
-- 긴 주소는 스무 글자를 넘긴다. 걸리면 가입 자체가 실패하므로 여기서 맞춰 준다.
-- 트리거·백필·시드 세 군데가 같은 규칙을 써야 해서 함수로 뽑아 두었다
create function public.default_display_name(email text)
returns text
language sql
-- 같은 값을 넣으면 늘 같은 답이 나온다. 그렇다고 알려 주면 데이터베이스가 덜 셈한다
immutable
-- 남이 만들어 둔 같은 이름의 함수를 부르지 않도록 검색 경로를 비운다
set search_path = ''
as $$
  select case
    -- 두 글자가 넘으면 그대로 쓴다
    when char_length(base) >= 2 then base
    -- 한 글자거나 비었으면 밑줄을 붙여 두 글자로 만든다.
    -- rpad 는 긴 글자를 자르기도 해서, 짧을 때만 불러야 한다
    else rpad(base, 2, '_')
  end
  -- 골뱅이 앞을 떼어 스무 글자까지만 남긴다
  from (select left(split_part(coalesce(email, ''), '@', 1), 20) as base) t
$$;

-- 가입 직후에 프로필이 없으면 글을 써도 이름이 안 나온다. 그래서 가입과 동시에 만들어 준다
create function public.handle_new_user()
returns trigger
language plpgsql
-- 이 함수는 auth.users 에 손대야 해서 만든 사람 권한으로 돈다.
-- 일반 사용자 권한으로는 auth 스키마를 건드릴 수 없다
security definer
-- 검색 경로를 비워 둔다. 이걸 안 하면 남이 자기 스키마에 같은 이름의 함수를 만들어 두고
-- 이 함수가 그쪽을 부르게 만들 수 있다 — security definer 함수의 오래된 함정이다
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- 가입할 때 이름을 받았으면 그것을 쓴다.
    -- 이 칸은 앱이 supabase.auth.signUp 의 options.data 로 넘겨 준 값이다.
    -- 빈 글자가 올 수도 있어서 nullif 로 걸러야 coalesce 가 다음 줄로 넘어간다
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      -- 이름 없이 만들어진 계정(대시보드에서 직접 만든 것 등)은 이메일에서 딴다
      public.default_display_name(new.email)
    )
  );
  return new;
end;
$$;

-- 계정이 만들어진 뒤에 한 번 돈다
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 이 마이그레이션을 돌리기 전에 이미 가입한 사람들.
-- 위 트리거는 앞으로 가입하는 사람만 챙긴다. 이 줄이 없으면 먼저 가입한 사람은
-- 프로필이 없어서 글을 쓰는 순간 외래 키에서 막힌다
insert into public.profiles (id, display_name)
select u.id, public.default_display_name(u.email)
from auth.users u
-- 어떤 까닭으로든 이미 프로필이 있는 사람은 건너뛴다
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- RLS — 줄 단위로 누가 무엇을 할 수 있는지
-- ---------------------------------------------------------------------

-- 이 한 줄이 없으면 아래 정책은 하나도 안 걸리고 표가 통째로 열려 있다.
-- 표를 만들 때마다 반드시 켠다
alter table public.profiles enable row level security;

-- 프로필은 누구나 볼 수 있다. 커뮤니티 글 목록에 글쓴이 이름이 나와야 하고,
-- 로그인 안 한 사람도 그 목록을 본다
create policy "프로필은 누구나 볼 수 있다"
  on public.profiles
  for select
  -- 역할을 적어 두면 다른 역할일 때는 이 정책을 아예 따져 보지 않는다
  to anon, authenticated
  using (true);

-- 자기 프로필만 만들 수 있다. 위 트리거가 이미 만들어 주지만,
-- 트리거를 나중에 걷어 내더라도 남의 이름으로 프로필이 생기지 않게 막아 둔다
create policy "자기 프로필만 만든다"
  on public.profiles
  for insert
  to authenticated
  -- auth.uid() 를 괄호 안 select 로 감싼다. 그러면 줄마다 부르지 않고 한 번만 불러
  -- 그 값을 돌려 쓴다 — 줄이 많아질수록 차이가 커진다
  with check ((select auth.uid()) = id);

-- 자기 프로필만 고칠 수 있다
create policy "자기 프로필만 고친다"
  on public.profiles
  for update
  to authenticated
  -- using 은 "어느 줄을 고칠 수 있나", with check 는 "고친 결과가 어때야 하나" 다.
  -- 둘 다 적어야 남의 줄로 id 를 바꿔 옮기는 것까지 막힌다
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 지우는 정책은 일부러 만들지 않는다. 정책이 없으면 아무도 못 지운다.
-- 프로필은 계정을 지울 때 위 on delete cascade 로 같이 사라지는 것이 맞다

-- ---------------------------------------------------------------------
-- 열 단위 권한 — RLS 로는 막을 수 없는 것
-- ---------------------------------------------------------------------

-- 수파베이스는 public 스키마의 표에 기본으로 모든 권한을 열어 준다.
-- 그래서 먼저 다 걷어 내고 필요한 것만 하나씩 준다
revoke all on table public.profiles from anon, authenticated;

-- 읽기는 둘 다 허용한다. 어느 줄이 보일지는 위 정책이 정한다
grant select on table public.profiles to anon, authenticated;

-- 만들 때 손댈 수 있는 칸. id 는 위 정책이 자기 것으로 묶어 두므로 여기 둬도 된다
grant insert (id, display_name, note) on table public.profiles to authenticated;

-- 고칠 수 있는 칸은 이름과 소개뿐이다.
-- is_brand 를 빼 둔 것이 요점이다 — RLS 는 "이 줄을 고칠 수 있나" 만 따지고
-- "이 칸을 고칠 수 있나" 는 못 따진다. 안 빼 두면 아무나 자기를 브랜드 계정으로 바꾼다
grant update (display_name, note) on table public.profiles to authenticated;
