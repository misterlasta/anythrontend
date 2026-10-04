const CONFIG = {
  manifestUrl: 'https://misterlasta.github.io/anythrontend/tonconnect-manifest.json',

  recipient: 'Capiton',
  amountNano: '1000000000',
  adminIds: [5236965009, 8593240092],
};

const $ = (s) => document.querySelector(s);
const logBox = $('#log');
const statusEl = $('#status');
const toastEl = $('#toast');
const tg = window.Telegram?.WebApp || null;
const inTG = !!tg?.initData;

function log(msg) {
  if (!logBox) return;
  const time = new Date().toLocaleTimeString();
  logBox.innerHTML += `<div><span class="t">[${time}]</span> ${msg}</div>`;
  logBox.scrollTop = logBox.scrollHeight;
}
function setStatus(text, cls = '') {
  if (!statusEl) return;
  statusEl.className = 'status ' + cls;
  statusEl.textContent = text;
}
let toastTimer;
function toast(text, haptic = null) {
  if (toastEl) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  try {
    if (haptic) tg?.HapticFeedback?.notificationOccurred?.(haptic);
    else tg?.HapticFeedback?.selectionChanged?.();
  } catch (_) {}

  try { if (inTG) tg.showAlert(text); } catch (_) {}
}
function haptic(type = 'light') {
  try { tg?.HapticFeedback?.impactOccurred?.(type); } catch (_) {}
}
function currentTgId() {
  try { return tg?.initDataUnsafe?.user?.id || null; } catch (_) { return null; }
}
function isAdmin() {
  const id = currentTgId();
  return id != null && CONFIG.adminIds.includes(Number(id));
}
function refreshAdminVisibility() {
  const btn = document.querySelector('#openAdmin');
  if (btn) btn.style.display = isAdmin() ? '' : 'none';
}
function needAdmin() {
  if (isAdmin()) return true;
  toast(inTG ? 'Нет доступа: панель только для админов' : 'Админка доступна только в Telegram для админов', 'error');
  return false;
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('capiton_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {}
  if (tg && tg.colorScheme === 'dark') return 'dark';
  return 'light';
}
function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  const btn = document.querySelector('#themeToggle');
  if (btn) btn.textContent = name === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('capiton_theme', name); } catch (_) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', name === 'dark' ? '#121317' : '#ffffff');
  try {
    if (tg && window.Telegram && Telegram.WebApp) {
      if (name === 'dark') { try { tg.setHeaderColor?.('#121317'); tg.setBackgroundColor?.('#121317'); } catch (_) {} }
    }
  } catch (_) {}
}
function applyTGTheme() {
  if (!tg) return;
  const p = tg.themeParams || {};
  const root = document.documentElement;

  if (p.bg_color) root.style.setProperty('--theme-surface-surface', p.bg_color);
  if (p.text_color) root.style.setProperty('--theme-surface-on-surface', p.text_color);
  if (p.hint_color) root.style.setProperty('--theme-surface-on-surface-variant', p.hint_color);
  if (p.secondary_bg_color) root.style.setProperty('--theme-surface-container', p.secondary_bg_color);
  if (p.button_color) root.style.setProperty('--theme-primary', p.button_color);
  root.dataset.tgTheme = tg.colorScheme || 'light';
  try {
    tg.setHeaderColor?.('bg_color');
    tg.setBackgroundColor?.(p.bg_color || '#ffffff');
  } catch (_) {}
}

function initTelegram() {
  if (!tg) { log('открыто в браузере (вне TG)'); return; }
  try {
    tg.ready();
    tg.expand();
    try { tg.disableVerticalSwipes?.(); } catch (_) {}
    try { tg.enableClosingConfirmation?.(); } catch (_) {}
    try { tg.setHeaderColor?.('bg_color'); tg.setBackgroundColor?.('#ffffff'); } catch (_) {}
    applyTGTheme();
    tg.onEvent?.('themeChanged', applyTGTheme);
    tg.onEvent?.('viewportChanged', () => {
      document.documentElement.style.setProperty('--tg-viewport-height', (tg.viewportHeight || window.innerHeight) + 'px');
    });

    const u = tg.initDataUnsafe?.user;
    const badge = $('#tg-user');
    if (u && badge) {
      badge.hidden = false;
      badge.innerHTML = `👋 <b>${u.first_name || ''}${u.last_name ? ' ' + u.last_name : ''}</b>` +
        (u.username ? ` <span>@${u.username}</span>` : '') + ` <span>· Mini App</span>`;
    }
    if (inTG) document.body.classList.add('in-tg');
    log(inTG ? 'Telegram Mini App: авторизован' : 'Telegram WebView (тест, без initData)');
  } catch (e) { log('TG init error: ' + e.message); }
}

function syncMainButton() {
  if (!tg?.MainButton || !inTG) return;
  try {
    tg.MainButton.setText(selectedLot ? ('Купить за ' + selectedLot.price) : 'Купить лот');
    tg.MainButton.show();
    if (!tonConnectUI?.connected) tg.MainButton.disable();
    else tg.MainButton.enable();
  } catch (_) {}
}
try { tg?.MainButton?.onClick?.(() => { haptic('medium'); onInvest(); }); } catch (_) {}

