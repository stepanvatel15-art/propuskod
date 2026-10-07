#!/usr/bin/env bash
# Перенос базы ПропусКода в новый проект Supabase (например, во Франкфурт).
#
# Что переносится: все таблицы приложения (public) с данными, учётные записи
# (auth.users + auth.identities — логины и пароли остаются прежними), живой
# список дежурного (Realtime). Старый проект НЕ изменяется — это резервная копия.
#
# Запуск на сервере (от root):  bash /opt/propuskod/app/deploy/migrate-db.sh
# Спросит: строку подключения к СТАРОЙ базе, к НОВОЙ базе и два ключа нового проекта.
#
# Откат (если что-то пошло не так): bash /opt/propuskod/app/deploy/migrate-db.sh --rollback

set -euo pipefail

APP_DIR="/opt/propuskod/app"
ENV_FILE="$APP_DIR/.env.production.local"
NGINX_SITE="/etc/nginx/sites-available/propuskod"
BACKUP_DIR="/opt/propuskod/backup-$(date +%Y%m%d-%H%M%S)"
WORK="/opt/propuskod/migrate-work"
PG="/usr/lib/postgresql/17/bin"

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Запустите от root"

# ------------------------------------------------------------------ откат
if [ "${1:-}" = "--rollback" ]; then
  last=$(ls -d /opt/propuskod/backup-* 2>/dev/null | sort | tail -1)
  [ -n "$last" ] || fail "Резервных копий настроек не найдено"
  say "Возвращаю настройки из $last"
  cp "$last/env" "$ENV_FILE"
  cp "$last/nginx" "$NGINX_SITE"
  nginx -t -q && systemctl reload nginx
  bash "$APP_DIR/deploy/update.sh"
  ok "Сайт снова работает со старой базой"
  exit 0
fi

