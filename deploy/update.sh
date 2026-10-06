#!/usr/bin/env bash
# Обновление сайта до последней версии с GitHub.
# Запуск на сервере:  bash /opt/propuskod/app/deploy/update.sh
set -euo pipefail
cd /opt/propuskod/app
echo "==> Скачиваю изменения"; git pull --ff-only
echo "==> Ставлю зависимости"; npm ci --no-audit --no-fund --loglevel=error
echo "==> Собираю";            npm run build
echo "==> Перезапускаю";       pm2 restart propuskod --update-env
echo "Готово: $(git log -1 --format='%h %s')"
