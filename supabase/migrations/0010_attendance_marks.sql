-- ============================================
-- 0010_attendance_marks.sql
-- Отметки "опоздал" / "без карты" — дежурный отмечает, учитель видит
-- статистику по своему классу. Одна таблица на оба вида (поле kind),
-- чтобы не дублировать структуру и RLS дважды.
-- ============================================

create table attendance_marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id),
  building_id uuid references buildings(id),
  kind text not null check (kind in ('late', 'no_card')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_attendance_marks_class on attendance_marks(class_id, kind, created_at);
create index idx_attendance_marks_building on attendance_marks(building_id, kind, created_at);

alter table attendance_marks enable row level security;

-- Дежурный видит и создаёт отметки в своём текущем корпусе
create policy "security sees marks in active building" on attendance_marks
  for select using (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );

create policy "security creates marks in active building" on attendance_marks
  for insert with check (
    auth_role() = 'security' and building_id = auth_active_building_id()
  );

-- Удалить может любой дежурный этого корпуса, но только в день создания
-- (сравнение по московской календарной дате, а не по серверному UTC)
create policy "security deletes same-day marks in active building" on attendance_marks
  for delete using (
    auth_role() = 'security'
    and building_id = auth_active_building_id()
    and date(created_at at time zone 'Europe/Moscow') = date(now() at time zone 'Europe/Moscow')
  );

-- Учитель видит отметки своего класса (для статистики), без ограничения по дате
create policy "teacher sees own class marks" on attendance_marks
  for select using (
    class_id = auth_class_id()
  );

-- Админ управляет полностью — в частности, может чистить старую историю
create policy "admin manage marks" on attendance_marks
  for all using (auth_role() = 'admin');