let tonConnectUI = null;
try {
  if (window.TON_CONNECT_UI) {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: CONFIG.manifestUrl,
      buttonRootId: 'ton-connect',
    });
    log('TON Connect инициализирован');
    tonConnectUI.onStatusChange((w) => {
      if (w) {
        setStatus('Кошелёк подключён: ' + (w.account?.address?.slice(0, 10) + '…'), 'ok');
        log('wallet connected');
        haptic('light');
      } else { setStatus('Кошелёк отключён', ''); }
      syncMainButton();
    });
  } else {
    log('TON_CONNECT_UI не загрузился (проверь интернет)');
  }
} catch (e) { log('TON init error: ' + e.message); }

function isValidTonAddress(a) {
  return typeof a === 'string' && /^[UEk0]Q[A-Za-z0-9_-]{46}$/.test(a);
}
const LOTS = [
  { id: 'lot1', title: 'Лот 01 · пример', desc: 'Пример инвестиционного лота для витрины.', price: '1 TON', nano: '1000000000', tag: 'пример', grad: 'linear-gradient(135deg,#1a73e8,#7c5cff)', logo: 'C1', stage: 'live', format: 'online', loc: 'Онлайн', goal: '100 TON', verified: true },
  { id: 'lot2', title: 'Лот 02 · пример', desc: 'Пример инвестиционного лота для витрины.', price: '2 TON', nano: '2000000000', tag: 'пример', grad: 'linear-gradient(135deg,#0ea5e9,#22d3ee)', logo: 'C2', stage: 'idea', format: 'offline', loc: 'Москва', goal: '200 TON', verified: true },
  { id: 'uzv', title: 'Ферма · пример лота', desc: 'Один из примеров, не основной проект.', price: '1 TON', nano: '1000000000', tag: 'пример', grad: 'linear-gradient(135deg,#10b981,#84cc16)', logo: 'Ф', stage: 'idea', format: 'offline', loc: 'Мурманск', goal: '500 TON', verified: false },
  { id: 'lot4', title: 'Лот 04 · пример', desc: 'Пример инвестиционного лота для витрины.', price: '0.3 TON', nano: '300000000', tag: 'пример', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', logo: 'C4', stage: 'live', format: 'hybrid', loc: 'Онлайн', goal: '30 TON', verified: true },
];
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function logoHtml(lot, cls) {
  const lg = (lot.logo || (lot.title || '?').slice(0, 1)).trim();
  if (/^https?:\/\//i.test(lg)) return `<span class="${cls}"><img src="${esc(lg)}" alt=""></span>`;
  return `<span class="${cls}">${esc(lg.slice(0, 2))}</span>`;
}
function vBadge(lot) { return lot.verified ? '<span class="vbadge" title="Верифицирован">✓</span>' : ''; }
function stageName(s) { return s === 'live' ? 'существует' : 'идея'; }
function normText(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\u200b-\u200f]/g, '').replace(/\s+/g, ' ').trim();
}
function hasWord(text, words) {
  const found = [];
  for (const w of words) {
    try {
      const re = new RegExp('(^|[^a-zа-я0-9])' + w + '([^a-zа-я0-9]|$)', 'i');
      if (re.test(text)) found.push(w);
    } catch (_) { if (text.includes(w)) found.push(w); }
  }
  return found;
}
function aiModerate(lot, all) {
  const title = String(lot.title || '').trim();
  const desc = String(lot.desc || '').trim();
  const text = normText(title + ' ' + desc);
  const priceNum = parseFloat(lot.price) || 0;
  const goalNum = parseFloat(lot.goal) || 0;
  let score = 100;
  const critical = [];
  const warnings = [];
  const tips = [];
  const clampSub = (v, cap) => Math.min(v, cap);

  const scamCombos = [
    { words: ['удвою', 'депозит'], label: 'удвоение депозита' },
    { words: ['верну', 'x2'], label: 'возврат x2' },
    { words: ['пришли', 'ton', 'верну'], label: 'просит прислать TON с возвратом' },
    { words: ['seed', 'фраз'], label: 'просит seed-фразу' },
    { words: ['приватный', 'ключ'], label: 'просит приватный ключ' },
    { words: ['пирамид'], label: 'пирамида' },
    { words: ['бесплатн', 'деньги'], label: 'обещание бесплатных денег' },
    { words: ['деньги', 'даром'], label: 'обещание бесплатных денег' },
    { words: ['халява'], label: 'халява — обещание бесплатных денег' },
    { words: ['раздач', 'денег'], label: 'раздача денег' },
    { words: ['раздач', 'ton'], label: 'раздача TON' },
  ];
  let severe = 0;
  for (const c of scamCombos) {
    const hits = c.words.filter(w => text.includes(w));
    if (hits.length >= Math.min(2, c.words.length) && (c.words.length === 1 ? hasWord(text, c.words).length : true)) {
      if (c.words.length === 1 && !hasWord(text, c.words).length) continue;
      severe++;
      critical.push(c.label);
      score -= 45;
    }
  }
  const matRoots = ['хуй', 'хуе', 'хую', 'хуя', 'пизд', 'пезд', 'ебан', 'ебат', 'ебал', 'ебет', 'ебу', 'еби', 'бляд', 'блях', 'сука', 'суки', 'сучк', 'залуп', 'говн', 'сран', 'дроч', 'пидор', 'педик', 'херня', 'херню', 'хером'];
  const matHits = [...new Set(matRoots.filter(w => text.includes(w)))];
  if (matHits.length) {
    severe++;
    critical.push('мат: ' + matHits.slice(0, 4).join(', '));
    score -= 35;
    if (matHits.length >= 3) { severe++; score -= 25; }
  }
  const profitMatch = text.match(/(\d{2,4})\s*%\s*(в\s*(день|сутки|неделю)|годовых|месяц)/);
  if (profitMatch) {
    const pct = parseInt(profitMatch[1], 10);
    const period = profitMatch[2] || '';
    if (/день|сутки|неделю/.test(period) && pct >= 5) { severe++; critical.push('доход ' + pct + '% за короткий срок'); score -= 40; }
    else if (pct >= 500) { warnings.push('доход ' + pct + '% — нужны доказательства'); score -= 12; }
  }
  if (/гарант.*(прибыл|доход|возврат)/.test(text) && /(без\s*риска|100\s*%|точно)/.test(text)) {
    severe++;
    critical.push('гарантия прибыли без риска');
    score -= 40;
  }
  const risky = hasWord(text, ['казино', 'ставк', 'букмекер', 'кредит', 'займ.*под.*процент']);
  if (risky.length && severe === 0) { warnings.push('рискованная тема: ' + risky.join(', ') + ' — проверь вручную'); score -= clampSub(10, 10); }
  const pressure = hasWord(text, ['только сегодня', 'успей', 'последний шанс', 'срочно вложи']);
  if (pressure.length) { tips.push('давление на покупателя: ' + pressure.join(', ')); score -= 4; }

  const tLen = title.replace(/\s/g, '').length;
  const dLen = desc.trim().length;
  if (tLen < 3) { warnings.push('название короче 3 букв'); score -= 8; }
  else if (tLen < 6) { tips.push('название короткое — добавь specificity'); score -= 2; }
  if (dLen < 20) { warnings.push('описание короче 20 символов'); score -= 8; }
  else if (dLen < 60) { tips.push('опиши подробнее: куда пойдут средства, сроки'); score -= 3; }
  else if (dLen >= 200) { score += 2; }

  const letters = desc.match(/[A-Za-zА-Яа-я]/g) || [];
  const caps = (desc.match(/[A-ZА-Я]/g) || []).length;
  if (letters.length > 20 && caps / letters.length > 0.7) { tips.push('много капса — читается как спам'); score -= 4; }
  const links = (desc.match(/https?:\/\/|t\.me\/|@[\w_]{3,}/gi) || []).length;
  const emojiSpam = (desc.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  if (links > 3) { warnings.push('много ссылок: ' + links); score -= 6; }
  if (emojiSpam > 8) { tips.push('много эмодзи'); score -= 3; }
  if (links > 0 && dLen < 40) { tips.push('есть ссылка, но мало описания'); score -= 3; }

  const gibberishFlags = (s) => {
    const flags = [];
    const letters = (String(s || '').match(/[A-Za-zА-Яа-яЁё]/g) || []).join('').toLowerCase();
    if (letters.length < 12) return flags;
    const vowels = (letters.match(/[аеёиоуыэюяaeiou]/g) || []).length;
    const ratio = vowels / letters.length;
    if (ratio < 0.2) flags.push('текст почти без гласных — похож на случайный набор');
    if (new Set(letters).size / letters.length < 0.4) flags.push('однообразный набор букв — похоже на мусор');
    if (/(..)\1{3,}/.test(letters)) flags.push('повторяющиеся слоги — похоже на мусор');
    if (/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxz]{6,}/.test(letters)) flags.push('непроизносимый набор согласных');
    const words = String(s || '').split(/\s+/).filter(w => /[A-Za-zА-Яа-яЁё]/.test(w));
    if (words.length >= 2) {
      const avg = words.join('').length / words.length;
      if (avg > 15) flags.push('слишком длинные «слова» без пробелов');
    }
    return flags;
  };
  const gib = [...gibberishFlags(title), ...gibberishFlags(desc)];
  if (gib.length) {
    const uniq = [...new Set(gib)];
    warnings.push('мусор в тексте: ' + uniq.join('; '));
    score -= 18 + 7 * (uniq.length - 1);
  }

  if (!(priceNum > 0)) { warnings.push('нет цены акции'); score -= 12; }
  if (/e[+-]?\d/i.test(String(lot.price || ''))) { warnings.push('цена в экспоненциальной записи — проверь нолики'); score -= 15; }
  if (/e[+-]?\d/i.test(String(lot.goal || ''))) { warnings.push('цель в экспоненциальной записи — проверь нолики'); score -= 10; }
  if (goalNum > 0 && priceNum > 0 && goalNum < priceNum) { warnings.push('цель меньше цены 1 акции — проверь цифры'); score -= 8; }
  if (goalNum > 5000000 && goalNum <= 1e9) { warnings.push('цель > 5 млн TON — выглядит как опечатка'); score -= 15; }
  if (goalNum > 1e9) { severe++; critical.push('цель нереальна (>1 млрд TON)'); score -= 40; }
  if (priceNum > 10000 && priceNum <= 1000000) { warnings.push('цена акции очень высокая — проверь нолики'); score -= 15; }
  if (priceNum > 1000000) { severe++; critical.push('цена акции нереальна (>1 млн TON)'); score -= 40; }
  if (!lot.loc) { tips.push('нет локации'); score -= 2; }

  try {
    const pool = Array.isArray(all) ? all : LOTS;
    const nt = normText(title);
    if (nt.length > 8) {
      const dup = pool.filter(x => x.id !== lot.id && normText(x.title) === nt).length;
      if (dup) { warnings.push('такое название уже есть — возможно дубль'); score -= 6; }
    }
  } catch (_) {}

  score = Math.max(5, Math.min(99, Math.round(score)));
  let verdict;
  if (severe >= 2 || (severe >= 1 && score < 30)) verdict = 'reject';
  else if (severe >= 1 || score < 55) verdict = 'review';
  else verdict = 'auto';
  if (verdict === 'reject' && critical.length === 0) verdict = 'review';
  const fix = [];
  if (dLen < 60) fix.push('добавь 2-3 предложения: что за проект, куда пойдут деньги, сроки');
  if (!(priceNum > 0)) fix.push('укажи цену 1 акции в TON');
  if (!lot.loc) fix.push('укажи город или «онлайн»');
  if (warnings.some(w => w.startsWith('доход'))) fix.push('убери % доходности или приложи отчётность');
  if (critical.some(c => c.startsWith('мат'))) fix.push('убери нецензурные слова из названия и описания');
  return { score, verdict, critical, warnings, tips, fix, reasons: [...critical, ...warnings, ...tips] };
}
function aiHtml(m) {
  const cls = m.verdict === 'auto' ? 'ok' : m.verdict === 'review' ? 'warn' : 'bad';
  const label = m.verdict === 'auto' ? 'AI-модер: выглядит чисто' : m.verdict === 'review' ? 'AI-модер: на проверку человеку' : 'AI-модер: блок — явный скам';
  const bar = `<div class="ai-bar"><i style="width:${m.score}%"></i></div>`;
  const crit = (m.critical || []).length ? `<div>⛔ ${esc(m.critical.join('; '))}</div>` : '';
  const warn = (m.warnings || []).length ? `<div>⚠️ ${esc(m.warnings.join('; '))}</div>` : '';
  const tip = (m.tips || []).length ? `<div class="ai-tips">💡 ${esc(m.tips.join('; '))}</div>` : '';
  const fix = (m.fix || []).length ? `<div class="ai-tips">🛠 Как пройти: ${esc(m.fix.join('; '))}</div>` : '';
  const note = m.verdict === 'review' ? '<div class="ai-tips">Ложных блокировок нет: спорное уходит человеку, а не в бан.</div>' : '';
  return `<div class="ai-verdict ${cls}">🤖 ${label} · ${m.score}/100${bar}${crit}${warn}${tip}${fix}${note}</div>`;
}
try {
  const custom = JSON.parse(localStorage.getItem('capiton_lots') || '[]');
  if (Array.isArray(custom)) LOTS.push(...custom.filter(c => c && c.id && c.title));
} catch (_) {}
let selectedLot = LOTS[0];
let lotFilter = '';
let lotSort = 'pop';
const GRADS = ['linear-gradient(135deg,#1a73e8,#7c5cff)','linear-gradient(135deg,#0ea5e9,#22d3ee)','linear-gradient(135deg,#10b981,#84cc16)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#6366f1,#a855f7)','linear-gradient(135deg,#0f172a,#475569)'];
function saveCustom(lot) {
  try {
    const cur = JSON.parse(localStorage.getItem('capiton_lots') || '[]');
    cur.push(lot);
    localStorage.setItem('capiton_lots', JSON.stringify(cur));
  } catch (_) {}
}
function defaultTrust(id) {
  return {
    escrow: true,
    milestones: [
      { title: 'Этап 1 · материалы', pct: 20, released: true, yes: 12, no: 1 },
      { title: 'Этап 2 · фундамент и каркас', pct: 30, released: false, yes: 4, no: 1 },
      { title: 'Этап 3 · оборудование и запуск', pct: 50, released: false, yes: 1, no: 0 },
    ],
    multisig: { entrepreneur: true, platform: false, auditor: false },
    invoices: [
      { id: id + '-inv1', title: 'Счёт от поставщика №1', amount: '0.4 TON', paid: false },
      { title: 'Счёт от поставщика №2', id: id + '-inv2', amount: '0.6 TON', paid: false },
    ],
  };
}
function getTrust(lot) {
  try {
    const all = JSON.parse(localStorage.getItem('capiton_trust') || '{}');
    if (all[lot.id]) {
      lot._trust = all[lot.id];
      return lot._trust;
    }
  } catch (_) {}
  lot._trust = defaultTrust(lot.id);
  return lot._trust;
}
function saveTrust(lot) {
  try {
    const all = JSON.parse(localStorage.getItem('capiton_trust') || '{}');
    all[lot.id] = lot._trust || getTrust(lot);
    localStorage.setItem('capiton_trust', JSON.stringify(all));
  } catch (_) {}
}
function multisigCount(t) {
  const m = t.multisig;
  return (m.entrepreneur ? 1 : 0) + (m.platform ? 1 : 0) + (m.auditor ? 1 : 0);
}
function voteTranche(lotId, mi, yes) {
  const lot = LOTS.find(l => l.id === lotId);
  if (!lot) return;
  const t = getTrust(lot);
  const m = t.milestones[mi];
  if (!m || m.released) return;
  if (yes) m.yes++; else m.no++;
  const total = m.yes + m.no;
  if (total >= 3 && m.yes / total > 0.51 && multisigCount(t) >= 2) {
    m.released = true;
    log('транш разблокирован: ' + m.title);
    toast('Транш разблокирован: ' + m.title, 'success');
  } else if (total >= 3 && m.yes / total > 0.51) {
    toast('Голосов хватает (>51%), нужны 2 подписи мультисига');
  }
  saveTrust(lot);
  renderTrust();
  renderAdmin();
}
function msApprove(lotId, role) {
  if (role !== 'entrepreneur' && !needAdmin()) return;
  const lot = LOTS.find(l => l.id === lotId);
  if (!lot) return;
  const t = getTrust(lot);
  t.multisig[role] = !t.multisig[role];
  if (role === 'entrepreneur' && !t.multisig[role]) t.multisig[role] = true;
  saveTrust(lot);
  renderTrust();
  renderAdmin();
  haptic('light');
}
function payInvoice(lotId, invId) {
  if (!needAdmin()) return;
  const lot = LOTS.find(l => l.id === lotId);
  if (!lot) return;
  const t = getTrust(lot);
  const inv = t.invoices.find(i => i.id === invId);
  if (!inv || inv.paid) return;
  const releasedAny = t.milestones.some(m => m.released);
  if (!releasedAny) { toast('Нет разблокированных траншей — оплата невозможна', 'error'); return; }
  if (multisigCount(t) < 2) { toast('Нужны 2 подписи мультисига', 'error'); return; }
  inv.paid = true;
  saveTrust(lot);
  renderTrust();
  renderAdmin();
  toast('Оплачено подрядчику напрямую: ' + inv.title, 'success');
}
function trustSummary(lot) {
  const t = getTrust(lot);
  const rel = t.milestones.filter(m => m.released).reduce((s, m) => s + m.pct, 0);
  return { releasedPct: rel, lockedPct: 100 - rel, keys: multisigCount(t) };
}
function tonToNum(p) { return parseFloat(p); }
function getVisibleLots() {
  let arr = LOTS.filter(l => !l.pending && (l.title + ' ' + l.desc + ' ' + (l.loc || '')).toLowerCase().includes(lotFilter));
  if (lotSort === 'cheap') arr = [...arr].sort((a, b) => tonToNum(a.price) - tonToNum(b.price));
  if (lotSort === 'exp') arr = [...arr].sort((a, b) => tonToNum(b.price) - tonToNum(a.price));
  return arr;
}
function persistCustom() {
  try {
    localStorage.setItem('capiton_lots', JSON.stringify(LOTS.filter(l => l.mine)));
  } catch (_) {}
}
function renderLots() {
  const grid = $('#lotsGrid');
  if (!grid) return;
  const vis = getVisibleLots();
  grid.innerHTML = vis.map(l => `
    <div class="lot ${selectedLot && selectedLot.id === l.id ? 'selected' : ''}" data-id="${l.id}">
      <div class="lot-cover" style="background:${l.grad}"><span>${esc(l.tag || 'лот')} · ${esc(l.price)}</span></div>
      <div class="lot-body">
        <div class="lot-top">${logoHtml(l, 'lot-logo')}<h3>${esc(l.title)}${vBadge(l)}</h3></div>
        <p>${esc(l.desc)}</p>
        <div class="lot-foot">
          <span class="lot-price">${esc(l.price)}</span>
          <button class="lot-buy" data-buy="${l.id}">Купить</button>
        </div>
        ${l.mine && !l.verified ? `<button class="lot-del" data-del="${l.id}">удалить</button>` : ''}
      </div>
    </div>`).join('') || '<p>Лотов пока нет.</p>';
}
function renderCheckoutMeta(lot) {
  const meta = $('#lotMeta');
  if (meta) meta.innerHTML = [lot.stage ? stageName(lot.stage) : '', lot.format || '', lot.loc || '', lot.goal ? 'нужно ' + lot.goal : ''].filter(Boolean).map(esc).map(s => `<span>${s}</span>`).join('');
  const box = $('#aiVerdict');
  if (box) {
    if (lot.verified) { box.hidden = true; }
    else {
      const m = aiModerate(lot);
      box.hidden = false;
      box.outerHTML = aiHtml(m).replace('class="ai-verdict', 'id="aiVerdict" class="ai-verdict');
    }
  }
}
function selectLot(id) {
  selectedLot = LOTS.find(l => l.id === id && !l.pending) || LOTS.find(l => !l.pending) || LOTS[0];
  if (!selectedLot) return;
  const t = $('#lotTitle'), d = $('#lotDesc'), pr = $('#lotPrice');
  if (t) t.innerHTML = esc(selectedLot.title) + vBadge(selectedLot);
  if (d) d.textContent = selectedLot.desc;
  if (pr) pr.textContent = selectedLot.price;
  renderCheckoutMeta(selectedLot);
  const btn = $('#investBtn');
  if (btn) btn.textContent = `Купить за ${selectedLot.price}`;
  renderLots();
  renderTrust();
  syncMainButton();
  haptic('light');
}
function renderTrust() {
  const box = $('#trustBox');
  if (!box || !selectedLot) return;
  const t = getTrust(selectedLot);
  const s = trustSummary(selectedLot);
  const ms = t.multisig;
  const key = (label, on) => `<span class="mskey ${on ? 'on' : ''}">${on ? '●' : '○'} ${label}</span>`;
  box.innerHTML = `
    <div class="trust-head">Эскроу · разблокировано ${s.releasedPct}% · в сейфе ${s.lockedPct}%</div>
    <div class="ai-bar"><i style="width:${s.releasedPct}%"></i></div>
    ${t.milestones.map((m, i) => {
      const total = m.yes + m.no;
      const pctYes = total ? Math.round(m.yes / total * 100) : 0;
      return `<div class="ms-item">
        <b>${esc(m.title)} · ${m.pct}% ${m.released ? '· выдано' : '· в сейфе'}</b>
        <div class="vote-bar"><i style="width:${pctYes}%"></i></div>
        <div class="ms-sub">За ${m.yes} / против ${m.no} · нужно &gt;51% держателей</div>
        ${m.released ? '' : `<div class="admin-row">
          <button class="abtn ok" data-vote-yes="${selectedLot.id}:${i}">За транш</button>
          <button class="abtn no" data-vote-no="${selectedLot.id}:${i}">Против</button>
        </div>`}
      </div>`;
    }).join('')}
    <div class="trust-head">Мультисиг 2/3 · подписей: ${s.keys}</div>
    <div class="mskeys">${key('Предприниматель', ms.entrepreneur)}${key('Платформа', ms.platform)}${key('Аудитор', ms.auditor)}</div>
    <div class="admin-row">
      <button class="abtn dim" data-ms="platform:${selectedLot.id}">Платформа: подписать</button>
      <button class="abtn dim" data-ms="auditor:${selectedLot.id}">Аудитор: подписать</button>
    </div>
    <div class="trust-head">Оплата подрядчикам напрямую</div>
    ${t.invoices.map(inv => `<div class="ms-item"><b>${esc(inv.title)} · ${esc(inv.amount)}</b>
      <div class="ms-sub">${inv.paid ? 'оплачено со счёта платформы' : 'ждёт разблокированного транша + 2 подписей'}</div>
      ${inv.paid ? '' : `<button class="abtn ok" data-pay="${selectedLot.id}:${inv.id}">Оплатить счёт</button>`}
    </div>`).join('')}`;
}
async function onInvest(forcedId) {
  const btn = $('#investBtn');
  haptic('medium');
  if (forcedId) selectLot(forcedId);
  const lot = selectedLot;
  if (!tonConnectUI) { toast('TON Connect не загрузился', 'error'); return; }
  if (!tonConnectUI.connected) {
    toast('Сначала подключи криптокошелёк сверху!', 'warning');
    setStatus('Подключи кошелёк для продолжения', 'err');
    return;
  }
  if (!isValidTonAddress(CONFIG.recipient)) {
    toast('Адрес получателя не настроен (app.js → CONFIG.recipient)', 'error');
    setStatus('CONFIG.recipient = "' + CONFIG.recipient + '" — невалидный TON-адрес', 'err');
    log('blocked: invalid recipient');
    return;
  }
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 120,
    messages: [{ address: CONFIG.recipient, amount: lot.nano || CONFIG.amountNano }],
  };
  try {
    if (btn) btn.disabled = true;
    try { tg?.MainButton?.showProgress?.(); } catch (_) {}
    setStatus('Ожидание подписи в кошельке…', '');
    log('sendTransaction ' + lot.id + ' ' + lot.price + ' → ' + CONFIG.recipient);
    await tonConnectUI.sendTransaction(transaction);
    setStatus('Готово! Лот "' + lot.title + '" твой.', 'ok');
    toast('Готово! Лот "' + lot.title + '" твой.', 'success');
    log('tx success');
  } catch (e) {
    setStatus('Транзакция отменена.', 'err');
    log('tx cancelled');
  } finally {
    if (btn) btn.disabled = false;
    try { tg?.MainButton?.hideProgress?.(); } catch (_) {}
    syncMainButton();
  }
}
$('#investBtn')?.addEventListener('click', () => onInvest());
function renderAdmin() {
  const box = $('#adminList');
  if (!box) return;
  if (!LOTS.length) { box.innerHTML = '<p>Лотов нет.</p>'; return; }
  box.innerHTML = LOTS.map(l => {
    const m = aiModerate(l);
    const ts = trustSummary(l);
    return `<div class="admin-item">
      <h4>${logoHtml(l, 'lot-logo')} ${esc(l.title)}${vBadge(l)} ${l.pending ? '<span class="admin-ai">на модерации</span>' : ''}</h4>
      <p>${esc(l.desc)} · ${esc(l.price)} · ${esc(l.loc || '—')} · ${esc(stageName(l.stage))} · ${esc(l.format || '—')}</p>
      <p>Эскроу: выдано ${ts.releasedPct}% · подписей ${ts.keys}/3</p>
      ${aiHtml(m)}
      <div class="admin-row">
        ${!l.verified ? `<button class="abtn ok" data-verify="${l.id}">✓ Верифицировать</button>` : `<button class="abtn dim" data-unverify="${l.id}">Снять галочку</button>`}
        ${l.pending ? `<button class="abtn ok" data-approve="${l.id}">Опубликовать</button>` : ''}
        <button class="abtn no" data-adel="${l.id}">Удалить</button>
      </div>
    </div>`;
  }).join('');
}
document.addEventListener('click', (e) => {
  const verify = e.target.closest?.('[data-verify]');
  if (verify) {
    if (!needAdmin()) return;
    const l = LOTS.find(x => x.id === verify.dataset.verify);
    if (l) { l.verified = true; l.pending = false; persistCustom(); renderLots(); renderAdmin(); selectLot(l.id); toast('Лот верифицирован'); }
    return;
  }
  const unverify = e.target.closest?.('[data-unverify]');
  if (unverify) {
    if (!needAdmin()) return;
    const l = LOTS.find(x => x.id === unverify.dataset.unverify);
    if (l) { l.verified = false; persistCustom(); renderLots(); renderAdmin(); selectLot(l.id); }
    return;
  }
  const approve = e.target.closest?.('[data-approve]');
  if (approve) {
    if (!needAdmin()) return;
    const l = LOTS.find(x => x.id === approve.dataset.approve);
    if (l) {
      const m = aiModerate(l);
      l.pending = false;
      if (m.verdict === 'auto') l.verified = true;
      persistCustom(); renderLots(); renderAdmin(); selectLot(l.id);
      toast(m.verdict === 'reject' ? 'Опубликовано, но AI против — проверь' : 'Лот опубликован');
    }
    return;
  }
  const adel = e.target.closest?.('[data-adel]');
  if (adel) {
    if (!needAdmin()) return;
    const id = adel.dataset.adel;
    const i = LOTS.findIndex(l => l.id === id);
    if (i > -1) LOTS.splice(i, 1);
    persistCustom();
    renderAdmin();
    const vis = LOTS.find(l => !l.pending);
    if (vis) selectLot(vis.id); else renderLots();
    return;
  }
  const del = e.target.closest?.('[data-del]');
  if (del) {
    e.stopPropagation();
    const id = del.dataset.del;
    const i = LOTS.findIndex(l => l.id === id);
    if (i > -1) LOTS.splice(i, 1);
    persistCustom();
    renderAdmin();
    const vis = LOTS.find(l => !l.pending);
    if (vis) selectLot(vis.id); else renderLots();
    return;
  }
  const vy = e.target.closest?.('[data-vote-yes]');
  if (vy) { const [id, mi] = vy.dataset.voteYes.split(':'); voteTranche(id, +mi, true); return; }
  const vn = e.target.closest?.('[data-vote-no]');
  if (vn) { const [id, mi] = vn.dataset.voteNo.split(':'); voteTranche(id, +mi, false); return; }
  const ms = e.target.closest?.('[data-ms]');
  if (ms) { const [role, id] = ms.dataset.ms.split(':'); msApprove(id, role); return; }
  const pay = e.target.closest?.('[data-pay]');
  if (pay) { const [id, inv] = pay.dataset.pay.split(':'); payInvoice(id, inv); return; }
  const buy = e.target.closest?.('[data-buy]');
  if (buy) { e.stopPropagation(); onInvest(buy.dataset.buy); return; }
  const card = e.target.closest?.('.lot');
  if (card) selectLot(card.dataset.id);
  if (e.target.closest?.('#openSell')) { $('#sellModal').hidden = false; return; }
  if (e.target.closest?.('#openAdmin')) {
    if (!needAdmin()) return;
    renderAdmin(); $('#adminModal').hidden = false; return;
  }
});
$('#search')?.addEventListener('input', (e) => { lotFilter = e.target.value.toLowerCase(); renderLots(); });
document.querySelectorAll('.chip[data-sort]').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.chip[data-sort]').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  lotSort = c.dataset.sort;
  renderLots();
}));
$('#sellCancel')?.addEventListener('click', () => { $('#sellModal').hidden = true; });
$('#sellModal')?.addEventListener('click', (e) => { if (e.target.id === 'sellModal') e.target.hidden = true; });
$('#adminClose')?.addEventListener('click', () => { $('#adminModal').hidden = true; });
$('#adminModal')?.addEventListener('click', (e) => { if (e.target.id === 'adminModal') e.target.hidden = true; });
function readSellForm() {
  return {
    title: $('#sellTitle').value.trim(),
    logo: $('#sellLogo').value.trim(),
    loc: $('#sellLoc').value.trim(),
    desc: $('#sellDesc').value.trim(),
    stage: $('#sellStage').value,
    format: $('#sellFormat').value,
    goalNum: parseFloat($('#sellGoal').value),
    priceNum: parseFloat($('#sellPrice').value),
  };
}
['sellTitle', 'sellDesc', 'sellPrice', 'sellGoal'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    const f = readSellForm();
    const box = $('#aiPreview');
    if (!box) return;
    if (!f.title && !f.desc) { box.hidden = true; return; }
    const draft = { title: f.title || 'Без названия', desc: f.desc || '', price: (f.priceNum > 0 ? f.priceNum : 0) + ' TON', goal: (f.goalNum > 0 ? f.goalNum : 0) + ' TON', loc: f.loc };
    box.hidden = false;
    box.outerHTML = aiHtml(aiModerate(draft)).replace('class="ai-verdict', 'id="aiPreview" class="ai-verdict');
  });
});
$('#sellSubmit')?.addEventListener('click', () => {
  const f = readSellForm();
  if (!f.title || !(f.priceNum > 0)) { toast('Заполни название и цену акции'); return; }
  if (!f.desc || f.desc.length < 20) { toast('Опиши идею подробнее (от 20 символов)'); return; }
  const nano = String(Math.round(f.priceNum * 1e9));
  const lot = { id: 'my' + Date.now(), title: f.title, desc: f.desc, price: f.priceNum + ' TON', nano, tag: f.stage === 'live' ? 'работает' : 'идея', grad: GRADS[LOTS.length % GRADS.length], mine: true, logo: f.logo || f.title.slice(0, 1), stage: f.stage, format: f.format, loc: f.loc || 'Онлайн', goal: (f.goalNum > 0 ? f.goalNum : f.priceNum) + ' TON', verified: false, pending: true };
  const m = aiModerate(lot);
  if (m.verdict === 'reject') {
    const box = $('#aiPreview');
    if (box) { box.hidden = false; box.outerHTML = aiHtml(m).replace('class="ai-verdict', 'id="aiPreview" class="ai-verdict'); }
    toast('AI-модер отклонил: ' + (m.reasons[0] || 'высокий риск'), 'error');
    return;
  }
  LOTS.unshift(lot);
  saveCustom(lot);
  $('#sellModal').hidden = true;
  ['sellTitle', 'sellLogo', 'sellLoc', 'sellDesc', 'sellGoal', 'sellPrice'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderAdmin();
  toast(m.verdict === 'auto' ? 'AI пропустил, ждёт галочки админа' : 'Отправлено на модерацию');
});
$('#copyAddr')?.addEventListener('click', async () => {
  haptic('light');
  try { await navigator.clipboard.writeText(CONFIG.recipient); toast('Адрес скопирован'); }
  catch (_) { toast(CONFIG.recipient); }
});

renderLots();
selectLot('lot1');

(function particles() {
  const c = $('#stars');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts = [];
  function resize() {
    const h = tg?.viewportHeight || window.innerHeight;
    W = c.width = window.innerWidth; H = c.height = h;
    const n = Math.min(90, Math.floor(W * H / 22000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.8 + .4, o: Math.random() * .7 + .2,
    }));
  }
  resize();
  window.addEventListener('resize', resize);
  try { tg?.onEvent?.('viewportChanged', resize); } catch (_) {}
  (function frame() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      const dark = document.documentElement.dataset.theme === 'dark';
      ctx.fillStyle = dark ? `rgba(200,210,235,${p.o * 0.5})` : `rgba(18,19,23,${p.o * 0.35})`;
      ctx.fill();
    }
    for (let i = 0; i < pts.length; i += 3) {
      for (let j = i + 1; j < i + 4 && j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          const dark2 = document.documentElement.dataset.theme === 'dark';
          ctx.strokeStyle = dark2 ? `rgba(200,210,235,${(1 - d / 130) * .15})` : `rgba(18,19,23,${(1 - d / 130) * .12})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  })();
})();

const io = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.feat').forEach((el) => io.observe(el));

document.querySelectorAll('.faq-item').forEach((item) => {
  item.querySelector('.faq-q')?.addEventListener('click', () => {
    haptic('light');
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
    if (!open) item.classList.add('open');
  });
});

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => haptic('light'));
});

applyTheme(getInitialTheme());
document.querySelector('#themeToggle')?.addEventListener('click', () => {
  haptic('light');
  const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(cur);
  applyTGTheme();
});
initTelegram();
refreshAdminVisibility();
syncMainButton();
$('#year').textContent = new Date().getFullYear();
log('app.js loaded (mini-app ready)');
