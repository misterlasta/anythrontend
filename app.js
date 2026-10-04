        const CONFIG = {
            manifestUrl: 'https://misterlasta.github.io/anythrontend/tonconnect-manifest.json'
        };

        const $ = (s) => document.querySelector(s);
        const tg = window.Telegram?.WebApp || null;
        const inTG = !!tg?.initData;

        let LOTS = [];
        let selectedLot = null;
        let lotFilter = '';
        let lotSort = 'pop';
        let isAdmin = false;

        function toast(text, type = 'success') {
            const toastEl = $('#toast');
            if (toastEl) {
                toastEl.textContent = text;
                toastEl.classList.add('show');
                setTimeout(() => toastEl.classList.remove('show'), 2600);
            }
            try { if (inTG) tg.showAlert(text); } catch (_) {}
        }

        function haptic(type = 'light') {
            try { tg?.HapticFeedback?.impactOccurred?.(type); } catch (_) {}
        }

        function setStatus(text) {
            const st = $('#status');
            if (st) st.textContent = text;
        }

        function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&gt;').replace(/"/g, '&quot;'); }

        function initTelegram() {
            if (!tg) return;
            tg.ready();
            tg.expand();
            try { tg.disableVerticalSwipes?.(); } catch (_) {}
            
            if (tg.initDataUnsafe?.user) {
                const u = tg.initDataUnsafe.user;
                $('#tg-user').innerHTML = `👋 <b>${esc(u.first_name)}</b> <span>Mini App</span>`;
                $('#tg-user').hidden = false;
            }
            if (!inTG) {
                $('#tgOnly').hidden = false;
                document.body.classList.add('locked');
            }
        }
        initTelegram();

        let tonConnectUI = null;
        if (window.TON_CONNECT_UI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: CONFIG.manifestUrl,
                buttonRootId: 'ton-connect',
            });
            tonConnectUI.onStatusChange((w) => {
                if (w) { setStatus('Кошелёк подключён'); haptic('light'); } 
                else { setStatus('Кошелёк отключён'); }
                syncMainButton();
            });
        }

        function syncMainButton() {
            if (!tg?.MainButton || !inTG) return;
            if (selectedLot) {
                tg.MainButton.setText('Купить за ' + selectedLot.price + ' TON');
                tg.MainButton.show();
                if (!tonConnectUI?.connected) tg.MainButton.disable();
                else tg.MainButton.enable();
            } else {
                tg.MainButton.hide();
            }
        }

        try { tg?.MainButton?.onClick?.(() => { haptic('medium'); onInvest(); }); } catch (_) {}

        function renderLots() {
            const grid = $('#lotsGrid');
            if (!grid) return;
            
            let vis = LOTS.filter(l => !l.pending && (l.title + ' ' + (l.desc || '')).toLowerCase().includes(lotFilter));
            
            if (lotSort === 'cheap') vis.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            if (lotSort === 'exp') vis.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

            grid.innerHTML = vis.map(l => `
                <div class="lot ${selectedLot?.id === l.id ? 'selected' : ''}" data-id="${esc(l.id)}">
                    <div class="lot-cover" style="background:${l.grad || 'linear-gradient(135deg,#1a73e8,#7c5cff)'}"><span>${esc(l.tag || 'лот')}</span></div>
                    <div class="lot-body">
                        <div class="lot-top"><h3>${esc(l.title)}${l.verified ? ' ✓' : ''}</h3></div>
                        <p>${esc(l.desc)}</p>
                        <div class="lot-foot">
                            <span class="lot-price">${esc(l.price)} TON</span>
                            <button class="lot-buy" data-buy="${esc(l.id)}">Купить</button>
                        </div>
                    </div>
                </div>`).join('') || '<p>Актуальных лотов пока нет.</p>';
        }

        function selectLot(id) {
            selectedLot = LOTS.find(l => l.id === id) || LOTS[0];
            if (!selectedLot) return;
            
            $('#lotTitle').innerHTML = esc(selectedLot.title) + (selectedLot.verified ? ' ✓' : '');
            $('#lotDesc').textContent = selectedLot.desc;
            $('#lotPrice').textContent = selectedLot.price + ' TON';
            
            const btn = $('#investBtn');
            if (btn) {
                btn.textContent = `Купить за ${selectedLot.price} TON`;
                btn.disabled = false;
            }
            
            renderLots();
            renderTrust(selectedLot);
            syncMainButton();
            haptic('light');
        }

        function renderTrust(lot) {
            const box = $('#trustBox');
            if (!box || !lot || !lot.trust || !lot.trust.milestones) { box.innerHTML = ''; return; }
            
            const t = lot.trust;
            box.innerHTML = `
                <div class="trust-head">Эскроу транши</div>
                ${t.milestones.map((m, i) => `
                    <div class="ms-item">
                        <b>${esc(m.title)} · ${m.pct}% ${m.released ? '(Выдано)' : '(В сейфе)'}</b>
                        <div class="ms-sub">За ${m.yes} / против ${m.no}</div>
                        ${!m.released ? `
                            <div class="admin-row">
                                <button class="abtn ok" data-vote-yes="${esc(lot.id)}:${i}">За транш</button>
                                <button class="abtn no" data-vote-no="${esc(lot.id)}:${i}">Против</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            `;
        }

        async function onInvest() {
            if (!selectedLot) return;
            if (!tonConnectUI?.connected) { toast('Подключите кошелёк TON', 'warning'); return; }
            
            const recipient = selectedLot.wallet; 
            
            if (!recipient) {
                 toast('Кошелек получателя не настроен для этого лота', 'warning');
                 return;
            }

            const amountNano = Math.round(parseFloat(selectedLot.price) * 1e9).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 120,
                messages: [{ address: recipient, amount: amountNano }],
            };

            try {
                $('#investBtn').disabled = true;
                setStatus('Подтвердите транзакцию в кошельке...');
                
                const result = await tonConnectUI.sendTransaction(transaction);
                
                if (window.Backend && typeof window.Backend.invest === 'function') {
                    await window.Backend.invest(selectedLot.id, result.boc);
                }
                
                setStatus('Успешно! Доля куплена.');
                toast('Транзакция отправлена');
            } catch (e) {
                setStatus('Отменено пользователем или ошибка кошелька.');
                console.error(e);
            } finally {
                $('#investBtn').disabled = false;
            }
        }

        $('#sellSubmit')?.addEventListener('click', async () => {
            const title = $('#sellTitle').value.trim();
            const desc = $('#sellDesc').value.trim();
            const price = parseFloat($('#sellPrice').value);
            
            if (!title || !price || !desc) { toast('Заполните обязательные поля'); return; }

            const draft = { title, desc, price };

            if (window.Backend && typeof window.Backend.createLot === 'function') {
                try {
                    setStatus('Отправка на модерацию...');
                    await window.Backend.createLot(draft);
                    toast('Сбор отправлен на модерацию');
                    $('#sellModal').hidden = true;
                    bootstrapFromBackend(); 
                } catch (e) { toast('Ошибка сервера', 'error'); }
            } else {
                 toast('Демо: Логика бэкенда не подключена. Лот не сохранен.');
                 $('#sellModal').hidden = true;
            }
        });

        document.addEventListener('click', async (e) => {
            const vy = e.target.closest?.('[data-vote-yes]');
            if (vy) {
                const [id, mi] = vy.dataset.voteYes.split(':');
                if (window.Backend && typeof window.Backend.vote === 'function') {
                    await window.Backend.vote(id, mi, 'yes');
                    bootstrapFromBackend(); 
                } else { toast('Демо: Голосование требует сервера'); }
                return;
            }
            
            const buy = e.target.closest?.('[data-buy]');
            if (buy) { e.stopPropagation(); selectLot(buy.dataset.buy); onInvest(); return; }
            
            const card = e.target.closest?.('.lot');
            if (card) selectLot(card.dataset.id);
            
            if (e.target.closest?.('#openSell')) $('#sellModal').hidden = false;
            if (e.target.closest?.('#sellCancel')) $('#sellModal').hidden = true;
        });

        $('#search')?.addEventListener('input', (e) => { lotFilter = e.target.value.toLowerCase(); renderLots(); });
        document.querySelectorAll('.chip[data-sort]').forEach(c => c.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
            c.classList.add('active');
            lotSort = c.dataset.sort;
            renderLots();
        }));

        async function bootstrapFromBackend() {
            if (window.Backend && typeof window.Backend.getLots === 'function') {
                try {
                    const response = await window.Backend.getLots();
                    LOTS = response.lots || [];
                    isAdmin = response.is_admin || false;
                    
                    if (isAdmin) $('#openAdmin').style.display = 'block';
                } catch (e) {
                    console.error('Ошибка загрузки лотов с сервера', e);
                }
            } else {
                // Демо-данные, если бэкенд недоступен
                LOTS = [
                    {
                        id: 'demo1', title: 'Мурманская УЗВ-ферма', desc: 'Строительство комплекса в Мурманске. Производство рыбы.',
                        price: '100', verified: true, tag: 'RWA', wallet: 'UQC_placeholder_address_replace_with_backend_data',
                        grad: 'linear-gradient(135deg, #1e3c72, #2a5298)',
                        trust: { milestones: [{ title: 'Закупка материалов', pct: 20, yes: 0, no: 0, released: false }] }
                    },
                    {
                        id: 'demo2', title: 'Технохаб Baza', desc: 'Создание коворкинга для IT-стартапов в центре Москвы.',
                        price: '15', verified: false, tag: 'Real Estate', wallet: 'UQC_placeholder_address_replace_with_backend_data',
                        grad: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
                        trust: { milestones: [{ title: 'Аренда помещения', pct: 50, yes: 5, no: 1, released: true }] }
                    }
                ];
            }
            
            renderLots();
            if (LOTS.length > 0 && !selectedLot) selectLot(LOTS[0].id);
            else if (selectedLot) selectLot(selectedLot.id);
        }

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
                    ctx.fillStyle = `rgba(200,210,235,${p.o * 0.5})`;
                    ctx.fill();
                }
                for (let i = 0; i < pts.length; i += 3) {
                    for (let j = i + 1; j < i + 4 && j < pts.length; j++) {
                        const a = pts[i], b = pts[j];
                        const d = Math.hypot(a.x - b.x, a.y - b.y);
                        if (d < 130) {
                            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                            ctx.strokeStyle = `rgba(200,210,235,${(1 - d / 130) * .15})`;
                            ctx.stroke();
                        }
                    }
                }
                requestAnimationFrame(frame);
            })();
        })();

        document.querySelectorAll('.faq-item').forEach((item) => {
            item.querySelector('.faq-q')?.addEventListener('click', () => {
                haptic('light');
                const open = item.classList.contains('open');
                document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
                if (!open) item.classList.add('open');
            });
        });

        document.querySelector('#themeToggle')?.addEventListener('click', () => {
            haptic('light');
            const root = document.documentElement;
            const cur = root.dataset.theme === 'dark' ? 'light' : 'dark';
            root.dataset.theme = cur;
        });

        // Запуск
        bootstrapFromBackend();
