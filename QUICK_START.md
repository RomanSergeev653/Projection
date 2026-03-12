# Быстрый старт - Развертывание на сервере

## Что было сделано

✅ Проект настроен для работы по адресу `https://your-server-ip/projection`
✅ Создан скрипт автоматического развертывания `deploy.sh`
✅ Добавлена конфигурация Nginx `nginx.conf.example`
✅ Обновлена документация

## Быстрое развертывание (3 шага)

### 1. Сборка проекта

```bash
npm run build
```

### 2. Загрузка на сервер

```bash
# Используйте скрипт (рекомендуется)
chmod +x deploy.sh
./deploy.sh

# Или вручную
scp -r dist/* user@your-server-ip:/var/www/html/projection/
```

### 3. Настройка Nginx

```bash
# На сервере
sudo cp nginx.conf.example /etc/nginx/sites-available/projection
sudo nano /etc/nginx/sites-available/projection  # Замените your-server-ip на ваш IP
sudo ln -s /etc/nginx/sites-available/projection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Готово! 

Откройте: `http://your-server-ip/projection`

## Подробные инструкции

- Полная инструкция: [SERVER_DEPLOY.md](./SERVER_DEPLOY.md)
- Общая документация: [DEPLOY.md](./DEPLOY.md)

