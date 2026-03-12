# Инструкция по развертыванию ProjectiON

## Быстрый старт

### Требования
- Node.js версии 18 или выше
- npm или yarn

### Установка и запуск

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd ProjectON

# 2. Установить зависимости
npm install

# 3. Запустить в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## Для Ubuntu/Linux

### Установка Node.js (если не установлен)

```bash
# Используя NodeSource (рекомендуется)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Или используя nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Проверка установки

```bash
node --version  # Должно показать v20.x.x или выше
npm --version   # Должно показать версию npm
```

### Запуск проекта

```bash
# Перейти в директорию проекта
cd ProjectON

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

## Сборка для продакшена

```bash
# Собрать проект
npm run build

# Запустить preview собранного проекта
npm run preview
```

Собранные файлы будут в папке `dist/`. Их можно развернуть на любом веб-сервере.

## Развертывание на веб-сервере

Проект настроен для работы по адресу `https://your-server-ip/projection`

### Быстрое развертывание (автоматический скрипт)

```bash
# 1. Сделайте скрипт исполняемым
chmod +x deploy.sh

# 2. Запустите развертывание (по умолчанию в /var/www/html/projection)
./deploy.sh

# Или укажите свой путь:
./deploy.sh /path/to/your/web/directory/projection
```

### Вариант 1: Nginx (рекомендуется)

#### Шаг 1: Сборка проекта

```bash
npm run build
```

#### Шаг 2: Копирование файлов на сервер

```bash
# Создайте директорию на сервере
sudo mkdir -p /var/www/html/projection

# Скопируйте собранные файлы
sudo cp -r dist/* /var/www/html/projection/

# Установите права доступа
sudo chown -R www-data:www-data /var/www/html/projection
sudo chmod -R 755 /var/www/html/projection
```

#### Шаг 3: Настройка Nginx

Скопируйте пример конфигурации:

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/projection
```

Отредактируйте файл `/etc/nginx/sites-available/projection`:

```nginx
server {
    listen 80;
    server_name your-server-ip;  # Замените на IP адрес вашего сервера

    root /var/www/html;
    index index.html;

    location /projection/ {
        alias /var/www/html/projection/dist/;
        try_files $uri $uri/ /projection/index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    error_page 404 /projection/index.html;
}
```

Активируйте конфигурацию:

```bash
# Создайте симлинк
sudo ln -s /etc/nginx/sites-available/projection /etc/nginx/sites-enabled/

# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

#### Шаг 4: Проверка

Откройте в браузере: `http://your-server-ip/projection`

### Вариант 2: Apache

#### Шаг 1: Сборка проекта

```bash
npm run build
```

#### Шаг 2: Копирование файлов

```bash
sudo mkdir -p /var/www/html/projection
sudo cp -r dist/* /var/www/html/projection/
sudo chown -R www-data:www-data /var/www/html/projection
```

#### Шаг 3: Настройка Apache

Создайте файл `/etc/apache2/sites-available/projection.conf`:

```apache
<VirtualHost *:80>
    ServerName your-server-ip
    
    DocumentRoot /var/www/html
    
    <Directory /var/www/html/projection>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /projection/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /projection/index.html [L]
    </Directory>
</VirtualHost>
```

Активируйте сайт:

```bash
sudo a2ensite projection.conf
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### Вариант 3: Простой HTTP сервер (для тестирования)

```bash
# После сборки
npm run build

# Запустите preview с base path
npm run preview -- --base /projection/
```

### Настройка HTTPS (рекомендуется для продакшена)

После настройки HTTP, установите SSL сертификат:

```bash
# Используя Let's Encrypt (Certbot)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d your-domain.com

# Или для IP адреса используйте самоподписанный сертификат
```

Обновите конфигурацию Nginx для HTTPS (см. пример в `nginx.conf.example`)

## Важные замечания

- Все данные хранятся в **localStorage браузера** - они не синхронизируются между устройствами
- Для работы приложения не требуется серверная часть - это полностью клиентское приложение
- После сборки (`npm run build`) можно просто скопировать папку `dist/` на любой веб-сервер

## Решение проблем

### Проблема: npm не найден
```bash
# Установите Node.js (см. инструкции выше)
```

### Проблема: Порт 5173 занят
```bash
# Vite автоматически предложит другой порт
# Или укажите другой порт явно:
npm run dev -- --port 3000
```

### Проблема: Ошибки при установке зависимостей
```bash
# Очистите кэш и переустановите
rm -rf node_modules package-lock.json
npm install
```
