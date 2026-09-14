-- ============================================
-- cron-setup.sql
-- Применять ВРУЧНУЮ через SQL Editor после деплоя Edge Function generate-qr.
-- Подставить <PROJECT_REF> и тот же секрет, что задан через
-- `supabase secrets set CRON_SECRET=...`
-- ============================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter database postgres set app.settings.cron_secret = '<ВСТАВИТЬ_ТОТ_ЖЕ_CRON_SECRET>';

select cron.schedule(
  'generate-and-expire-qr',
  '* * * * *', -- каждую минуту
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/generate-qr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Проверка:
-- select * from cron.job;
-- select * from cron.job_run_details order by start_time desc limit 5;
