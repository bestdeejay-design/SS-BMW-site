#!/usr/bin/env node
// Быстрая проверка сайта без зависимостей:  node scripts/check.mjs
// Проверяет: существование файлов, якоря, уникальность id, alt/размеры у картинок,
// JSON-LD, sitemap, длину title/description, неиспользуемые ассеты.
import fs from 'node:fs';
import path from 'node:path';

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const used = new Set();

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const css = fs.readFileSync('css/styles.css', 'utf8');
const js = fs.readFileSync('js/main.js', 'utf8');
for (const m of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) used.add(m[1]);

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  // файлы
  for (const m of html.matchAll(/(?:src|href|srcset|imagesrcset)="([^"#]+)[^"]*"/g)) {
    if (m[1].startsWith('data:') || /['+]/.test(m[1])) continue;
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0].split('?')[0];
      if (!u || /^(https?:|tel:|mailto:|data:|\/)/.test(u) || u === './') continue;
      used.add(u);
      if (!fs.existsSync(u)) err(`${page}: нет файла ${u}`);
    }
  }
  // id и якоря
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  ids.filter((v, i) => ids.indexOf(v) !== i).forEach(i => err(`${page}: дубль id="${i}"`));
  if (page === 'index.html') for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) err(`${page}: битый якорь #${m[1]}`);
  // картинки
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (/src="data:/.test(m[0])) continue;
    if (!/\salt=/.test(m[0])) err(`${page}: <img> без alt: ${m[0].slice(0, 70)}`);
    if (!/\swidth=/.test(m[0]) || !/\sheight=/.test(m[0])) warn(`${page}: <img> без width/height: ${m[0].slice(0, 70)}`);
  }
  // мета
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  if (!title) err(`${page}: нет <title>`); else if (title.length > 75) warn(`${page}: title ${title.length} симв. (лучше ≤ 70)`);
  if (!desc && page !== '404.html') err(`${page}: нет description`); else if (desc.length > 170) warn(`${page}: description ${desc.length} симв. (лучше ≤ 160)`);
  if (!/<h1[\s>]/.test(html) && page !== '404.html') err(`${page}: нет <h1>`);
  if ((html.match(/<h1[\s>]/g) || []).length > 1) err(`${page}: больше одного <h1>`);
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(`${page}: некорректный JSON-LD (${e.message})`); }
  }
}

// sitemap -> файлы
const sm = fs.existsSync('sitemap.xml') ? fs.readFileSync('sitemap.xml', 'utf8') : '';
for (const m of sm.matchAll(/<loc>https?:\/\/[^/]+\/SS-BMW-site\/([^<]*)<\/loc>/g)) {
  const f = m[1] || 'index.html';
  if (!fs.existsSync(f)) err(`sitemap: нет страницы ${f}`);
}

// неиспользуемые ассеты (учитываем динамические: data-full в галерее, иконки из manifest/OG/JSON-LD)
const dynamic = new Set([...fs.readFileSync('index.html', 'utf8').matchAll(/data-full="([^"]+)"/g)].map(m => m[1]));
const extra = fs.readFileSync('site.webmanifest', 'utf8') + fs.readFileSync('index.html', 'utf8');
for (const f of walk('assets').map(f => f.split(path.sep).join('/'))) {
  if (f.endsWith('brand/logo.png')) continue; // исходник логотипа (мастер-файл)
  if (!used.has(f) && !dynamic.has(f) && !extra.includes(f)) warn(`ассет не используется: ${f}`);
}
if (!/\?v=\d+/.test(fs.readFileSync('index.html', 'utf8'))) warn('у css/js нет параметра версии ?v=');

console.log(`Страниц: ${pages.length}. Ошибок: ${errors.length}, предупреждений: ${warns.length}`);
errors.forEach(e => console.log('✖', e));
warns.forEach(w => console.log('⚠', w));
process.exit(errors.length ? 1 : 0);
