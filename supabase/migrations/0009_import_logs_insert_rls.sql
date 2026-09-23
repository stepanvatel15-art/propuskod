-- ============================================
-- 0009_import_logs_insert_rls.sql
-- У import_logs была только SELECT-политика — вставка молча блокировалась
-- RLS (ошибка не проверялась в коде, поэтому оставалась незамеченной).
-- ============================================

create policy "teacher/admin insert import logs" on import_logs
  for insert with check (auth_role() = 'admin' or class_id = auth_class_id());
