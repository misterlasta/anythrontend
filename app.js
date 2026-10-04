const CONFIG = {
  manifestUrl: 'https://misterlasta.github.io/anythrontend/tonconnect-manifest.json',

  recipient: 'Capiton',
  amountNano: '1000000000',
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
  { id: 'lot1', title: 'Лот 01 · пример', desc: 'Пример инвестиционного лота.', price: '1 TON', nano: '1000000000', tag: 'пример', grad: 'linear-gradient(135deg,#1a73e8,#7c5cff)' },
  { id: 'lot2', title: 'Лот 02 · пример', desc: 'Пример инвестиционного лота.', price: '2 TON', nano: '2000000000', tag: 'пример', grad: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
  { id: 'uzv', title: 'Ферма · пример лота', desc: 'Один из примеров, не основной проект.', price: '1 TON', nano: '1000000000', tag: 'пример', grad: 'linear-gradient(135deg,#10b981,#84cc16)' },
  { id: 'lot4', title: 'Лот 04 · пример', desc: 'Пример инвестиционного лота.', price: '0.3 TON', nano: '300000000', tag: 'пример', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { id: 'lot5', title: 'Лот 05 · пример', desc: 'Пример инвестиционного лота.', price: '1.5 TON', nano: '1500000000', tag: 'пример', grad: 'linear-gradient(135deg,#6366f1,#a855f7)' },
  { id: 'lot6', title: 'Лот 06 · пример', desc: 'Пример инвестиционного лота.', price: '0.7 TON', nano: '700000000', tag: 'пример', grad: 'linear-gradient(135deg,#0f172a,#475569)' },
];
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
function tonToNum(p) { return parseFloat(p); }
function getVisibleLots() {
  let arr = LOTS.filter(l => (l.title + l.desc).toLowerCase().includes(lotFilter));
  if (lotSort === 'cheap') arr = [...arr].sort((a, b) => tonToNum(a.price) - tonToNum(b.price));
  if (lotSort === 'exp') arr = [...arr].sort((a, b) => tonToNum(b.price) - tonToNum(a.price));
  return arr;
}
function renderLots() {
  const grid = $('#lotsGrid');
  if (!grid) return;
  grid.innerHTML = getVisibleLots().map(l => `
    <div class="lot ${selectedLot && selectedLot.id === l.id ? 'selected' : ''}" data-id="${l.id}">
      <div class="lot-cover" style="background:${l.grad}"><span>${l.tag} · ${l.price}</span></div>
      <div class="lot-body">
        <h3>${l.title}</h3>
        <p>${l.desc}</p>
        <div class="lot-foot">
          <span class="lot-price">${l.price}</span>
          <button class="lot-buy" data-buy="${l.id}">Купить</button>
        </div>
        ${l.mine ? `<button class="lot-del" data-del="${l.id}">удалить</button>` : ''}
      </div>
    </div>`).join('');
}
function selectLot(id) {
  selectedLot = LOTS.find(l => l.id === id) || LOTS[0];
  const t = $('#lotTitle'), d = $('#lotDesc'), pr = $('#lotPrice');
  if (t) t.textContent = selectedLot.title;
  if (d) d.textContent = selectedLot.desc;
  if (pr) pr.textContent = selectedLot.price;
  const btn = $('#investBtn');
  if (btn) btn.textContent = `Купить за ${selectedLot.price}`;
  renderLots();
  syncMainButton();
  haptic('light');
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
document.addEventListener('click', (e) => {
  const del = e.target.closest?.('[data-del]');
  if (del) {
    e.stopPropagation();
    const id = del.dataset.del;
    const i = LOTS.findIndex(l => l.id === id);
    if (i > -1) LOTS.splice(i, 1);
    try {
      const cur = JSON.parse(localStorage.getItem('capiton_lots') || '[]').filter(l => l.id !== id);
      localStorage.setItem('capiton_lots', JSON.stringify(cur));
    } catch (_) {}
    selectedLot = LOTS[0];
    renderLots();
    if (selectedLot) selectLot(selectedLot.id);
    return;
  }
  const buy = e.target.closest?.('[data-buy]');
  if (buy) { e.stopPropagation(); onInvest(buy.dataset.buy); return; }
  const card = e.target.closest?.('.lot');
  if (card) selectLot(card.dataset.id);
  if (e.target.closest?.('#openSell')) {
    $('#sellModal').hidden = false;
    return;
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
$('#sellSubmit')?.addEventListener('click', () => {
  const title = $('#sellTitle').value.trim();
  const desc = $('#sellDesc').value.trim() || 'Без описания';
  const priceNum = parseFloat($('#sellPrice').value);
  const tag = $('#sellTag').value.trim() || 'мой лот';
  if (!title || !(priceNum > 0)) { toast('Заполни название и цену'); return; }
  const nano = String(Math.round(priceNum * 1e9));
  const lot = { id: 'my' + Date.now(), title, desc, price: priceNum + ' TON', nano, tag, grad: GRADS[LOTS.length % GRADS.length], mine: true };
  LOTS.unshift(lot);
  saveCustom(lot);
  $('#sellModal').hidden = true;
  $('#sellTitle').value = ''; $('#sellDesc').value = ''; $('#sellPrice').value = ''; $('#sellTag').value = '';
  selectLot(lot.id);
  toast('Лот опубликован');
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
syncMainButton();
$('#year').textContent = new Date().getFullYear();
log('app.js loaded (mini-app ready)');
