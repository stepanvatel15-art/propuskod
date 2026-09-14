-- ============================================
-- 0002_rls.sql
-- Row Level Security: helper-функции + политики
-- ============================================

alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table passes enable row level security;
alter table pass_events enable row level security;
alter table import_logs enable row level security;

create function auth_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create function auth_class_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from classes where homeroom_teacher_id = auth.uid()
$$;

-- ---------- PROFILES ----------
create policy "self read" on profiles
  for select using (id = auth.uid() or auth_role() = 'admin');

create policy "admin manage profiles" on profiles
  for all using (auth_role() = 'admin');

-- ---------- CLASSES ----------
create policy "teacher sees own class" on classes
  for select using (homeroom_teacher_id = auth.uid() or auth_role() = 'admin');

create policy "admin manage classes" on classes
  for insert with check (auth_role() = 'admin');
create policy "admin update classes" on classes
  for update using (auth_role() = 'admin');
create policy "admin delete classes" on classes
  for delete using (auth_role() = 'admin');

-- ---------- STUDENTS ----------
-- security НЕ получает ни одной select-политики => доступа к этой таблице нет вообще
create policy "teacher sees own students" on students
  for select using (class_id = auth_class_id() or auth_role() = 'admin');

create policy "admin/teacher insert students" on students
  for insert with check (auth_role() = 'admin' or class_id = auth_class_id());

create policy "admin/teacher update students" on students
  for update using (auth_role() = 'admin' or class_id = auth_class_id());

-- ---------- PASSES ----------
create policy "teacher sees own class passes" on passes
  for select using (class_id = auth_class_id() or auth_role() = 'admin');

create policy "teacher creates passes for own class" on passes
  for insert with check (auth_role() = 'admin' or class_id = auth_class_id());

create policy "teacher updates own class passes" on passes
  for update using (auth_role() = 'admin' or class_id = auth_class_id());
-- Сканирование (status -> used) идёт НЕ через эту политику,
-- а через Edge Function /scan с service_role, которая обходит RLS осознанно.

-- ---------- PASS_EVENTS ----------
create policy "teacher sees own class events" on pass_events
  for select using (
    auth_role() = 'admin'
    or exists (
      select 1 from passes p
      where p.id = pass_events.pass_id and p.class_id = auth_class_id()
    )
  );
-- insert в pass_events делают только триггер (security definer) и service_role,
-- обычным ролям insert не даём вообще.

-- ---------- IMPORT LOGS ----------
create policy "teacher/admin see own import logs" on import_logs
  for select using (auth_role() = 'admin' or class_id = auth_class_id());