# ------------------------------------------------------------------ 1. pg_dump 17
say "Ставлю инструменты PostgreSQL 17"
if [ ! -x "$PG/pg_dump" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y -qq postgresql-common >/dev/null
  /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y >/dev/null 2>&1 || true
  apt-get update -qq
  apt-get install -y -qq postgresql-client-17 >/dev/null
fi
[ -x "$PG/pg_dump" ] || fail "Не удалось установить postgresql-client-17"
ok "$($PG/pg_dump --version)"

# ------------------------------------------------------------------ 2. вопросы
say "Строки подключения (Supabase → Connect → Session pooler, с паролем базы вместо [YOUR-PASSWORD])"
echo "    Ввод не отображается — вставьте один раз (Cmd+V) и нажмите Enter."
read -rsp "    СТАРАЯ база: " OLD_DB </dev/tty; echo
read -rsp "    НОВАЯ база:  " NEW_DB </dev/tty; echo
[[ "$OLD_DB" == postgres* && "$NEW_DB" == postgres* ]] || fail "Строки должны начинаться с postgresql://"

q() { "$PG/psql" "$1" -X -q -t -A -v ON_ERROR_STOP=1 -c "$2"; }

say "Проверяю подключения"
q "$OLD_DB" "select 1" >/dev/null || fail "Не подключается к СТАРОЙ базе — проверьте пароль"
ok "Старая база: $(q "$OLD_DB" "select current_setting('server_version')")"
q "$NEW_DB" "select 1" >/dev/null || fail "Не подключается к НОВОЙ базе — проверьте пароль"
ok "Новая база:  $(q "$NEW_DB" "select current_setting('server_version')")"

new_tables=$(q "$NEW_DB" "select count(*) from pg_tables where schemaname='public'")
new_users=$(q "$NEW_DB" "select count(*) from auth.users")
[ "$new_tables" = "0" ] && [ "$new_users" = "0" ] || fail "Новая база не пустая (таблиц: $new_tables, пользователей: $new_users). Нужен чистый проект."

if [ "${1:-}" = "--check" ]; then
  say "Проверка пройдена — подключения работают, новая база пустая. Переезд можно запускать без --check."
  exit 0
fi

read -rp  "    URL нового проекта (https://xxxx.supabase.co): " NEW_URL </dev/tty
read -rp  "    Publishable / anon key нового проекта: " NEW_ANON </dev/tty
read -rsp "    Secret / service_role key нового проекта: " NEW_SERVICE </dev/tty; echo
NEW_HOST=$(echo "$NEW_URL" | sed -E 's#^https?://##; s#/.*$##')
[[ "$NEW_HOST" == *.supabase.co ]] || fail "URL должен быть вида https://xxxx.supabase.co"
[ -n "$NEW_ANON" ] && [ -n "$NEW_SERVICE" ] || fail "Ключи не должны быть пустыми"

# ------------------------------------------------------------------ 3. выгрузка
rm -rf "$WORK"; mkdir -p "$WORK"; chmod 700 "$WORK"
say "Выгружаю структуру таблиц"
"$PG/pg_dump" "$OLD_DB" --schema-only --no-owner -n public -f "$WORK/schema.raw.sql"
grep -vE '^(CREATE SCHEMA public;|COMMENT ON SCHEMA public )' "$WORK/schema.raw.sql" > "$WORK/schema.sql"
ok "Структура: $(grep -c '^CREATE TABLE' "$WORK/schema.sql") таблиц"

say "Выгружаю данные (ученики, пропуска, история, учётные записи)"
"$PG/pg_dump" "$OLD_DB" --data-only --no-owner --no-privileges \
  -n public -t auth.users -t auth.identities -f "$WORK/data.sql"
ok "Данные выгружены ($(du -h "$WORK/data.sql" | cut -f1))"

realtime=$(q "$OLD_DB" "select string_agg(format('%I.%I', schemaname, tablename), ', ') from pg_publication_tables where pubname='supabase_realtime'")
cron=$(q "$OLD_DB" "select count(*) from cron.job" 2>/dev/null || echo 0)

# ------------------------------------------------------------------ 4. загрузка
say "Создаю таблицы в новой базе"
"$PG/psql" "$NEW_DB" -X -q -v ON_ERROR_STOP=1 -f "$WORK/schema.sql" >/dev/null
ok "Таблицы, правила доступа (RLS), функции и триггеры созданы"

say "Загружаю данные"
{ echo "SET session_replication_role = replica;"; cat "$WORK/data.sql"; } \
  | "$PG/psql" "$NEW_DB" -X -q -v ON_ERROR_STOP=1 -1 >/dev/null
ok "Данные загружены"

if [ -n "$realtime" ]; then
  say "Включаю живой список (Realtime) для: $realtime"
  q "$NEW_DB" "alter publication supabase_realtime add table $realtime" >/dev/null
  ok "Realtime включён"
fi

# ------------------------------------------------------------------ 5. сверка
say "Сверяю количество записей"
mismatch=0
for t in $(q "$OLD_DB" "select format('%I.%I', schemaname, tablename) from pg_tables where schemaname='public' order by 1") auth.users auth.identities; do
  a=$(q "$OLD_DB" "select count(*) from $t"); b=$(q "$NEW_DB" "select count(*) from $t")
  if [ "$a" = "$b" ]; then printf '    %-28s %6s = %s\n' "$t" "$a" "$b"
  else printf '\033[1;31m    %-28s %6s ≠ %s\033[0m\n' "$t" "$a" "$b"; mismatch=1; fi
done
[ "$mismatch" = 0 ] || fail "Количество записей не совпадает — сайт НЕ переключён, всё работает по-старому. Покажите это Claude."
ok "Всё совпадает"

# ------------------------------------------------------------------ 6. переключение
say "Переключаю сайт на новую базу"
mkdir -p "$BACKUP_DIR"; cp "$ENV_FILE" "$BACKUP_DIR/env"; cp "$NGINX_SITE" "$BACKUP_DIR/nginx"
ok "Старые настройки сохранены в $BACKUP_DIR"

OLD_HOST=$(grep -oE '[a-z0-9]{20}\.supabase\.co' "$NGINX_SITE" | head -1)
sed -i "s/$OLD_HOST/$NEW_HOST/g" "$NGINX_SITE"
echo "$NEW_HOST" > /opt/propuskod/supabase-host
umask 077
sed -i -E "s#^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*#NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEW_ANON}#; s#^SUPABASE_SERVICE_ROLE_KEY=.*#SUPABASE_SERVICE_ROLE_KEY=${NEW_SERVICE}#" "$ENV_FILE"
umask 022
nginx -t -q && systemctl reload nginx
ok "nginx теперь ведёт на $NEW_HOST"

bash "$APP_DIR/deploy/update.sh"

code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' https://api.propuskod.ru/auth/v1/health || true)
t=$(curl -s -m 15 -o /dev/null -w '%{time_total}' "https://${NEW_HOST}/auth/v1/health" || true)
ok "api.propuskod.ru отвечает: $code; запрос к новой базе: ${t}s (было ~0.38s)"

rm -rf "$WORK"
[ "$cron" != "0" ] && printf '\n\033[1;33m!  В старой базе было %s задач pg_cron — скажите об этом Claude.\033[0m\n' "$cron"
printf '\n\033[1;32m Готово! Сайт работает с новой базой. Всем нужно один раз войти заново.\033[0m\n'
printf ' Откат при проблемах:  bash %s/deploy/migrate-db.sh --rollback\n\n' "$APP_DIR"
