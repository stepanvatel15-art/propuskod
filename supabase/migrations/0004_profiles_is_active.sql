-- ============================================
-- 0004_profiles_is_active.sql
-- Флаг деактивации пользователя (для админки)
-- ============================================

alter table profiles add column is_active boolean not null default true;
