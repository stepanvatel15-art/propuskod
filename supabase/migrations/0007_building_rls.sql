-- ============================================
-- 0007_building_rls.sql
-- Доступ дежурного администратора, ограниченный его текущим
-- выбранным корпусом (auth_active_building_id()).
-- ============================================

alter table buildings enable row level security;

create function auth_active_building_id() returns uuid
language sql stable security definer set search_path = public as $$
  select active_building_id from profiles where id = auth.uid()
$$;

-- Список корпусов — не секретная информация, нужна всем авторизованным
-- (дежурному — для выбора, админу — для управления)
create policy "authenticated read buildings" on buildings
  for select using (auth.uid() is not null);

create policy "admin manage buildings" on buildings
  for insert with check (auth_role() = 'admin');
create policy "admin update buildings" on buildings
  for update using (auth_role() = 'admin');

-- ---------- CLASSES: дежурный видит классы своего текущего корпуса ----------
create policy "security sees classes in active building" on classes
  for select using (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );

-- ---------- STUDENTS: дежурный видит учеников классов своего корпуса ----------
create policy "security sees students in active building" on students
  for select using (
    auth_role() = 'security'
    and class_id in (select id from classes where building_id = auth_active_building_id())
  );

-- ---------- PASSES: дежурный видит, создаёт и закрывает пропуска своего корпуса ----------
create policy "security sees passes in active building" on passes
  for select using (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );

create policy "security creates passes in active building" on passes
  for insert with check (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );

create policy "security closes passes in active building" on passes
  for update using (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );
