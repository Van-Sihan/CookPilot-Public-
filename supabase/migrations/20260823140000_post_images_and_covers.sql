-- =====================================================================
-- 글에 붙는 그림 한 장과, 그 그림이 놓일 자리.
--
-- 요리를 끝내면 쿡파일럿이 레시피 카드(인포그래픽)를 그려 준다. 그것을
-- 그대로 커뮤니티 글의 사진으로 쓰려면 두 가지가 있어야 한다.
--   1) 글에 그림 주소를 적을 칸
--   2) 그림 파일이 실제로 놓일 자리(스토리지)
--
-- 그림을 글 안에 통째로(base64) 담지 않는 까닭 — 한 장에 300KB 가 넘는다.
-- 목록에서 열여섯 편을 불러오면 그만큼이 다 딸려 오고, 표가 금세 부푼다.
-- 파일은 파일 두는 곳에, 표에는 주소만 적는 것이 맞다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 글에 그림 주소 칸을 더한다
-- ---------------------------------------------------------------------

alter table public.posts
  -- 스토리지에 올린 그림의 공개 주소. 없으면 카드에 기본 그림이 나온다
  add column if not exists image_url text
    check (image_url is null or char_length(image_url) <= 500);

comment on column public.posts.image_url is
  '글 카드에 얹히는 그림. 쿡파일럿이 그려 준 레시피 카드를 올린 주소가 들어간다.';

/* 새 칸에도 넣고 고칠 권한을 따로 준다.
   이 표는 칸마다 권한을 주고 있어서(published 를 앱이 못 건드리게 하려고),
   칸을 더하면 권한도 같이 더해야 한다 — 안 그러면 조용히 안 써진다 */
grant insert (image_url) on table public.posts to authenticated;
grant update (image_url) on table public.posts to authenticated;

-- ---------------------------------------------------------------------
-- 그림이 놓일 자리
-- ---------------------------------------------------------------------

/* 버킷 하나를 만든다. public 으로 두는 까닭 — 커뮤니티 글에 붙는 그림이라
   로그인 안 한 사람도 봐야 한다. 비공개로 두면 볼 때마다 서명된 주소를
   만들어야 하는데, 목록에 열여섯 장이면 열여섯 번이다.

   대신 **올리는 쪽을 좁게** 막는다. 아래 정책을 보라 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-covers',
  'post-covers',
  true,
  -- 한 장에 2MB. 레시피 카드는 300KB 안팎이라 넉넉하다
  2097152,
  -- 우리가 만드는 것은 PNG 하나뿐이다. 다른 형식을 받아 줄 까닭이 없다
  array['image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 그림은 누구나 본다. 커뮤니티 글에 붙는 그림이라 감출 것이 없다
create policy "누구나 표지를 본다"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-covers');

/*
 * 올리는 것은 로그인한 사람만, 그리고 **자기 폴더에만**.
 *
 * `storage.foldername(name)[1]` 은 경로의 첫 칸이다. 즉 파일을
 * `<내 uuid>/무엇.png` 로만 올릴 수 있다. 이렇게 안 묶어 두면
 * 로그인한 아무나 남의 표지를 덮어쓸 수 있다.
 */
create policy "로그인한 사람이 자기 폴더에 표지를 올린다"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 지우는 것도 자기 것만
create policy "자기 표지만 지운다"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 덮어쓰는 것도 자기 것만. 같은 이름으로 다시 올릴 때 필요하다
create policy "자기 표지만 덮어쓴다"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
