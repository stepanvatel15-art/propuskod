-- ============================================
-- 0006_drop_qr.sql
-- Убираем QR полностью: дежурный работает с живым списком и кнопкой,
-- а не со сканером. Упрощаем набор статусов и событий.
-- ============================================

alter table passes drop column if exists qr_token;
alter table passes drop column if exists qr_generated_at;
alter table passes drop column if exists qr_expires_at;

alter table passes drop constraint if exists passes_status_check;
alter table passes add constraint passes_status_check
  check (status in ('pending','approved','used','rejected','cancelled'));

alter table pass_events drop constraint if exists pass_events_event_type_check;
alter table pass_events add constraint pass_events_event_type_check
  check (event_type in ('created','approved','rejected','released','cancelled'));

-- Триггер: statuses 'qr_issued'/'expired' больше не существуют,
-- 'used' теперь означает "дежурный отметил, что ребёнок вышел" → событие 'released'
create or replace function log_pass_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    insert into pass_events (pass_id, event_type, actor_id, metadata)
    values (new.id, 'created', new.created_by, jsonb_build_object('type', new.type));

  elsif TG_OP = 'UPDATE' and old.status is distinct from new.status then
    insert into pass_events (pass_id, event_type, actor_id, metadata)
    values (
      new.id,
      case new.status
        when 'approved'  then 'approved'
        when 'rejected'  then 'rejected'
        when 'used'      then 'released'
        when 'cancelled' then 'cancelled'
        else 'created'
      end,
      coalesce(new.approved_by, new.used_by, new.created_by),
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
  end if;
  return new;
end;
$$;
