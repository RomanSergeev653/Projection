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

### Вариант 1: Простой HTTP сервер

```bash
# После сборки
npm run build

# Использовать встроенный preview
npm run preview

# Или использовать любой статический сервер
cd dist
python3 -m http.server 8000
# Или
npx serve dist
```

### Вариант 2: Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/ProjectON/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Вариант 3: Apache

Создайте файл `.htaccess` в папке `dist/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

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
