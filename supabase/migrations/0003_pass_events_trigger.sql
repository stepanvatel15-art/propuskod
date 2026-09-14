-- ============================================
-- 0003_pass_events_trigger.sql
-- Автоматическое логирование переходов статуса passes в pass_events
-- ============================================

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
        when 'approved'   then 'approved'
        when 'rejected'   then 'rejected'
        when 'qr_issued'  then 'qr_generated'
        when 'used'       then 'scanned_ok'
        when 'expired'    then 'expired'
        when 'cancelled'  then 'cancelled'
        else 'created'
      end,
      coalesce(new.approved_by, new.used_by, new.created_by),
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger trg_log_pass_event
after insert or update on passes
for each row execute function log_pass_event();
