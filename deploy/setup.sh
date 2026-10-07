#!/usr/bin/env bash
# Установка ПропусКода на чистый сервер Ubuntu (Beget VPS).
#
# Что делает:
#   1. Проверяет, что сервер видит базу Supabase
#   2. Ставит Node.js 22, nginx, PM2, certbot
#   3. Скачивает код с GitHub, спрашивает ключи, собирает сайт
#   4. Настраивает nginx:
#        propuskod.ru, www  -> сайт (Next.js на порту 3000)
#        api.propuskod.ru   -> прокси к Supabase (база, вход, живой список)
#   5. Получает бесплатный сертификат https (Let's Encrypt)
#
# Запуск (от root):  bash /opt/propuskod/app/deploy/setup.sh
# Повторный запуск безопасен.

set -euo pipefail

DOMAIN="propuskod.ru"
API_DOMAIN="api.propuskod.ru"
SUPABASE_HOST="ghoijytaxobqxsotctjy.supabase.co"
# после переезда базы (deploy/migrate-db.sh) адрес новой базы хранится здесь
[ -f /opt/propuskod/supabase-host ] && SUPABASE_HOST="$(cat /opt/propuskod/supabase-host)"
REPO="https://github.com/stepanvatel15-art/propuskod"
APP_DIR="/opt/propuskod/app"
APP_PORT=3000

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Запустите от root: sudo bash $0"

# ---------------------------------------------------------------- 1. Supabase
say "Проверяю, что сервер видит базу Supabase"
code=$(curl -s -m 20 -o /dev/null -w '%{http_code}' "https://${SUPABASE_HOST}/rest/v1/" || true)
if [ "$code" = "000" ]; then
  fail "Сервер НЕ может связаться с Supabase (${SUPABASE_HOST}).
  Дальше ставить нет смысла. Напишите Claude: «сервер не видит Supabase» —
  нужен другой вариант (база прямо на этом сервере)."
fi
ok "Supabase отвечает (код ${code})"

# ---------------------------------------------------------------- 2. DNS
say "Проверяю, что домены смотрят на этот сервер"
MY_IPS=$(hostname -I)
for d in "$DOMAIN" "www.$DOMAIN" "$API_DOMAIN"; do
  ip=$(getent ahostsv4 "$d" | awk 'NR==1{print $1}' || true)
  if [ -n "$ip" ] && echo " $MY_IPS " | grep -q " $ip "; then
    ok "$d -> $ip"
  else
    fail "$d указывает на '${ip:-ничего}', а IP этого сервера: ${MY_IPS}
  Поправьте A-записи в Beget → DNS и подождите 10–15 минут, затем запустите скрипт снова."
  fi
done

# ---------------------------------------------------------------- 3. Swap
mem_mb=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 3000 ] && ! swapon --show | grep -q .; then
  say "Добавляю 2 ГБ файла подкачки (памяти мало для сборки)"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "Подкачка включена"
fi

# ---------------------------------------------------------------- 4. Пакеты
say "Ставлю системные пакеты (пара минут)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates nginx certbot python3-certbot-nginx >/dev/null
ok "git, nginx, certbot"

node_major=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/' || echo 0)
if [ "${node_major:-0}" -lt 20 ]; then
  say "Ставлю Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
ok "Node.js $(node -v)"

command -v pm2 >/dev/null || npm install -g pm2 --silent
ok "PM2 $(pm2 -v)"

# ---------------------------------------------------------------- 5. Код
say "Скачиваю код с GitHub"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
ok "Версия: $(git -C "$APP_DIR" log -1 --format='%h %s')"

# ---------------------------------------------------------------- 6. Ключи
ENV_FILE="$APP_DIR/.env.production.local"
if [ ! -f "$ENV_FILE" ]; then
  say "Нужны ключи Supabase — они есть в файле .env.local на вашем Маке"
  echo "    (вставка: Cmd+V или правая кнопка мыши; ввод секретного ключа не отображается — это нормально)"
  read -rp  "    NEXT_PUBLIC_SUPABASE_ANON_KEY = " ANON </dev/tty
  read -rsp "    SUPABASE_SERVICE_ROLE_KEY     = " SERVICE </dev/tty; echo
  [ -n "$ANON" ] && [ -n "$SERVICE" ] || fail "Ключи не должны быть пустыми"
  umask 077
  cat > "$ENV_FILE" <<EOF
# Браузеры ходят к базе через наш сервер (api.propuskod.ru), а не напрямую в Supabase
NEXT_PUBLIC_SUPABASE_URL=https://${API_DOMAIN}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE}
EOF
  umask 022
  ok "Ключи сохранены в $ENV_FILE"
else
  ok "Ключи уже сохранены ранее"
fi

# ---------------------------------------------------------------- 7. nginx
say "Настраиваю nginx"
cat > /etc/nginx/conf.d/00-websocket-map.conf <<'EOF'
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}
EOF

cat > /etc/nginx/sites-available/propuskod <<EOF
# --- Сайт ---
server {
  listen 80;
  server_name ${DOMAIN} www.${DOMAIN};
  client_max_body_size 10m;   # загрузка Excel со списком класса

  location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
  }
}

# --- Прокси к Supabase (база, вход, живой список дежурного) ---
server {
  listen 80;
  server_name ${API_DOMAIN};
  client_max_body_size 10m;

  location / {
    proxy_pass https://${SUPABASE_HOST};
    proxy_ssl_server_name on;
    proxy_set_header Host ${SUPABASE_HOST};
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;          # websocket для живого списка
    proxy_set_header Connection \$connection_upgrade;
    proxy_read_timeout 1h;
    proxy_send_timeout 1h;
    proxy_buffering off;
  }
}
EOF
ln -sf /etc/nginx/sites-available/propuskod /etc/nginx/sites-enabled/propuskod
rm -f /etc/nginx/sites-enabled/default
nginx -t -q && systemctl reload nginx
ok "nginx настроен"

# ---------------------------------------------------------------- 8. Сборка и запуск
say "Собираю сайт (3–6 минут, это нормально)"
cd "$APP_DIR"
npm ci --no-audit --no-fund --loglevel=error
npm run build
ok "Сборка готова"

say "Запускаю сайт"
pm2 delete propuskod >/dev/null 2>&1 || true
PORT=$APP_PORT pm2 start npm --name propuskod -- start >/dev/null
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
sleep 3
curl -sf -o /dev/null "http://127.0.0.1:${APP_PORT}/login" && ok "Сайт отвечает" || fail "Сайт не запустился. Покажите Claude вывод команды: pm2 logs propuskod --lines 50"

# ---------------------------------------------------------------- 9. HTTPS
# nginx-конфиг выше записан заново (только порт 80), поэтому https подключаем
# КАЖДЫЙ раз: при первом запуске — с получением сертификата, потом — уже имеющийся.
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  say "Получаю сертификат https"
  read -rp "    Ваш e-mail (для уведомлений о сертификате): " EMAIL </dev/tty
  certbot --nginx --non-interactive --agree-tos --redirect -m "$EMAIL" \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN"
else
  say "Подключаю имеющийся сертификат https"
  certbot --nginx --non-interactive --reinstall --redirect \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN"
fi
code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "https://${DOMAIN}/login" || true)
[ "$code" = "200" ] || fail "https://${DOMAIN} не отвечает (код ${code}). Покажите это Claude."
ok "https включён, сертификат будет продлеваться автоматически"

printf '\n\033[1;32m Готово! Откройте https://%s \033[0m\n' "$DOMAIN"
printf ' Обновить сайт после изменений в коде:  bash %s/deploy/update.sh\n\n' "$APP_DIR"
