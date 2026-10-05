const CONFIG = {
  // Overridable at deploy time without editing the repo:
  //   <script>window.TON_MANIFEST_URL="https://<your-domain>/tonconnect-manifest.json"</script>
  //   <script>window.TON_RECIPIENT="UQ..."</script>
  manifestUrl: window.TON_MANIFEST_URL || './tonconnect-manifest.json',
  // TON address receiving payments. Empty = must be configured on deploy (see onInvest validation).
  recipient: window.TON_RECIPIENT || '',
  amountNano: '1000000000',
  // NOTE: no Telegram IDs here on purpose (public repo).
  // Admin rights are enforced server-side (deps.require_admin);
  // the client only asks the backend whether the admin panel may be shown.
};
let __isAdmin = false;

/* ===== i18n (RU default, EN via dictionary; key = Russian source) ===== */
const EN = {
  'открыто в браузере (вне TG)': 'opened in browser (outside TG)',
  'TG init error: ': 'TG init error: ',
  'Купить за {p}': 'Buy for {p}',
  'Купить лот': 'Buy lot',
  'TON Connect инициализирован': 'TON Connect initialized',
  'Кошелёк подключён: ': 'Wallet connected: ',
  'wallet connected': 'wallet connected',
  'Кошелёк отключён': 'Wallet disconnected',
  'TON_CONNECT_UI не загрузился (проверь интернет)': 'TON_CONNECT_UI failed to load (check internet)',
  'TON init error: ': 'TON init error: ',
  'лот': 'lot',
  'Онлайн': 'Online',
  'Верифицирован': 'Verified',
  'существует': 'live',
  'идея': 'idea',
  'Офлайн': 'Offline',
  'Онлайн + офлайн': 'Online + offline',
  'мат: {x}': 'profanity: {x}',
  'обход фильтра латиницей': 'latin-script filter bypass',
  'оскорбление группы: {x}': 'group slur: {x}',
  'дегуманизация / призыв': 'dehumanization / call to action',
  'доход {p}% за короткий срок': '{p}% returns in a short time',
  'доход {p}% — нужны доказательства': '{p}% returns — proof required',
  'гарантия прибыли без риска': 'guaranteed profit without risk',
  'рискованная тема: {x} — проверь вручную': 'risky topic: {x} — check manually',
  'давление на покупателя: {x}': 'buyer pressure: {x}',
  'название короче 3 букв': 'title shorter than 3 letters',
  'название короткое — добавь specificity': 'short title — add specifics',
  'описание короче 20 символов': 'description shorter than 20 chars',
  'опиши подробнее: куда пойдут средства, сроки': 'describe in detail: where funds go, timeline',
  'много капса — читается как спам': 'too much caps — reads like spam',
  'много ссылок: {n}': 'too many links: {n}',
  'много эмодзи': 'too many emoji',
  'есть ссылка, но мало описания': 'has a link but little description',
  'текст почти без гласных — похож на случайный набор': 'almost no vowels — looks random',
  'однообразный набор букв — похоже на мусор': 'repetitive letters — looks like junk',
  'повторяющиеся слоги — похоже на мусор': 'repeated syllables — looks like junk',
  'непроизносимый набор согласных': 'unpronounceable consonant cluster',
  'слишком длинные «слова» без пробелов': 'overlong “words” without spaces',
  'мусор в тексте: {x}': 'junk text: {x}',
  'нет цены акции': 'no share price',
  'цена в экспоненциальной записи — проверь нолики': 'price in exponential notation — check zeros',
  'цель в экспоненциальной записи — проверь нолики': 'goal in exponential notation — check zeros',
  'цель меньше цены 1 акции — проверь цифры': 'goal below single-share price — check numbers',
  'цель > 5 млн TON — выглядит как опечатка': 'goal > 5M TON — looks like a typo',
  'цель нереальна (>1 млрд TON)': 'unrealistic goal (>1B TON)',
  'цена акции очень высокая — проверь нолики': 'very high share price — check zeros',
  'цена акции нереальна (>1 млн TON)': 'unrealistic share price (>1M TON)',
  'нет локации': 'no location',
  'такое название уже есть — возможно дубль': 'this title already exists — possible duplicate',
  'добавь 2-3 предложения: что за проект, куда пойдут деньги, сроки': 'add 2-3 sentences: what the project is, where money goes, timeline',
  'укажи цену 1 акции в TON': 'set the price of 1 share in TON',
  'укажи город или «онлайн»': 'set a city or “online”',
  'убери % доходности или приложи отчётность': 'remove % returns or attach statements',
  'убери нецензурные слова из названия и описания': 'remove profanity from title and description',
  'убери оскорбления групп — такое не публикуем': 'remove group slurs — we don’t publish those',
  'AI-модер: выглядит чисто': 'AI mod: looks clean',
  'AI-модер: на проверку человеку': 'AI mod: needs human review',
  'AI-модер: блок — явный скам': 'AI mod: blocked — obvious scam',
  '🛠 Как пройти: {x}': '🛠 How to pass: {x}',
  'Ложных блокировок нет: спорное уходит человеку, а не в бан.': 'No false bans: disputed cases go to a human, not a ban.',
  'Этап 1 · материалы': 'Stage 1 · materials',
  'Этап 2 · фундамент и каркас': 'Stage 2 · foundation & frame',
  'Этап 3 · оборудование и запуск': 'Stage 3 · equipment & launch',
  'Счёт от поставщика №1': 'Supplier invoice #1',
  'Счёт от поставщика №2': 'Supplier invoice #2',
  'Этап {n}': 'Stage {n}',
  'Счёт': 'Invoice',
  'Голос учтён': 'Vote counted',
  'Ты уже голосовал по этому этапу': 'You already voted on this stage',
  'Ты уже голосовал «За» по этому этапу': 'You already voted “For” on this stage',
  'Ты уже голосовал «Против» по этому этапу': 'You already voted “Against” on this stage',
  'vote API fallback: ': 'vote API fallback: ',
  'транш разблокирован: ': 'tranche unlocked: ',
  'Транш разблокирован: {x}': 'Tranche unlocked: {x}',
  'Голосов хватает (>51%), нужны 2 подписи мультисига': 'Enough votes (>51%), need 2 multisig signatures',
  'multisig API: ': 'multisig API: ',
  'pay API: ': 'pay API: ',
  'Нет разблокированных траншей — оплата невозможна': 'No unlocked tranches — payment impossible',
  'Нужны 2 подписи мультисига': 'Need 2 multisig signatures',
  'Оплачено подрядчику напрямую: {x}': 'Paid to contractor directly: {x}',
  'Эскроу выдано {rel}% · подписей {k}/3': 'Escrow released {rel}% · signatures {k}/3',
  'нужно {g}': 'goal {g}',
  'Лотов пока нет — измени фильтры.': 'No lots yet — adjust filters.',
  'Пока пусто': 'Empty for now',
  '🐋 Кит': '🐋 Whale',
  '💼 Трейдер': '💼 Trader',
  '📈 Инвестор': '📈 Investor',
  '🌱 Новичок': '🌱 Newcomer',
  'Инвестор': 'Investor',
  'Гость': 'Guest',
  'Открой через Telegram-бота': 'Open via the Telegram bot',
  'Долей пока нет — выбери лот в маркете.': 'No shares yet — pick a lot in the market.',
  'Выплат пока не было.': 'No payouts yet.',
  'Войди через Telegram-бота, чтобы увидеть портфель.': 'Log in via the Telegram bot to see your portfolio.',
  'Эскроу · разблокировано {rel}% · в сейфе {lock}%': 'Escrow · released {rel}% · locked {lock}%',
  '· выдано': '· released',
  '· в сейфе': '· locked',
  'За {y} / против {n} · нужно >51% держателей': 'For {y} / against {n} · needs >51% of holders',
  'Твой голос: {v} · один голос с человека': 'Your vote: {v} · one vote per person',
  'За ✓': 'For ✓',
  'Против': 'Against',
  'За транш': 'For tranche',
  'Мультисиг 2/3 · подписей: {n}': 'Multisig 2/3 · signatures: {n}',
  'Предприниматель': 'Entrepreneur',
  'Платформа': 'Platform',
  'Аудитор': 'Auditor',
  'Платформа: подписать': 'Platform: sign',
  'Аудитор: подписать': 'Auditor: sign',
  'Оплата подрядчикам напрямую': 'Direct contractor payments',
  'оплачено со счёта платформы': 'paid from the platform account',
  'заморожено вето инвесторов': 'frozen by investor veto',
  'ждёт разблокированного транша + 2 подписей': 'awaits an unlocked tranche + 2 signatures',
  'Оплатить счёт': 'Pay invoice',
  'Наложить вето': 'Veto',
  'TON Connect не загрузился': 'TON Connect failed to load',
  'Сначала подключи криптокошелёк сверху!': 'Connect your crypto wallet first!',
  'Подключи кошелёк для продолжения': 'Connect a wallet to continue',
  'Адрес получателя не настроен (app.js → CONFIG.recipient)': 'Recipient address not set (app.js → CONFIG.recipient)',
  'CONFIG.recipient = "{r}" — невалидный TON-адрес': 'CONFIG.recipient = "{r}" — invalid TON address',
  'blocked: invalid recipient': 'blocked: invalid recipient',
  'Ожидание подписи в кошельке…': 'Waiting for wallet signature…',
  'sendTransaction {id} {p} → {r}': 'sendTransaction {id} {p} → {r}',
  'invest API: ': 'invest API: ',
  'Готово! Лот "{x}" твой.': 'Done! Lot "{x}" is yours.',
  'tx success': 'tx success',
  'Транзакция отменена.': 'Transaction cancelled.',
  'tx cancelled': 'tx cancelled',
  'Лотов нет.': 'No lots.',
  'на модерации': 'in moderation',
  'Эскроу: выдано {r}% · подписей {k}/3': 'Escrow: released {r}% · signatures {k}/3',
  '✓ Верифицировать': '✓ Verify',
  'Снять галочку': 'Unverify',
  'Опубликовать': 'Publish',
  'Удалить': 'Delete',
  'verify API: ': 'verify API: ',
  'Лот верифицирован': 'Lot verified',
  'approve API: ': 'approve API: ',
  'delete API: ': 'delete API: ',
  'Выплата заморожена вето': 'Payout frozen by veto',
  'Вето учтено': 'Veto counted',
  'Вето: ': 'Veto: ',
  'Без названия': 'Untitled',
  'Заполни название и цену акции': 'Fill in the title and share price',
  'Цена акции нереальна (максимум 1 000 000 TON)': 'Unrealistic share price (max 1,000,000 TON)',
  'Цель нереальна (максимум 1 000 000 000 TON)': 'Unrealistic goal (max 1,000,000,000 TON)',
  'Опиши идею подробнее (от 20 символов)': 'Describe the idea in detail (20+ chars)',
  'AI-модер отклонил: {x}': 'AI mod rejected: {x}',
  'высокий риск': 'high risk',
  'create API fallback: ': 'create API fallback: ',
  'AI пропустил, ждёт галочки админа': 'AI passed, awaiting admin approval',
  'Отправлено на модерацию': 'Sent for moderation',
  'Опубликовано, но AI против — проверь': 'Published, but AI disagrees — check',
  'Лот опубликован': 'Lot published',
  'Адрес скопирован': 'Address copied',
  'lots loaded from API: ': 'lots loaded from API: ',
  'API offline, local LOTS fallback: ': 'API offline, local LOTS fallback: ',
  'dev-preview в браузере: заглушка скрыта': 'browser dev-preview: gate hidden',
  'app.js loaded (mini-app ready)': 'app.js loaded (mini-app ready)',
  'Нет доступа: панель только для админов': 'No access: admin panel only',
  'Админка доступна только в Telegram для админов': 'Admin panel is only available in Telegram for admins',
  'Telegram Mini App · претендуем на TON Grant': 'Telegram Mini App · applying for a TON Grant',
  'Маркет': 'Market',
  'инвест-лотов': 'of invest lots',
  'Листай лоты как ленту, жми 💎 — доля твоя. Тап по карточке — детали, эскроу и голосование.': 'Scroll lots like a feed, tap 💎 — the share is yours. Tap a card for details, escrow and voting.',
  '+ Выставить лот': '+ List a lot',
  'Все форматы': 'All formats',
  'Любая стадия': 'Any stage',
  'Идея': 'Idea',
  'Существует': 'Live',
  'Популярное': 'Popular',
  'Дешевле': 'Cheaper',
  'Дороже': 'Pricier',
  '✓ Проверенные': '✓ Verified',
  '// защита RWA': '// RWA protection',
  'Украсть не получится': 'Theft won’t work',
  'Проблема оракула не решается кодом полностью, но архитектура делает кражу технически невыгодной.': 'The oracle problem can’t be fully solved in code, but the architecture makes theft technically unprofitable.',
  '1 · Транши и эскроу': '1 · Tranches & escrow',
  'Деньги в сейфе контракта. Этапы 20/30/50%. Пропал после первого этапа — остальное возвращается инвесторам.': 'Money sits in the contract vault. Stages 20/30/50%. Vanish after stage one — the rest returns to investors.',
  '2 · Голосование DAO': '2 · DAO voting',
  'Следующий транш открывают сами держатели долей: видеоотчёт → кнопка «За» → нужно >51%.': 'Holders unlock the next tranche themselves: video report → “For” button → >51% needed.',
  '3 · Мультисиг 2/3': '3 · Multisig 2/3',
  'Ключи: предприниматель, платформа, аудитор. Без второй подписи деньги не уходят. Подтверждение — в админке.': 'Keys: entrepreneur, platform, auditor. No second signature — no money moves. Confirm in the admin panel.',
  '4 · Оплата подрядчикам': '4 · Contractor payouts',
  'Предприниматель не касается денег: принёс счёт — платформа оплатила поставщику напрямую.': 'The entrepreneur never touches the money: invoice in — platform pays the supplier directly.',
  '// faq': '// faq',
  'Вопросы': 'Questions',
  'Как купить?': 'How to buy?',
  'Подключи кошелёк и нажми «Купить» на карточке.': 'Connect your wallet and hit “Buy” on a card.',
  'Куда идут TON?': 'Where does TON go?',
  'На адрес из CONFIG.recipient. Проверяй в tonviewer.com.': 'To the CONFIG.recipient address. Verify on tonviewer.com.',
  'При чём тут грант?': 'What’s the grant got to do with it?',
  'Демо для заявки на TON Grant: мини-приложение с реальными транзакциями.': 'A demo for a TON Grant application: a mini app with real transactions.',
  'А если предприниматель пропадёт?': 'What if the entrepreneur disappears?',
  'В сейфе останутся невыданные транши — они возвращаются инвесторам, предприниматель их не трогал.': 'Unreleased tranches stay in the vault — they return to investors; the entrepreneur never touched them.',
  'Кто подтверждает траты?': 'Who approves spending?',
  '2 подписи из 3: предприниматель + платформа или аудитор. Плюс голосование держателей >51%.': '2 of 3 signatures: entrepreneur + platform or auditor. Plus >51% holder vote.',
  'Capiton · демо для TON Grant': 'Capiton · TON Grant demo',
  'Telegram Mini App · TON Connect': 'Telegram Mini App · TON Connect',
  'Инвестировано': 'Invested',
  'Голосов': 'Votes',
  'Лотов создано': 'Lots created',
  'Дивиденды': 'Dividends',
  'Рейтинг инвестора': 'Investor rating',
  'Диверсификация': 'Diversification',
  '🛠 Админ-панель': '🛠 Admin panel',
  '// мой капитал': '// my capital',
  'Портфель': 'Portfolio',
  'Стоимость долей': 'Share value',
  'Выплачено дивидендов': 'Dividends paid',
  'Проектов': 'Projects',
  'Мои доли': 'My shares',
  'Загрузка...': 'Loading...',
  '✕ Закрыть': '✕ Close',
  'Выбери лот': 'Pick a lot',
  'Кликни по карточке — здесь появится описание, цена и кнопка покупки.': 'Tap a card — description, price and the buy button appear here.',
  'Цена': 'Price',
  'Копировать адрес': 'Copy address',
  'получатель: настраивается в app.js': 'recipient: set in app.js',
  'Подключи кошелёк сверху, выбери лот': 'Connect your wallet above, pick a lot',
  'ожидание TON Connect...': 'waiting for TON Connect...',
  'Панель предпринимателя — новый лот': 'Entrepreneur panel — new lot',
  'Название проекта': 'Project name',
  'Логотип: ссылка на картинку или 1-2 буквы': 'Logo: image link or 1-2 letters',
  'Локация, например: Москва / онлайн': 'Location, e.g. Moscow / online',
  'Идея / описание: что за проект, куда пойдут средства': 'Idea / description: what the project is, where funds go',
  'Стадия: идея': 'Stage: idea',
  'Стадия: уже существует': 'Stage: already live',
  'Отмена': 'Cancel',
  'Отправить на модерацию': 'Send for moderation',
  'Панель админа': 'Admin panel',
  '+ AI-модер': '+ AI mod',
  'Нейронка пред-проверяет каждый лот: скоринг, стоп-слова, адекватность цены. Ты только жмёшь галочку.': 'The neural net pre-checks every lot: scoring, stop-words, price sanity. You just tick the box.',
  'Закрыть': 'Close',
  'Профиль': 'Profile',
  'Только в Telegram': 'Telegram only',
  'Маркет Capiton работает внутри Telegram Mini App.': 'The Capiton market runs inside a Telegram Mini App.',
  'Открой эту ссылку с телефона в Telegram через бота проекта.': 'Open this link on your phone in Telegram via the project bot.',
  'Поиск лота...': 'Search lots...',
  'Нужно всего, TON': 'Total needed, TON',
  'Цена 1 акции, TON': 'Price of 1 share, TON',
};

