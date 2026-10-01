# SS-BMW — сайт специализированного сервиса BMW

Адаптивный одностраничный сайт (чистые HTML/CSS/JS, без сборки). Опубликован через GitHub Pages: <https://bestdeejay-design.github.io/SS-BMW-site/>

📋 Полный аудит, что сделано и план развития — [`docs/AUDIT.md`](docs/AUDIT.md) · Подключение заявок — [`docs/FORM-SETUP.md`](docs/FORM-SETUP.md)

## Структура проекта

```
index.html            — вся страница (секции по порядку, см. ниже)
css/styles.css        — стили, разбиты на 15 пронумерованных разделов
js/main.js            — меню, подсветка разделов, лайтбокс галереи, форма
assets/
  img/                — фото: hero, svc-1…6 (услуги), gal-* (галерея), about
  brand/              — логотип, favicon, иконки, og-image.jpg (превью для соцсетей)
  fonts/              — шрифт Manrope (self-hosted)
privacy.html          — политика обработки персональных данных (нужны реквизиты, см. TODO в файле)
404.html              — страница «не найдено» (сама определяет базовый путь)
robots.txt, sitemap.xml, site.webmanifest — SEO и PWA-метаданные
docs/                 — аудит и инструкции
scripts/check.mjs     — проверка сайта: node scripts/check.mjs (запускается и в GitHub Actions на каждый PR)
```

### Секции `index.html`
`#top` Hero → `#benefits` преимущества → `#services` услуги → `#process` как работаем → `#gallery` галерея → `#about` о нас → `#faq` вопросы → `#booking` запись → `#contacts` контакты.

## Запуск

```bash
python3 -m http.server 8000     # затем http://localhost:8000
```
Открывать `index.html` двойным кликом тоже можно, но шрифты/превью лучше проверять через сервер.

## Как менять контент

| Что | Где |
|---|---|
| Телефон, Telegram, адрес | `index.html` (искать `909-26-26`) и блок JSON-LD в `<head>` |
| Фото | заменить файл в `assets/img/` с тем же именем (WebP; hero 1600 px, услуги 640×800, галерея 1376 px) |
| Добавить фото в галерею | скопировать `<figure>` в `.gallery-grid`, указать `data-full` (большое) и `src` (превью) |
| Тексты услуг | секция `#services` |
| Отправка заявок | `data-endpoint` у `<form id="bookingForm">` (обработчик) или `data-telegram-user="username"` (чат Telegram с готовым текстом) |
| Яндекс.Метрика | добавить счётчик и `window.YM_ID = <номер>` — цели уже размечены через `data-track` |
| Свой домен | заменить URL в `index.html` и `privacy.html` (canonical, og:*, JSON-LD), `robots.txt`, `sitemap.xml`; в `scripts/check.mjs` поправить префикс `/SS-BMW-site/` для sitemap |

> После изменения CSS/JS увеличьте номер в `?v=` в подключении `styles.css` и `main.js`, чтобы сбросить кэш браузеров.

## Проверка перед публикацией
```bash
node scripts/check.mjs
```

## Важно
* Картинки в `assets/img/` — ИИ-иллюстрации в фирменном стиле; для доверия клиентов замените их реальными фото сервиса.
* Без `data-endpoint` форма открывает Telegram с готовым текстом заявки (см. `docs/FORM-SETUP.md`).
