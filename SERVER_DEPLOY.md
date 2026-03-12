# Инструкция по развертыванию на сервере

## Быстрое развертывание

### Шаг 1: Подготовка на локальной машине

```bash
# Клонируйте репозиторий (если еще не сделано)
git clone <repository-url>
cd ProjectiON/Projection

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### Шаг 2: Загрузка на сервер

#### Вариант A: Использование SCP

```bash
# Загрузите собранные файлы на сервер
scp -r dist/* user@your-server-ip:/var/www/html/projection/
```

#### Вариант B: Использование Git на сервере

```bash
# На сервере
ssh user@your-server-ip

# Клонируйте репозиторий
git clone <repository-url>
cd ProjectiON/Projection

# Установите Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите зависимости и соберите
npm install
npm run build

# Скопируйте файлы в веб-директорию
sudo mkdir -p /var/www/html/projection
sudo cp -r dist/* /var/www/html/projection/
sudo chown -R www-data:www-data /var/www/html/projection
```

### Шаг 3: Настройка Nginx

#### Установка Nginx (если не установлен)

```bash
sudo apt-get update
sudo apt-get install nginx
```

#### Создание конфигурации

```bash
# Скопируйте пример конфигурации
sudo cp nginx.conf.example /etc/nginx/sites-available/projection

# Отредактируйте конфигурацию
sudo nano /etc/nginx/sites-available/projection
```

Замените `your-server-ip` на IP адрес вашего сервера.

#### Активируйте конфигурацию

```bash
# Создайте симлинк
sudo ln -s /etc/nginx/sites-available/projection /etc/nginx/sites-enabled/

# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

### Шаг 4: Проверка

Откройте в браузере: `http://your-server-ip/projection`

## Обновление приложения

После внесения изменений в код:

```bash
# На локальной машине
npm run build

# Загрузите обновленные файлы на сервер
scp -r dist/* user@your-server-ip:/var/www/html/projection/
```

Или если используете Git на сервере:

```bash
# На сервере
cd ProjectiON/Projection
git pull
npm run build
sudo cp -r dist/* /var/www/html/projection/
```

## Настройка HTTPS (опционально, но рекомендуется)

### Использование Let's Encrypt

```bash
# Установите Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получите сертификат (если есть домен)
sudo certbot --nginx -d your-domain.com

# Или создайте самоподписанный сертификат для IP адреса
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/projection-selfsigned.key \
  -out /etc/ssl/certs/projection-selfsigned.crt
```

Затем обновите конфигурацию Nginx для использования HTTPS (см. пример в `nginx.conf.example`).

## Решение проблем

### Проблема: 404 ошибка при открытии /projection

- Убедитесь, что файлы скопированы в правильную директорию
- Проверьте права доступа: `sudo chown -R www-data:www-data /var/www/html/projection`
- Проверьте конфигурацию Nginx: `sudo nginx -t`

### Проблема: Статические файлы не загружаются

- Убедитесь, что в `vite.config.ts` установлен `base: '/projection/'`
- Пересоберите проект: `npm run build`
- Очистите кэш браузера

### Проблема: Приложение работает, но пути неправильные

- Проверьте, что `base: '/projection/'` установлен в `vite.config.ts`
- Убедитесь, что пересобрали проект после изменения конфигурации

## Структура файлов на сервере

После развертывания структура должна быть такой:

```
/var/www/html/
└── projection/
    └── dist/
        ├── index.html
        ├── assets/
        │   ├── index-[hash].js
        │   └── index-[hash].css
        └── ...
```

## Важные замечания

- Все данные хранятся в **localStorage браузера** каждого пользователя
- Каждый пользователь видит только свои проекты
- Данные не синхронизируются между пользователями или устройствами
- При очистке кэша браузера данные теряются

