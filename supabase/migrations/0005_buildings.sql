-- ============================================
-- 0005_buildings.sql
-- Корпуса (пропускные группы) — независимая сущность,
-- к которой класс привязывается гибко (можно менять каждое лето)
-- ============================================

create table buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- "1214", "425", "7А", "8А" и т.п.
  created_at timestamptz not null default now()
);

-- класс сейчас учится в этом корпусе (можно менять в любой момент)
alter table classes add column building_id uuid references buildings(id) on delete set null;

-- в каком корпусе дежурный сейчас работает (выбор на сессию/день, не жёсткая привязка)
alter table profiles add column active_building_id uuid references buildings(id) on delete set null;

-- корпус, в котором пропуск был создан — снимок на момент создания,
-- чтобы история не "переезжала" задним числом при летнем перераспределении классов
alter table passes add column building_id uuid references buildings(id);

create index idx_classes_building on classes(building_id);
create index idx_passes_building on passes(building_id);
create index idx_passes_building_status on passes(building_id, status) where status = 'approved';
