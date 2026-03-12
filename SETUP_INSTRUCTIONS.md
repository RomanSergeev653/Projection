# Инструкция по запуску проекта ProjectiON

## Текущая ситуация
- ✅ Проект найден и изучен
- ✅ Node.js установлен (версия 12.22.9)
- ❌ npm не установлен
- ⚠️ Требуется Node.js версии 18+ для работы проекта

## Шаги для запуска проекта

### Вариант 1: Установка через NodeSource (требует sudo)

Выполните в терминале:

```bash
# Установка Node.js 20.x через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка установки
node --version  # Должно показать v20.x.x
npm --version   # Должно показать версию npm

# Переход в директорию проекта
cd /home/komandaf5/Документы/cursor_projects/ProjectiON/Projection

# Установка зависимостей проекта
npm install

# Запуск проекта
npm run dev
```

### Вариант 2: Установка через nvm (без sudo, рекомендуется)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезагрузка конфигурации оболочки
source ~/.bashrc

# Установка Node.js 20
nvm install 20
nvm use 20

# Проверка
node --version
npm --version

# Переход в директорию проекта
cd /home/komandaf5/Документы/cursor_projects/ProjectiON/Projection

# Установка зависимостей
npm install

# Запуск проекта
npm run dev
```

### После успешного запуска

Приложение будет доступно по адресу: **http://localhost:5173**

Откройте этот адрес в браузере для работы с приложением.

## Что делает проект

ProjectiON - это веб-приложение для планирования нагрузки по нескольким проектам:
- Создание и управление проектами
- Автоматическое распределение часов по дням
- Ручное редактирование нагрузки
- Визуализация: Timeline, график нагрузки, календарная сетка
