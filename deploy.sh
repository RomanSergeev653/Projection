#!/bin/bash

# Скрипт для развертывания ProjectiON на сервере
# Использование: ./deploy.sh [путь_к_директории_на_сервере]

set -e

echo "🚀 Начало развертывания ProjectiON..."

# Путь на сервере (по умолчанию)
DEPLOY_PATH="${1:-/var/www/html/projection}"

# Сборка проекта
echo "📦 Сборка проекта..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Ошибка: директория dist не найдена после сборки"
    exit 1
fi

echo "✅ Сборка завершена"

# Проверка прав доступа
if [ ! -w "$(dirname "$DEPLOY_PATH")" ]; then
    echo "⚠️  Внимание: нет прав на запись в $DEPLOY_PATH"
    echo "   Возможно, потребуется выполнить команду с sudo:"
    echo "   sudo ./deploy.sh $DEPLOY_PATH"
    exit 1
fi

# Создание директории если не существует
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "📁 Создание директории $DEPLOY_PATH..."
    mkdir -p "$DEPLOY_PATH"
fi

# Копирование файлов
echo "📋 Копирование файлов в $DEPLOY_PATH..."
cp -r dist/* "$DEPLOY_PATH/"

# Установка прав доступа
echo "🔐 Установка прав доступа..."
chown -R www-data:www-data "$DEPLOY_PATH" 2>/dev/null || true
chmod -R 755 "$DEPLOY_PATH"

echo "✅ Развертывание завершено!"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Убедитесь, что Nginx настроен правильно (см. nginx.conf.example)"
echo "   2. Проверьте конфигурацию: sudo nginx -t"
echo "   3. Перезагрузите Nginx: sudo systemctl reload nginx"
echo "   4. Откройте в браузере: http://your-server-ip/projection"
echo ""