function currentLang() {
  try {
    const saved = localStorage.getItem('capiton_lang');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch (_) {}
  try {
    const lc = tg?.initDataUnsafe?.user?.language_code || navigator.language || 'ru';
    if (String(lc).toLowerCase().startsWith('en')) return 'en';
  } catch (_) {}
  return 'ru';
}
let LANG = currentLang();
function t(key, params) {
  let s = (LANG === 'en' && EN[key] != null) ? EN[key] : key;
  if (params) for (const k in params) s = String(s).split('{' + k + '}').join(params[k]);
  return s;
}
function setLang(next) {
  LANG = next === 'en' ? 'en' : 'ru';
  try { localStorage.setItem('capiton_lang', LANG); } catch (_) {}
  applyLang();
}
function applyLang() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'ru';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const lb = $('#langBtn');
  if (lb) lb.textContent = LANG === 'en' ? 'RU' : 'EN';
  renderFeed();
  if (document.querySelector('#view-profile.active')) renderProfile();
  if (document.querySelector('#view-portfolio.active')) renderPortfolio();
  if (selectedLot && !$('#lotModal')?.hidden) selectLot(selectedLot.id);
}

const $ = (s) => document.querySelector(s);
const logBox = $('#log');
const statusEl = $('#status');
const toastEl = $('#toast');
const tg = window.Telegram?.WebApp || null;
const inTG = !!tg?.initData;

