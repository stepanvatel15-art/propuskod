-- ============================================
-- 0001_init.sql
-- Базовые таблицы системы пропусков
-- ============================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login text unique not null,
  full_name text not null,
  role text not null check (role in ('teacher','security','admin')),
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  homeroom_teacher_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date not null,
  class_id uuid not null references classes(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_students_class on students(class_id);

create table passes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id),
  type text not null check (type in ('request','direct')),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','qr_issued','used','expired','cancelled')),

  reason text,
  requested_departure_at timestamptz not null,

  created_by uuid not null references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,

  qr_token uuid unique,
  qr_generated_at timestamptz,
  qr_expires_at timestamptz,

  used_at timestamptz,
  used_by uuid references profiles(id),

  created_at timestamptz not null default now()
);

create index idx_passes_class on passes(class_id);
create index idx_passes_status on passes(status);
create index idx_passes_qr_expires on passes(qr_expires_at) where status = 'approved';
create unique index idx_passes_qr_token on passes(qr_token) where qr_token is not null;

create table pass_events (
  id bigint generated always as identity primary key,
  pass_id uuid not null references passes(id) on delete cascade,
  event_type text not null check (event_type in
    ('created','approved','rejected','qr_generated','scanned_ok','scanned_denied','expired','cancelled')),
  actor_id uuid references profiles(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_pass on pass_events(pass_id);

create table import_logs (
  id bigint generated always as identity primary key,
  class_id uuid references classes(id),
  performed_by uuid references profiles(id),
  file_name text,
  rows_total int,
  rows_created int,
  rows_skipped int,
  errors jsonb,
  created_at timestamptz not null default now()
);
