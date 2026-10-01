/* SS-BMW — поведение сайта. Без зависимостей. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Аналитика: если подключена Яндекс.Метрика (ym) — шлём цели по data-track */
  function track(goal) {
    try { if (typeof window.ym === 'function' && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', goal); } catch (e) {}
  }
  $$('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
  });

  /* Шапка: фон при прокрутке */
  var header = $('#header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 25); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Мобильное меню */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* Подсветка текущего раздела в меню + плавное появление блоков */
  if ('IntersectionObserver' in window) {
    var links = {};
    $$('a[href^="#"]', nav).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$('a', nav).forEach(function (a) { a.classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$('.section-head, .service-card, .steps li, .gallery-grid figure, .about-copy, .about-photo, .faq-list, .booking > *, .contact-main').forEach(function (el) {
      el.classList.add('fade-in'); io.observe(el);
    });
  }

  /* Галерея: просмотр фото с листанием (кнопки, стрелки клавиатуры, свайп) */
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('img', lb), lbCount = $('.lb-count', lb);
    var shots = $$('.gallery-grid button'), cur = 0;
    var show = function (i) {
      cur = (i + shots.length) % shots.length;
      lbImg.src = shots[cur].getAttribute('data-full');
      lbImg.alt = shots[cur].getAttribute('data-alt') || '';
      lbCount.textContent = (cur + 1) + ' / ' + shots.length;
    };
    shots.forEach(function (b, i) {
      b.addEventListener('click', function () { show(i); lb.showModal(); });
    });
    $('.lb-prev', lb).addEventListener('click', function () { show(cur - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(cur + 1); });
    $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* Форма записи */
  var form = $('#bookingForm'), status = $('#formStatus');
  if (!form) return;

  // выбор услуги по клику на карточку
  $$('.service-card[data-service]').forEach(function (c) {
    c.addEventListener('click', function () {
      var sel = form.elements.service; if (sel) sel.value = c.getAttribute('data-service');
    });
  });

  // маска телефона +7 (___) ___-__-__
  var phone = form.elements.phone;
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '');
    if (!d) { phone.value = ''; return; }
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    d = d.slice(0, 10);
    var out = '+7';
    if (d.length) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    phone.value = out;
  });

  function say(msg, cls) { status.className = 'form-status ' + (cls || ''); status.innerHTML = msg; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.website.value) return;            // ловушка для ботов
    var name = form.elements.name, digits = phone.value.replace(/\D/g, '');
    [name, phone].forEach(function (i) { i.classList.remove('invalid'); });
    if (!name.value.trim()) { name.classList.add('invalid'); name.focus(); return say('Укажите имя.', 'err'); }
    if (digits.length < 11) { phone.classList.add('invalid'); phone.focus(); return say('Введите телефон полностью: +7 (___) ___-__-__.', 'err'); }
    if (!form.elements.consent.checked) { form.elements.consent.focus(); return say('Нужно согласие на обработку персональных данных.', 'err'); }

    var data = {
      name: name.value.trim(), phone: phone.value,
      service: form.elements.service.value || 'не указана',
      car: form.elements.car.value.trim() || 'не указан',
      comment: form.elements.comment.value.trim() || '—'
    };
    var text = 'Заявка с сайта SS-BMW\nИмя: ' + data.name + '\nТелефон: ' + data.phone +
               '\nУслуга: ' + data.service + '\nАвтомобиль: ' + data.car + '\nКомментарий: ' + data.comment;
    var endpoint = form.getAttribute('data-endpoint');
    var btn = $('button[type="submit"]', form);
    track('form-submit');

    if (endpoint) {
      // Режим 1: отправка на ваш обработчик (Telegram-бот, CRM, e-mail) — см. docs/FORM-SETUP.md
      btn.disabled = true; say('Отправляем…');
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say('Спасибо! Заявка отправлена — мы свяжемся с вами в ближайшее время.', 'ok'); })
        .catch(function () { say('Не удалось отправить. Позвоните нам: <a href="tel:+78129092626">+7 (812) 909-26-26</a>', 'err'); })
        .then(function () { btn.disabled = false; });
    } else {
      // Режим 2 (по умолчанию): Telegram. Текст заявки копируем в буфер — ссылка t.me/+телефон
      // не всегда подставляет текст сама (работает только для t.me/username, см. data-telegram-user).
      var user = form.getAttribute('data-telegram-user');
      var link = user ? 'https://t.me/' + user.replace(/^@/, '') + '?text=' + encodeURIComponent(text) : form.getAttribute('data-telegram');
      var copied = navigator.clipboard ? navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; }) : Promise.resolve(false);
      window.open(link, '_blank', 'noopener');
      copied.then(function (ok) {
        say('Открываем Telegram. ' + (user ? 'Заявка уже в поле сообщения — нажмите «Отправить». ' : (ok ? 'Текст заявки скопирован — вставьте его в чат и отправьте. ' : 'Напишите нам имя, телефон и автомобиль. ')) +
            'Или просто позвоните: <a href="tel:+78129092626">+7 (812) 909-26-26</a>.', 'ok');
      });
    }
  });
})();