function log(msg) {
  if (!logBox) return;
  const time = new Date().toLocaleTimeString(LANG === 'en' ? 'en-US' : 'ru-RU');
  const div = document.createElement('div');
  const t = document.createElement('span');
  t.className = 't';
  t.textContent = '[' + time + '] ';
  div.appendChild(t);
  div.appendChild(document.createTextNode(String(msg)));
  logBox.appendChild(div);
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
  return __isAdmin === true;
}
async function refreshAdminVisibility() {
  const btn = document.querySelector('#openAdmin');
  // Ask the backend (it validates X-Telegram-Init-Data + is_admin).
  // On failure keep the button hidden — real access control is server-side anyway.
  try {
    if (window.Backend) { await window.Backend.adminLots(); __isAdmin = true; }
  } catch (_) { __isAdmin = false; }
  if (btn) btn.style.display = __isAdmin ? '' : 'none';
}
function needAdmin() {
  if (isAdmin()) return true;
  toast(t(inTG ? 'Нет доступа: панель только для админов' : 'Админка доступна только в Telegram для админов'), 'error');
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
  if (!tg) { log(t('открыто в браузере (вне TG)')); return; }
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
    if (u) log('TG user: ' + (u.first_name || 'id ' + u.id)); // badge removed: profile tab shows identity
    if (inTG) document.body.classList.add('in-tg');
    log(t(inTG ? 'Telegram Mini App: авторизован' : 'Telegram WebView (тест, без initData)'));
  } catch (e) { log(t('TG init error: ') + e.message); }
}

function syncMainButton() {
  if (!tg?.MainButton || !inTG) return;
  try {
    tg.MainButton.setText(selectedLot ? (t('Купить за {p}', { p: selectedLot.price })) : t('Купить лот'));
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
    log(t('TON Connect инициализирован'));
    tonConnectUI.onStatusChange((w) => {
      if (w) {
        setStatus(t('Кошелёк подключён: ') + (w.account?.address?.slice(0, 10) + '…'), 'ok');
        log(t('wallet connected'));
        haptic('light');
      } else { setStatus(t('Кошелёк отключён'), ''); }
      syncMainButton();
    });
  } else {
    log(t('TON_CONNECT_UI не загрузился (проверь интернет)'));
  }
} catch (e) { log(t('TON init error: ') + e.message); }

