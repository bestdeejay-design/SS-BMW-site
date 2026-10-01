# Подключение отправки заявок

Форма на сайте (`#bookingForm`) работает в двух режимах.

## Режим по умолчанию (уже работает)
Если `data-endpoint=""` пустой, при отправке открывается Telegram, а текст заявки **копируется в буфер обмена** — клиент вставляет его в чат и отправляет.

⚠️ Ссылка вида `t.me/+телефон` **не умеет подставлять текст** сообщения (это работает только для ссылок с username: `t.me/username?text=…`) и открывает чат лишь если в настройках приватности Telegram разрешён поиск по номеру. Поэтому рекомендуем одно из двух:
* указать username рабочего аккаунта/бота: `data-telegram-user="ss_bmw_service"` — тогда текст заявки подставится в поле сообщения автоматически;
* подключить режим с обработчиком (ниже) — заявка придёт вам сама, без действий клиента.

Минус режима по умолчанию: клиент должен иметь Telegram и сам нажать «Отправить».

## Режим «заявка сразу вам» (рекомендуется)
Нужен небольшой серверный обработчик, который принимает JSON и пересылает его в Telegram-бот. Бесплатно и без своего сервера — **Cloudflare Workers**.

1. В Telegram у `@BotFather` создайте бота → получите `BOT_TOKEN`.
2. Напишите боту (или добавьте в рабочий чат) и узнайте `CHAT_ID` (например, через `@userinfobot` или `getUpdates`).
3. В Cloudflare → Workers → создайте Worker с кодом ниже, добавьте секреты `BOT_TOKEN`, `CHAT_ID`.
4. Скопируйте URL воркера и впишите в `index.html`:
   ```html
   <form id="bookingForm" ... data-endpoint="https://ss-bmw-form.<ваш-аккаунт>.workers.dev">
   ```

```js
// Cloudflare Worker: JSON -> Telegram
const ORIGIN = 'https://bestdeejay-design.github.io'; // или ваш домен
const cors = { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type' };

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
    const d = await req.json().catch(() => null);
    if (!d || !d.name || !d.phone) return new Response('Bad Request', { status: 400, headers: cors });
    const text = `🔧 Заявка с сайта SS-BMW\nИмя: ${d.name}\nТелефон: ${d.phone}\nУслуга: ${d.service}\nАвто: ${d.car}\nКомментарий: ${d.comment}`;
    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text })
    });
    return new Response(r.ok ? 'ok' : 'error', { status: r.ok ? 200 : 502, headers: cors });
  }
};
```

> ⚠️ Никогда не вставляйте `BOT_TOKEN` в код сайта — он публичный. Токен хранится только в секретах воркера.

Альтернативы без кода: Formspree/Getform (на e-mail), Make/Zapier, прямая интеграция с CRM (Bitrix24, AmoCRM) — достаточно прописать их URL в `data-endpoint`, если они принимают JSON.