function isValidTonAddress(a) {
  return typeof a === 'string' && /^[UEk0]Q[A-Za-z0-9_-]{46}$/.test(a);
}
const LOTS = [
  { id: 'lot1', title: 'NEURO Farming', desc: 'AI-ферма доходности на TON: алгоритмы перераспределяют ликвидность между пулами.', price: '1 TON', nano: '1000000000', tag: 'AI · DeFi', grad: 'linear-gradient(135deg,#7c3aed,#06b6d4)', logo: '🧠', stage: 'live', format: 'online', loc: 'Онлайн', goal: '100 000 TON', verified: true },
  { id: 'lot2', title: 'TON Estate', desc: 'Токенизированная недвижимость: доля в арендных объектах с доходом.', price: '5 TON', nano: '5000000000', tag: 'RWA', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', logo: '🏠', stage: 'live', format: 'hybrid', loc: 'Дубай', goal: '250 000 TON', verified: true },
  { id: 'uzv', title: 'UZV Mining', desc: 'Модульные майнинг-контейнеры на зелёной энергии. Фото оборудования — в отчётах аудитора.', price: '2 TON', nano: '2000000000', tag: 'Mining', grad: 'linear-gradient(135deg,#10b981,#3b82f6)', logo: '⛏️', stage: 'live', format: 'offline', loc: 'Алматы', goal: '80 000 TON', verified: false },
  { id: 'lot4', title: 'GameFi Arena', desc: 'Турнирная платформа с призовым фондом в TON. Пока на стадии идеи.', price: '0.5 TON', nano: '500000000', tag: 'GameFi', grad: 'linear-gradient(135deg,#ec4899,#8b5cf6)', logo: '🎮', stage: 'idea', format: 'online', loc: 'Онлайн', goal: '30 000 TON', verified: false },
];
// Cover photos per lot (picsum seeds = stable images). Custom lots fall back to gradient.
const LOT_PHOTOS = {
  lot1: 'https://picsum.photos/seed/capiton-neuro/800/1000',
  lot2: 'https://picsum.photos/seed/capiton-estate/800/1000',
  uzv: 'https://picsum.photos/seed/capiton-mining/800/1000',
  lot4: 'https://picsum.photos/seed/capiton-arena/800/1000',
};
function photoFor(lot) { return LOT_PHOTOS[lot.id] || null; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function logoHtml(lot, cls) {
  const lg = String(lot.logo || (lot.title || '?').slice(0, 1)).trim().slice(0, 300);
  if (/^https:\/\/[^\s"'<>]{1,300}$/i.test(lg)) return `<span class="${cls}"><img src="${esc(lg)}" alt="" loading="lazy"></span>`;
  return `<span class="${cls}">${esc(lg.slice(0, 2))}</span>`;
}
const GRAD_FALLBACK = 'linear-gradient(135deg,#1a73e8,#7c5cff)';
function cleanGrad(g) {
  const s = String(g || '').trim();
  if (/^linear-gradient\(\s*\d+deg\s*(,\s*#[0-9a-f]{3,8}){2,4}\s*\)$/i.test(s)) return s;
  return GRAD_FALLBACK;
}
function sanitizeLot(c) {
  if (!c || typeof c !== 'object') return null;
  const id = String(c.id || '').slice(0, 64);
  const title = String(c.title || '').slice(0, 80);
  if (!id || !title) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return {
    id, title,
    desc: String(c.desc || '').slice(0, 500),
    price: String(c.price || '').slice(0, 24),
    nano: /^\d{1,20}$/.test(String(c.nano || '')) ? String(c.nano) : '1000000000',
    tag: String(c.tag || t('лот')).slice(0, 24),
    grad: cleanGrad(c.grad),
    mine: true,
    logo: String(c.logo || title.slice(0, 1)).slice(0, 300),
    stage: c.stage === 'live' ? 'live' : 'idea',
    format: ['online', 'offline', 'hybrid'].includes(c.format) ? c.format : 'online',
    loc: String(c.loc || t('Онлайн')).slice(0, 60),
    goal: String(c.goal || '').slice(0, 24),
    verified: !!c.verified,
    pending: c.pending === true,
  };
}
function vBadge(lot) { return lot.verified ? `<span class="vbadge" title="${esc(t('Верифицирован'))}">✓</span>` : ''; }
function stageName(s) { return s === 'live' ? t('существует') : t('идея'); }
function formatName(f) { return f === 'online' ? t('Онлайн') : f === 'offline' ? t('Офлайн') : f === 'hybrid' ? t('Онлайн + офлайн') : (f || ''); }
const HOMO = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', m: 'м', k: 'к', t: 'т', b: 'в', h: 'н', n: 'п', '0': 'о', 'і': 'и', 'ї': 'и', 'є': 'е' };
function normText(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\u200b-\u200f]/g, '').replace(/[aeopcxymktbhn0ієї]/g, (ch) => HOMO[ch] || ch).replace(/\s+/g, ' ').trim();
}
const TRANS_COMBO = [['shch', 'щ'], ['sch', 'щ'], ['zh', 'ж'], ['kh', 'х'], ['ch', 'ч'], ['ts', 'ц'], ['tz', 'ц'], ['yu', 'ю'], ['ya', 'я'], ['yo', 'ё'], ['ye', 'е'], ['yi', 'и']];
const TRANS_SINGLE = { a: 'а', b: 'б', c: 'с', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', w: 'в' };
function translitText(s) {
  let t = String(s || '').toLowerCase();
  for (const [lat, cy] of TRANS_COMBO) t = t.split(lat).join(cy);
  return t.replace(/ё/g, 'е').replace(/[\u200b-\u200f]/g, '').replace(/[a-z]/g, (ch) => TRANS_SINGLE[ch] || ch).replace(/\s+/g, ' ').trim();
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
  const textT = translitText(title + ' ' + desc);
  const rawText = String(title + ' ' + desc).toLowerCase().replace(/[\u200b-\u200f]/g, '').replace(/\s+/g, ' ').trim();
  const viaMapping = (hits) => hits.length > 0 && /[a-z]/i.test(rawText) && hits.some(h => !rawText.includes(h));
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
  const matRoots = ['хуй', 'хуе', 'хую', 'хуя', 'пизд', 'пезд', 'ебан', 'ебат', 'ебал', 'ебет', 'ебу', 'еби', 'еблан', 'бляд', 'блях', 'сука', 'суки', 'сучк', 'залуп', 'говн', 'сран', 'дроч', 'пидор', 'педик', 'херня', 'херню', 'хером', 'чмо', 'уеб', 'долбоеб', 'мудак', 'мудил', 'гандон', 'мразь'];
  const matOn = (t) => matRoots.filter(w => t.includes(w));
  const matHits = [...new Set([...matOn(text), ...matOn(textT)])];
  if (matHits.length) {
    severe++;
    critical.push(t('мат: {x}', { x: matHits.slice(0, 4).join(', ') }));
    score -= 35;
    if (matHits.length >= 3) { severe++; score -= 25; }
    if (viaMapping(matHits)) { severe++; critical.push(t('обход фильтра латиницей')); score -= 25; }
  }
  const slurSub = ['гомик', 'пидор', 'пидорас', 'нигер', 'ниггер', 'чурк', 'черножоп'];
  const slurFlex = [
    { stem: 'хохл', except: ['хохлома'] },
    { stem: 'жид', except: ['жидкост'] },
    { stem: 'хач', except: ['хачапури'] },
    { stem: 'даун', except: ['дауншифтинг', 'синдром'] },
  ];
  const flexHit = (s) => {
    const hits = [];
    for (const f of slurFlex) {
      if (f.except.some(x => s.includes(x))) continue;
      let m = null;
      try { m = s.match(new RegExp('(^|[^a-zа-яё0-9])' + f.stem + '[а-яё]*', 'i')); }
      catch (_) { m = null; }
      if (m) hits.push(m[0].replace(/^[^a-zа-яё]+/i, ''));
    }
    return hits;
  };
  const slurHits = [...new Set([...slurSub.filter(w => text.includes(w)), ...flexHit(text), ...slurSub.filter(w => textT.includes(w)), ...flexHit(textT)])];
  if (slurHits.length) {
    severe++;
    critical.push(t('оскорбление группы: {x}', { x: slurHits.slice(0, 3).join(', ') }));
    score -= 40;
    if (viaMapping(slurHits)) { severe++; critical.push(t('обход фильтра латиницей')); score -= 25; }
    const dehuman = ['разведение', 'корм', 'скот', 'загон', 'стойл', 'убой', 'истреб', 'уничтож', 'убей', 'убейте', 'убить', 'сдохни'];
    const slurIn = (s) => slurSub.some(w => s.includes(w)) || flexHit(s).length > 0;
    const sameSentence = text.split(/[.!?;\n]+/).some(s => slurIn(s) && dehuman.some(w => s.includes(w)));
    if (sameSentence) { severe++; critical.push(t('дегуманизация / призыв')); score -= 30; }
  }
  const profitMatch = text.match(/(\d{2,4})\s*%\s*(в\s*(день|сутки|неделю)|годовых|месяц)/);
  if (profitMatch) {
    const pct = parseInt(profitMatch[1], 10);
    const period = profitMatch[2] || '';
    if (/день|сутки|неделю/.test(period) && pct >= 5) { severe++; critical.push(t('доход {p}% за короткий срок', { p: pct })); score -= 40; }
    else if (pct >= 500) { warnings.push(t('доход {p}% — нужны доказательства', { p: pct })); score -= 12; }
  }
  if (/гарант.*(прибыл|доход|возврат)/.test(text) && /(без\s*риска|100\s*%|точно)/.test(text)) {
    severe++;
    critical.push(t('гарантия прибыли без риска'));
    score -= 40;
  }
  const risky = hasWord(text, ['казино', 'ставк', 'букмекер', 'кредит', 'займ.*под.*процент']);
  if (risky.length && severe === 0) { warnings.push(t('рискованная тема: {x} — проверь вручную', { x: risky.join(', ') })); score -= clampSub(10, 10); }
  const pressure = hasWord(text, ['только сегодня', 'успей', 'последний шанс', 'срочно вложи']);
  if (pressure.length) { tips.push(t('давление на покупателя: {x}', { x: pressure.join(', ') })); score -= 4; }

  const tLen = title.replace(/\s/g, '').length;
  const dLen = desc.trim().length;
  if (tLen < 3) { warnings.push(t('название короче 3 букв')); score -= 8; }
  else if (tLen < 6) { tips.push(t('название короткое — добавь specificity')); score -= 2; }
  if (dLen < 20) { warnings.push(t('описание короче 20 символов')); score -= 8; }
  else if (dLen < 60) { tips.push(t('опиши подробнее: куда пойдут средства, сроки')); score -= 3; }
  else if (dLen >= 200) { score += 2; }

  const letters = desc.match(/[A-Za-zА-Яа-я]/g) || [];
  const caps = (desc.match(/[A-ZА-Я]/g) || []).length;
  if (letters.length > 20 && caps / letters.length > 0.7) { tips.push(t('много капса — читается как спам')); score -= 4; }
  const links = (desc.match(/https?:\/\/|t\.me\/|@[\w_]{3,}/gi) || []).length;
  const emojiSpam = (desc.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  if (links > 3) { warnings.push(t('много ссылок: {n}', { n: links })); score -= 6; }
  if (emojiSpam > 8) { tips.push(t('много эмодзи')); score -= 3; }
  if (links > 0 && dLen < 40) { tips.push(t('есть ссылка, но мало описания')); score -= 3; }

  const gibberishFlags = (s) => {
    const flags = [];
    const letters = (String(s || '').match(/[A-Za-zА-Яа-яЁё]/g) || []).join('').toLowerCase();
    if (letters.length < 12) return flags;
    const vowels = (letters.match(/[аеёиоуыэюяaeiou]/g) || []).length;
    const ratio = vowels / letters.length;
    if (ratio < 0.2) flags.push(t('текст почти без гласных — похож на случайный набор'));
    if (new Set(letters).size / letters.length < 0.4) flags.push(t('однообразный набор букв — похоже на мусор'));
    if (/(..)\1{3,}/.test(letters)) flags.push(t('повторяющиеся слоги — похоже на мусор'));
    if (/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxz]{6,}/.test(letters)) flags.push(t('непроизносимый набор согласных'));
    const words = String(s || '').split(/\s+/).filter(w => /[A-Za-zА-Яа-яЁё]/.test(w));
    if (words.length >= 2) {
      const avg = words.join('').length / words.length;
      if (avg > 15) flags.push(t('слишком длинные «слова» без пробелов'));
    }
    return flags;
  };
  const gib = [...gibberishFlags(title), ...gibberishFlags(desc)];
  if (gib.length) {
    const uniq = [...new Set(gib)];
    warnings.push(t('мусор в тексте: {x}', { x: uniq.join('; ') }));
    score -= 18 + 7 * (uniq.length - 1);
  }

  if (!(priceNum > 0)) { warnings.push(t('нет цены акции')); score -= 12; }
  if (/e[+-]?\d/i.test(String(lot.price || ''))) { warnings.push(t('цена в экспоненциальной записи — проверь нолики')); score -= 15; }
  if (/e[+-]?\d/i.test(String(lot.goal || ''))) { warnings.push(t('цель в экспоненциальной записи — проверь нолики')); score -= 10; }
  if (goalNum > 0 && priceNum > 0 && goalNum < priceNum) { warnings.push(t('цель меньше цены 1 акции — проверь цифры')); score -= 8; }
  if (goalNum > 5000000 && goalNum <= 1e9) { warnings.push(t('цель > 5 млн TON — выглядит как опечатка')); score -= 15; }
  if (goalNum > 1e9) { severe++; critical.push(t('цель нереальна (>1 млрд TON)')); score -= 40; }
  if (priceNum > 10000 && priceNum <= 1000000) { warnings.push(t('цена акции очень высокая — проверь нолики')); score -= 15; }
  if (priceNum > 1000000) { severe++; critical.push(t('цена акции нереальна (>1 млн TON)')); score -= 40; }
  if (!lot.loc) { tips.push(t('нет локации')); score -= 2; }

  try {
    const pool = Array.isArray(all) ? all : LOTS;
    const nt = normText(title);
    if (nt.length > 8) {
      const dup = pool.filter(x => x.id !== lot.id && normText(x.title) === nt).length;
      if (dup) { warnings.push(t('такое название уже есть — возможно дубль')); score -= 6; }
    }
  } catch (_) {}

  score = Math.max(5, Math.min(99, Math.round(score)));
  let verdict;
  if (severe >= 2 || (severe >= 1 && score < 30)) verdict = 'reject';
  else if (severe >= 1 || score < 55) verdict = 'review';
  else verdict = 'auto';
  if (verdict === 'reject' && critical.length === 0) verdict = 'review';
  const fix = [];
  if (dLen < 60) fix.push(t('добавь 2-3 предложения: что за проект, куда пойдут деньги, сроки'));
  if (!(priceNum > 0)) fix.push(t('укажи цену 1 акции в TON'));
  if (!lot.loc) fix.push(t('укажи город или «онлайн»'));
  if (warnings.some(w => /доход|income/i.test(w))) fix.push(t('убери % доходности или приложи отчётность'));
  if (critical.some(c => /мат|profanity/i.test(c))) fix.push(t('убери нецензурные слова из названия и описания'));
  if (critical.some(c => /оскорбление|slur/i.test(c))) fix.push(t('убери оскорбления групп — такое не публикуем'));
  return { score, verdict, critical, warnings, tips, fix, reasons: [...critical, ...warnings, ...tips] };
}
function aiHtml(m) {
  const cls = m.verdict === 'auto' ? 'ok' : m.verdict === 'review' ? 'warn' : 'bad';
  const label = m.verdict === 'auto' ? t('AI-модер: выглядит чисто') : m.verdict === 'review' ? t('AI-модер: на проверку человеку') : t('AI-модер: блок — явный скам');
  const bar = `<div class="ai-bar"><i style="width:${m.score}%"></i></div>`;
  const crit = (m.critical || []).length ? `<div>⛔ ${esc(m.critical.join('; '))}</div>` : '';
  const warn = (m.warnings || []).length ? `<div>⚠️ ${esc(m.warnings.join('; '))}</div>` : '';
  const tip = (m.tips || []).length ? `<div class="ai-tips">💡 ${esc(m.tips.join('; '))}</div>` : '';
  const fix = (m.fix || []).length ? `<div class="ai-tips">${esc(t('🛠 Как пройти: {x}', { x: m.fix.join('; ') }))}</div>` : '';
  const note = m.verdict === 'review' ? `<div class="ai-tips">${esc(t('Ложных блокировок нет: спорное уходит человеку, а не в бан.'))}</div>` : '';
  return `<div class="ai-verdict ${cls}">🤖 ${label} · ${m.score}/100${bar}${crit}${warn}${tip}${fix}${note}</div>`;
}
try {
  const custom = JSON.parse(localStorage.getItem('capiton_lots') || '[]');
  if (Array.isArray(custom)) for (const c of custom) { const s = sanitizeLot(c); if (s) LOTS.push(s); }
} catch (_) {}
let selectedLot = null;
let lotFilter = '';
let lotSort = 'pop';
let lotFormat = 'all';
let lotStage = 'all';
let lotVerifiedOnly = false;
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
      { title: t('Этап 1 · материалы'), pct: 20, released: true, yes: 12, no: 1 },
      { title: t('Этап 2 · фундамент и каркас'), pct: 30, released: false, yes: 4, no: 1 },
      { title: t('Этап 3 · оборудование и запуск'), pct: 50, released: false, yes: 1, no: 0 },
    ],
    multisig: { entrepreneur: true, platform: false, auditor: false },
    invoices: [
      { id: id + '-inv1', title: t('Счёт от поставщика №1'), amount: '0.4 TON', paid: false },
      { title: t('Счёт от поставщика №2'), id: id + '-inv2', amount: '0.6 TON', paid: false },
    ],
  };
}
function sanitizeTrust(t) {
  const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  if (!t || typeof t !== 'object') return defaultTrust('x');
  const ms = Array.isArray(t.milestones) && t.milestones.length ? t.milestones : defaultTrust('x').milestones;
  return {
    escrow: true,
    milestones: ms.slice(0, 8).map((m, i) => ({
      title: String((m && m.title) || t('Этап {n}', { n: i + 1 })).slice(0, 80),
      pct: Math.max(0, Math.min(100, num(m && m.pct, 0))),
      released: !!(m && m.released),
      yes: Math.max(0, Math.min(1e6, Math.floor(num(m && m.yes, 0)))),
      no: Math.max(0, Math.min(1e6, Math.floor(num(m && m.no, 0)))),
    })),
    multisig: {
      entrepreneur: true,
      platform: !!(t.multisig && t.multisig.platform),
      auditor: !!(t.multisig && t.multisig.auditor),
    },
    invoices: (Array.isArray(t.invoices) ? t.invoices : []).slice(0, 12).map((inv, i) => ({
      id: String((inv && inv.id) || ('inv' + i)).slice(0, 64),
      title: String((inv && inv.title) || t('Счёт')).slice(0, 80),
      amount: String((inv && inv.amount) || '').slice(0, 24),
      paid: !!(inv && inv.paid),
    })),
  };
}
function getTrust(lot) {
  if (lot._trust && Array.isArray(lot._trust.milestones) && lot._trust.milestones.length) {
    return lot._trust = sanitizeTrust(lot._trust); // attached from API
  }  try {
    const all = JSON.parse(localStorage.getItem('capiton_trust') || '{}');
    if (all[lot.id]) {
      lot._trust = sanitizeTrust(all[lot.id]);
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
function voterId() {
  const tgId = currentTgId();
  if (tgId != null) return 'tg:' + tgId;
  try {
    let anon = localStorage.getItem('capiton_voter');
    if (!anon || !/^anon:[a-z0-9]+$/i.test(anon)) {
      anon = 'anon:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('capiton_voter', anon);
    }
    return anon;
  } catch (_) { return 'anon:session'; }
}
function myVote(lotId, mi) {
  try { return localStorage.getItem('capiton_voted:' + voterId() + '|' + lotId + ':' + mi) || null; }
  catch (_) { return null; }
}
async function voteTranche(lotId, mi, yes) {
  const lot = LOTS.find(l => l.id === lotId);
  if (!lot) return;
  // Backend first (enforces one-vote-per-user in DB)
  if (window.Backend) {
    try {
      const res = await window.Backend.vote(lotId, mi, yes ? 'yes' : 'no');
      const t0 = getTrust(lot);
      const m0 = t0.milestones[mi];
      if (m0 && res) { m0.yes = res.yes; m0.no = res.no; }
      saveTrust(lot);
      renderTrust();
      renderAdmin();
      toast(t('Голос учтён'), 'success');
      return;
    } catch (e) {
      if (/409|Already voted|уже голосовал/i.test(e.message)) { toast(t('Ты уже голосовал по этому этапу'), 'warning'); return; }
      log(t('vote API fallback: ') + e.message);
    }
  }
  const t = getTrust(lot);
  const m = t.milestones[mi];
  if (!m || m.released) return;
  const prev = myVote(lotId, mi);
  if (prev) { toast(t(prev === 'yes' ? 'Ты уже голосовал «За» по этому этапу' : 'Ты уже голосовал «Против» по этому этапу'), 'warning'); return; }
  if (yes) m.yes++; else m.no++;
  try { localStorage.setItem('capiton_voted:' + voterId() + '|' + lotId + ':' + mi, yes ? 'yes' : 'no'); } catch (_) {}
  const total = m.yes + m.no;
  if (total >= 3 && m.yes / total > 0.51 && multisigCount(t) >= 2) {
    m.released = true;
    log(t('транш разблокирован: ') + m.title);
    toast(t('Транш разблокирован: {x}', { x: m.title }), 'success');
  } else if (total >= 3 && m.yes / total > 0.51) {
    toast(t('Голосов хватает (>51%), нужны 2 подписи мультисига'));
  }
  saveTrust(lot);
  renderTrust();
  renderAdmin();
}
async function msApprove(lotId, role) {
  if (role !== 'entrepreneur' && !needAdmin()) return;
  if (window.Backend && (role === 'platform' || role === 'auditor')) {
    try { await window.Backend.multisig(lotId, role); } catch (e) { log(t('multisig API: ') + e.message); }
  }
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
async function payInvoice(lotId, invId) {
  if (!needAdmin()) return;
  if (window.Backend) {
    try { await window.Backend.payInvoice(invId); } catch (e) { log(t('pay API: ') + e.message); }
  }
  const lot = LOTS.find(l => l.id === lotId);
  if (!lot) return;
  const t = getTrust(lot);
  const inv = t.invoices.find(i => i.id === invId);
  if (!inv || inv.paid) return;
  const releasedAny = t.milestones.some(m => m.released);
  if (!releasedAny) { toast(t('Нет разблокированных траншей — оплата невозможна'), 'error'); return; }
  if (multisigCount(t) < 2) { toast(t('Нужны 2 подписи мультисига'), 'error'); return; }
  inv.paid = true;
  saveTrust(lot);
  renderTrust();
  renderAdmin();
  toast(t('Оплачено подрядчику напрямую: {x}', { x: inv.title }), 'success');
}
function trustSummary(lot) {
  const t = getTrust(lot);
  const rel = t.milestones.filter(m => m.released).reduce((s, m) => s + m.pct, 0);
  return { releasedPct: rel, lockedPct: 100 - rel, keys: multisigCount(t) };
}
function tonToNum(p) { return parseFloat(p); }
function getVisibleLots() {
  let arr = LOTS.filter(l => !l.pending && (l.title + ' ' + l.desc + ' ' + (l.loc || '')).toLowerCase().includes(lotFilter));
  if (lotFormat !== 'all') arr = arr.filter(l => l.format === lotFormat);
  if (lotStage !== 'all') arr = arr.filter(l => l.stage === lotStage);
  if (lotVerifiedOnly) arr = arr.filter(l => l.verified);
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
  // Legacy grid (#lotsGrid) is gone — every caller now refreshes the feed.
  renderFeed();
}
function feedCardHtml(l) {
  const photo = photoFor(l);
  const cover = photo
    ? `<div class="feed-photo"><img src="${esc(photo)}" alt="" loading="lazy"></div>`
    : `<div class="feed-photo" style="background:${cleanGrad(l.grad)}"></div>`;
  let trustLine = '';
  try {
    const s = trustSummary(l);
    trustLine = `<div class="feed-trust">${esc(t('Эскроу выдано {rel}% · подписей {k}/3', { rel: s.releasedPct, k: s.keys }))}</div>`;
  } catch (_) {}
  const meta = [l.stage ? stageName(l.stage) : '', l.format ? formatName(l.format) : '', l.loc || '', l.goal ? t('нужно {g}', { g: l.goal }) : '']
    .filter(Boolean).map(s => `<span>${esc(s)}</span>`).join('');
  return `<article class="feed-card" data-feed="${esc(l.id)}">
    ${cover}<div class="feed-shade"></div>
    <div class="feed-body">
      <span class="feed-tag">${esc(l.tag || 'лот')} · ${esc(l.price)}</span>
      <h3>${esc(l.title)}${vBadge(l)}</h3>
      <p>${esc(l.desc)}</p>
      <div class="feed-meta">${meta}</div>
      ${trustLine}
      <div class="feed-buyrow"><button class="feed-buy" data-buy="${esc(l.id)}">💎 ${esc(l.price)}</button></div>
    </div>
  </article>`;
}
function renderFeed() {
  const feed = $('#feed');
  if (!feed) return;
  const top = feed.scrollTop;
  const vis = getVisibleLots();
  feed.innerHTML = vis.map(feedCardHtml).join('') || `<p class="feed-empty">${esc(t('Лотов пока нет — измени фильтры.'))}</p>`;
  feed.scrollTop = top;
}
function openLot(id) {
  selectLot(id);
  const m = $('#lotModal');
  if (m) { m.hidden = false; m.querySelector('.modal-card')?.scrollTo?.(0, 0); }
}
function closeLot() { const m = $('#lotModal'); if (m) m.hidden = true; }
/* ===== views (feed / profile / portfolio) ===== */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('#tabbar .tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name === 'profile') renderProfile();
  if (name === 'portfolio') renderPortfolio();
  haptic('light');
}
function tgUser() {
  try { return tg?.initDataUnsafe?.user || null; } catch (_) { return null; }
}
function refreshAvatar() {
  const u = tgUser();
  const html = u?.photo_url
    ? `<img src="${esc(u.photo_url)}" alt="">`
    : esc(String((u?.first_name || 'Г')[0] || 'Г').toUpperCase());
  const t1 = $('#tabAvatar');
  if (t1) t1.innerHTML = html;
  const t2 = $('#profileAvatar');
  if (t2) t2.innerHTML = html;
}
function fmtTon(nano) {
  const n = Number(nano);
  if (!Number.isFinite(n)) return '—';
  return String(parseFloat((n / 1e9).toFixed(4))) + ' TON';
}
const PIE_COLORS = ['#1a73e8', '#7c5cff', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#84cc16', '#6366f1'];
function drawPie(canvas, entries) {
  if (!canvas) return false;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 8;
  ctx.clearRect(0, 0, W, H);
  const total = entries.reduce((s, e) => s + e.value, 0);
  if (!total) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.strokeStyle = '#e6eaf0'; ctx.lineWidth = 26; ctx.stroke();
    return false;
  }
  let a = -Math.PI / 2;
  entries.forEach((e, i) => {
    const a2 = a + (e.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a2); ctx.closePath();
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]; ctx.fill();
    a = a2;
  });
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
  return true;
}
function pieLegend(el, entries) {
  if (!el) return;
  const total = entries.reduce((s, e) => s + e.value, 0) || 1;
  el.innerHTML = entries.map((e, i) =>
    `<span><i style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></i>${esc(e.label)} · ${Math.round(e.value / total * 100)}%</span>`
  ).join('') || `<span class="muted">${esc(t('Пока пусто'))}</span>`;
}
function localVotesCount() {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      if ((localStorage.key(i) || '').startsWith('capiton_voted:')) n++;
    }
    return n;
  } catch (_) { return 0; }
}
function ratingFor(investedTon, votes, lots) {
  const score = Math.max(0, Math.min(100, Math.round(investedTon * 2 + votes * 4 + lots * 8)));
  const label = score >= 80 ? t('🐋 Кит') : score >= 50 ? t('💼 Трейдер') : score >= 20 ? t('📈 Инвестор') : t('🌱 Новичок');
  return { score, label };
}
async function renderProfile() {
  const u = tgUser();
  const nameEl = $('#profileName'), nickEl = $('#profileNick');
  if (nameEl) nameEl.textContent = u ? ([u.first_name, u.last_name].filter(Boolean).join(' ') || t('Инвестор')) : t('Гость');
  if (nickEl) nickEl.textContent = u ? (`@${u.username || '—'} · id ${u.id}`) : t('Открой через Telegram-бота');
  const votes = localVotesCount();
  const lots = LOTS.filter(l => l.mine).length;
  const sv = $('#stVotes'); if (sv) sv.textContent = votes;
  const sl = $('#stLots'); if (sl) sl.textContent = lots;
  let investedTon = 0, divTon = 0, pieEntries = [];
  try {
    const p = await window.Backend.portfolio();
    investedTon = Number(p.total_invested_nano) / 1e9;
    divTon = Number(p.dividends_total_nano) / 1e9;
    pieEntries = (p.lots || []).map(x => ({ label: x.title || x.lot_id, value: Number(x.invested_nano) || 0 }));
    const si = $('#stInvested'); if (si) si.textContent = fmtTon(p.total_invested_nano);
    const sd = $('#stDivs'); if (sd) sd.textContent = fmtTon(p.dividends_total_nano);
  } catch (_) {
    const si = $('#stInvested'); if (si) si.textContent = '—';
    const sd = $('#stDivs'); if (sd) sd.textContent = '—';
  }
  const r = ratingFor(Number.isFinite(investedTon) ? investedTon : 0, votes, lots);
  const rl = $('#ratingLabel'); if (rl) rl.textContent = `${r.label} · ${r.score}/100`;
  const rf = $('#ratingFill'); if (rf) rf.style.width = r.score + '%';
  drawPie($('#profilePie'), pieEntries);
  pieLegend($('#profilePieLegend'), pieEntries);
}
async function renderPortfolio() {
  const list = $('#pfList'), divList = $('#pfDivList'), legend = $('#pfLegend');
  try {
    const p = await window.Backend.portfolio();
    const t = $('#pfTotal'); if (t) t.textContent = fmtTon(p.total_invested_nano);
    const d = $('#pfDivs'); if (d) d.textContent = fmtTon(p.dividends_total_nano);
    const cn = $('#pfCount'); if (cn) cn.textContent = (p.lots || []).length;
    const entries = (p.lots || []).map(x => ({ label: x.title || x.lot_id, value: Number(x.invested_nano) || 0 }));
    drawPie($('#pfPie'), entries);
    pieLegend(legend, entries);
    if (list) list.innerHTML = (p.lots || []).map(x =>
      `<div class="pf-row"><span>${esc(x.title || x.lot_id)}</span><b>${fmtTon(x.invested_nano)} · ${x.share_pct || 0}%</b></div>`
    ).join('') || `<p class="muted">${esc(t('Долей пока нет — выбери лот в маркете.'))}</p>`;
    if (divList) divList.innerHTML = (p.dividends || []).map(x =>
      `<div class="pf-row"><span>${esc(x.lot_id)}</span><b>+${fmtTon(x.amount_nano)}</b></div>`
    ).join('') || `<p class="muted">${esc(t('Выплат пока не было.'))}</p>`;
  } catch (e) {
    if (list) list.innerHTML = `<p class="muted">${esc(t('Войди через Telegram-бота, чтобы увидеть портфель.'))}</p>`;
    if (divList) divList.innerHTML = '';
    drawPie($('#pfPie'), []); pieLegend(legend, []);
  }
}
function renderCheckoutMeta(lot) {
  const meta = $('#lotMeta');
  if (meta) meta.innerHTML = [lot.stage ? stageName(lot.stage) : '', lot.format ? formatName(lot.format) : '', lot.loc || '', lot.goal ? t('нужно {g}', { g: lot.goal }) : ''].filter(Boolean).map(esc).map(s => `<span>${s}</span>`).join('');
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
  if (btn) btn.textContent = t('Купить за {p}', { p: selectedLot.price });
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
    <div class="trust-head">${esc(t('Эскроу · разблокировано {rel}% · в сейфе {lock}%', { rel: s.releasedPct, lock: s.lockedPct }))}</div>
    <div class="ai-bar"><i style="width:${s.releasedPct}%"></i></div>
    ${t.milestones.map((m, i) => {
      const total = m.yes + m.no;
      const pctYes = total ? Math.round(m.yes / total * 100) : 0;
      return `<div class="ms-item">
        <b>${esc(m.title)} · ${m.pct}% ${m.released ? t('· выдано') : t('· в сейфе')}</b>
        <div class="vote-bar"><i style="width:${pctYes}%"></i></div>
        <div class="ms-sub">${esc(t('За {y} / против {n} · нужно >51% держателей', { y: m.yes, n: m.no }))}</div>
        ${m.released ? '' : (() => {
          const v = myVote(selectedLot.id, i);
          if (v) return `<div class="ms-sub">${esc(t('Твой голос: {v} · один голос с человека', { v: v === 'yes' ? t('За ✓') : t('Против') }))}</div>`;
          return `<div class="admin-row">
            <button class="abtn ok" data-vote-yes="${esc(selectedLot.id)}:${i}">${esc(t('За транш'))}</button>
            <button class="abtn no" data-vote-no="${esc(selectedLot.id)}:${i}">${esc(t('Против'))}</button>
          </div>`;
        })()}
      </div>`;
    }).join('')}
    <div class="trust-head">${esc(t('Мультисиг 2/3 · подписей: {n}', { n: s.keys }))}</div>
    <div class="mskeys">${key(t('Предприниматель'), ms.entrepreneur)}${key(t('Платформа'), ms.platform)}${key(t('Аудитор'), ms.auditor)}</div>
    <div class="admin-row">
      <button class="abtn dim" data-ms="platform:${esc(selectedLot.id)}">${esc(t('Платформа: подписать'))}</button>
      <button class="abtn dim" data-ms="auditor:${esc(selectedLot.id)}">${esc(t('Аудитор: подписать'))}</button>
    </div>
    <div class="trust-head">${esc(t('Оплата подрядчикам напрямую'))}</div>
    ${t.invoices.map(inv => `<div class="ms-item"><b>${esc(inv.title)} · ${esc(inv.amount)}</b>
      <div class="ms-sub">${inv.paid ? esc(t('оплачено со счёта платформы')) : inv.vetoed ? esc(t('заморожено вето инвесторов')) : esc(t('ждёт разблокированного транша + 2 подписей'))}</div>
      ${inv.paid ? '' : `<button class="abtn ok" data-pay="${esc(selectedLot.id)}:${esc(inv.id)}">${esc(t('Оплатить счёт'))}</button>
      <button class="abtn no" data-veto="${esc(inv.id)}">${esc(t('Наложить вето'))}</button>`}
    </div>`).join('')}`;
}
async function onInvest(forcedId) {
  const btn = $('#investBtn');
  haptic('medium');
  if (forcedId) selectLot(forcedId);
  const lot = selectedLot;
  if (!tonConnectUI) { toast(t('TON Connect не загрузился'), 'error'); return; }
  if (!tonConnectUI.connected) {
    toast(t('Сначала подключи криптокошелёк сверху!'), 'warning');
    setStatus(t('Подключи кошелёк для продолжения'), 'err');
    return;
  }
  if (!isValidTonAddress(CONFIG.recipient)) {
    toast(t('Адрес получателя не настроен (app.js → CONFIG.recipient)'), 'error');
    setStatus(t('CONFIG.recipient = "{r}" — невалидный TON-адрес', { r: CONFIG.recipient }), 'err');
    log(t('blocked: invalid recipient'));
    return;
  }
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 120,
    messages: [{ address: CONFIG.recipient, amount: lot.nano || CONFIG.amountNano }],
  };
  try {
    if (btn) btn.disabled = true;
    try { tg?.MainButton?.showProgress?.(); } catch (_) {}
    setStatus(t('Ожидание подписи в кошельке…'), '');
    log(t('sendTransaction {id} {p} → {r}', { id: lot.id, p: lot.price, r: CONFIG.recipient }));
    await tonConnectUI.sendTransaction(transaction);
    try { await window.Backend?.invest(lot.id, 'ton-tx-' + Date.now()); } catch (e) { log(t('invest API: ') + e.message); }
    setStatus(t('Готово! Лот "{x}" твой.', { x: lot.title }), 'ok');
    toast(t('Готово! Лот "{x}" твой.', { x: lot.title }), 'success');
    log(t('tx success'));
  } catch (e) {
    setStatus(t('Транзакция отменена.'), 'err');
    log(t('tx cancelled'));
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
  if (!LOTS.length) { box.innerHTML = `<p>${esc(t('Лотов нет.'))}</p>`; return; }
  box.innerHTML = LOTS.map(l => {
    const m = aiModerate(l);
    const ts = trustSummary(l);
    return `<div class="admin-item">
      <h4>${logoHtml(l, 'lot-logo')} ${esc(l.title)}${vBadge(l)} ${l.pending ? `<span class="admin-ai">${esc(t('на модерации'))}</span>` : ''}</h4>
      <p>${esc(l.desc)} · ${esc(l.price)} · ${esc(l.loc || '—')} · ${esc(stageName(l.stage))} · ${esc(l.format ? formatName(l.format) : '—')}</p>
      <p>${esc(t('Эскроу: выдано {r}% · подписей {k}/3', { r: ts.releasedPct, k: ts.keys }))}</p>
      ${aiHtml(m)}
      <div class="admin-row">
        ${!l.verified ? `<button class="abtn ok" data-verify="${esc(l.id)}">${esc(t('✓ Верифицировать'))}</button>` : `<button class="abtn dim" data-unverify="${esc(l.id)}">${esc(t('Снять галочку'))}</button>`}
        ${l.pending ? `<button class="abtn ok" data-approve="${esc(l.id)}">${esc(t('Опубликовать'))}</button>` : ''}
        <button class="abtn no" data-adel="${esc(l.id)}">${esc(t('Удалить'))}</button>
      </div>
    </div>`;
  }).join('');
}
document.addEventListener('click', async (e) => {
  const verify = e.target.closest?.('[data-verify]');
  if (verify) {
    if (!needAdmin()) return;
    const id = verify.dataset.verify;
    try { await window.Backend?.verify(id); } catch (err) { log(t('verify API: ') + err.message); }
    const l = LOTS.find(x => x.id === id);
    if (l) { l.verified = true; l.pending = false; persistCustom(); renderLots(); renderAdmin(); selectLot(l.id); toast(t('Лот верифицирован')); }
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
    const aid = approve.dataset.approve;
    try { await window.Backend?.approve(aid); } catch (err) { log(t('approve API: ') + err.message); }
    const l = LOTS.find(x => x.id === aid);
    if (l) {
      const m = aiModerate(l);
      l.pending = false;
      if (m.verdict === 'auto') l.verified = true;
      persistCustom(); renderLots(); renderAdmin(); selectLot(l.id);
      toast(t(m.verdict === 'reject' ? 'Опубликовано, но AI против — проверь' : 'Лот опубликован'));
    }
    return;
  }
  const adel = e.target.closest?.('[data-adel]');
  if (adel) {
    if (!needAdmin()) return;
    const id = adel.dataset.adel;
    try { await window.Backend?.remove(id); } catch (err) { log(t('delete API: ') + err.message); }
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
  const veto = e.target.closest?.('[data-veto]');
  if (veto) {
    try { const r = await window.Backend?.veto(veto.dataset.veto); toast(t(r?.vetoed ? 'Выплата заморожена вето' : 'Вето учтено'), r?.vetoed ? 'success' : undefined); }
    catch (err) { toast(t('Вето: ') + err.message, 'error'); }
    return;
  }
  const buy = e.target.closest?.('[data-buy]');
  if (buy) { e.stopPropagation(); onInvest(buy.dataset.buy); return; }
  const fc = e.target.closest?.('[data-feed]');
  if (fc) { openLot(fc.dataset.feed); return; }
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
function chipRowWire(attr, apply) {
  document.querySelectorAll(`[${attr}]`).forEach(c => c.addEventListener('click', () => {
    const row = c.parentElement;
    if (row) row.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    apply(c);
    renderFeed();
    haptic('light');
  }));
}
chipRowWire('data-f', (c) => { lotFormat = c.dataset.f; });
chipRowWire('data-s', (c) => { lotStage = c.dataset.s; });
document.querySelector('[data-v]')?.addEventListener('click', (e) => {
  const c = e.currentTarget;
  lotVerifiedOnly = !lotVerifiedOnly;
  c.classList.toggle('active', lotVerifiedOnly);
  renderFeed();
  haptic('light');
});
$('#sellCancel')?.addEventListener('click', () => { $('#sellModal').hidden = true; });
$('#sellModal')?.addEventListener('click', (e) => { if (e.target.id === 'sellModal') e.target.hidden = true; });
$('#adminClose')?.addEventListener('click', () => { $('#adminModal').hidden = true; });
$('#adminModal')?.addEventListener('click', (e) => { if (e.target.id === 'adminModal') e.target.hidden = true; });
function readSellForm() {
  const pick = (v, list, fb) => list.includes(v) ? v : fb;
  return {
    title: $('#sellTitle').value.trim().slice(0, 80),
    logo: $('#sellLogo').value.trim().slice(0, 300),
    loc: $('#sellLoc').value.trim().slice(0, 60),
    desc: $('#sellDesc').value.trim().slice(0, 2000),
    stage: pick($('#sellStage').value, ['idea', 'live'], 'idea'),
    format: pick($('#sellFormat').value, ['online', 'offline', 'hybrid'], 'online'),
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
    const draft = { title: f.title || t('Без названия'), desc: f.desc || '', price: (f.priceNum > 0 ? f.priceNum : 0) + ' TON', goal: (f.goalNum > 0 ? f.goalNum : 0) + ' TON', loc: f.loc };
    box.hidden = false;
    box.outerHTML = aiHtml(aiModerate(draft)).replace('class="ai-verdict', 'id="aiPreview" class="ai-verdict');
  });
});
$('#sellSubmit')?.addEventListener('click', async () => {
  const f = readSellForm();
  if (!f.title || !(f.priceNum > 0)) { toast(t('Заполни название и цену акции')); return; }
  if (!Number.isFinite(f.priceNum) || f.priceNum > 1000000) { toast(t('Цена акции нереальна (максимум 1 000 000 TON)')); return; }
  if (Number.isFinite(f.goalNum) && f.goalNum > 1000000000) { toast(t('Цель нереальна (максимум 1 000 000 000 TON)')); return; }
  if (!f.desc || f.desc.length < 20) { toast(t('Опиши идею подробнее (от 20 символов)')); return; }
  const nano = String(Math.round(f.priceNum * 1e9));
  const lot = { id: 'my' + Date.now(), title: f.title, desc: f.desc, price: f.priceNum + ' TON', nano, tag: f.stage === 'live' ? 'работает' : 'идея', grad: GRADS[LOTS.length % GRADS.length], mine: true, logo: f.logo || f.title.slice(0, 1), stage: f.stage, format: f.format, loc: f.loc || 'Онлайн', goal: (f.goalNum > 0 ? f.goalNum : f.priceNum) + ' TON', verified: false, pending: true };
  const m = aiModerate(lot);
  if (m.verdict === 'reject') {    const box = $('#aiPreview');
    if (box) { box.hidden = false; box.outerHTML = aiHtml(m).replace('class="ai-verdict', 'id="aiPreview" class="ai-verdict'); }
    toast(t('AI-модер отклонил: {x}', { x: m.reasons[0] || t('высокий риск') }), 'error');
    return;
  }
  if (window.Backend) {
    try {
      const created = await window.Backend.createLot(lot);
      const s = sanitizeLot(created);
      if (s) { LOTS.unshift(s); if (created._trust) s._trust = sanitizeTrust(created._trust); }
    } catch (e) { LOTS.unshift(lot); saveCustom(lot); log(t('create API fallback: ') + e.message); }
  } else { LOTS.unshift(lot); saveCustom(lot); }
  $('#sellModal').hidden = true;
  ['sellTitle', 'sellLogo', 'sellLoc', 'sellDesc', 'sellGoal', 'sellPrice'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderAdmin();
  toast(t(m.verdict === 'auto' ? 'AI пропустил, ждёт галочки админа' : 'Отправлено на модерацию'));
});
$('#copyAddr')?.addEventListener('click', async () => {
  haptic('light');
  try { await navigator.clipboard.writeText(CONFIG.recipient); toast(t('Адрес скопирован')); }
  catch (_) { toast(CONFIG.recipient); }
});

async function bootstrapFromBackend() {
  if (!window.Backend) return false;
  try {
    const lots = await window.Backend.lots();
    if (!Array.isArray(lots) || !lots.length) return false;
    LOTS.length = 0;
    for (const raw of lots) {
      const s = sanitizeLot(raw);
      if (!s) continue;
      if (raw._trust) s._trust = sanitizeTrust(raw._trust);
      s.mine = false;
      LOTS.push(s);
    }
    // merge local pending drafts (not yet approved on server)
    try {
      const custom = JSON.parse(localStorage.getItem('capiton_lots') || '[]');
      if (Array.isArray(custom)) for (const c of custom) {
        const s = sanitizeLot(c);
        if (s && !LOTS.some(l => l.id === s.id)) LOTS.push(s);
      }
    } catch (_) {}
    log(t('lots loaded from API: ') + LOTS.length);
    return true;
  } catch (e) { log(t('API offline, local LOTS fallback: ') + e.message); return false; }
}

renderLots();
selectLot('lot1');
bootstrapFromBackend().then((ok) => {
  if (!ok) return;
  renderLots();
  if (!LOTS.some(l => selectedLot && l.id === selectedLot.id)) selectLot(LOTS[0]?.id);
  else { renderLots(); renderTrust(); }
  if (isAdmin()) renderAdmin();
});

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

applyTheme('light'); // white theme only, no toggle
$('#langBtn')?.addEventListener('click', () => { haptic('light'); setLang(LANG === 'en' ? 'ru' : 'en'); });
initTelegram();
refreshAvatar();
document.querySelectorAll('#tabbar .tab').forEach(t =>
  t.addEventListener('click', () => switchView(t.dataset.view)));
$('#lotClose')?.addEventListener('click', closeLot);
$('#lotModal')?.addEventListener('click', (e) => { if (e.target.id === 'lotModal') closeLot(); });
if (!inTG) {
  if (!tg) {
    // Desktop browser without Telegram: dev-preview, don't block the UI.
    // Real restriction (TG WebView without initData) still shows the gate below.
    const gate = $('#tgOnly');
    if (gate) gate.hidden = true;
    document.body.classList.remove('locked');
    log(t('dev-preview в браузере: заглушка скрыта'));
  } else {
    const gate = $('#tgOnly');
    if (gate) gate.hidden = false;
    document.body.classList.add('locked');
  }
}
refreshAdminVisibility();
syncMainButton();
$('#year').textContent = new Date().getFullYear();
applyLang(); // translate static markup if LANG=en + initial render
log(t('app.js loaded (mini-app ready)'));
