const app = {
    // UI State
    init() {
        this.bindNav();
        this.bindModals();
        this.initCrash();
        this.initRoulette();
        
        // Secret Feature
        document.getElementById('daily-case-btn').addEventListener('click', () => this.openDailyCase());
        document.getElementById('promo-btn').addEventListener('click', () => this.openModal('promo-modal'));
        document.getElementById('activate-promo-btn').addEventListener('click', () => this.activatePromo());
    },

    bindNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchScreen(e.target.dataset.target);
            });
        });
    },

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => s.classList.add('hidden'), 50); // small delay for opacity fade
        });
        const target = document.getElementById(screenId);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 10);
    },

    openModal(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id).classList.add('hidden'); },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- GAME: CRASH ---
    crashState: { isPlaying: false, multiplier: 1.00, timer: null, crashed: false, bet: 0 },
    initCrash() {
        const canvas = document.getElementById('crash-canvas');
        const ctx = canvas.getContext('2d');
        const btn = document.getElementById('crash-action-btn');
        const multEl = document.getElementById('crash-multiplier');
        
        const resize = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; };
        window.addEventListener('resize', resize);
        resize();

        btn.addEventListener('click', () => {
            if(!this.crashState.isPlaying && !this.crashState.crashed) this.startCrash(ctx, canvas, multEl, btn);
            else if(this.crashState.isPlaying) this.cashoutCrash(btn);
        });
    },

    startCrash(ctx, canvas, multEl, btn) {
        const betInput = document.getElementById('crash-bet');
        this.crashState.bet = parseFloat(betInput.value);
        if(isNaN(this.crashState.bet) || this.crashState.bet <= 0) return this.showToast('Неверная ставка', 'error');
        
        // Тут должна быть проверка баланса через Firebase (см. firebase-logic.js)
        window.dispatchEvent(new CustomEvent('placeBet', { detail: { amount: this.crashState.bet } }));

        this.crashState.isPlaying = true;
        this.crashState.crashed = false;
        this.crashState.multiplier = 1.00;
        multEl.classList.remove('crashed');
        btn.innerText = 'Забрать';
        btn.classList.replace('btn-primary', 'btn-secondary');

        // Рандомная точка краша (классическая формула)
        const crashPoint = Math.max(1.00, (0.99 / Math.random())).toFixed(2);
        let time = 0;

        const draw = () => {
            if(this.crashState.crashed) return;
            time += 16; // approx 60fps
            this.crashState.multiplier = Math.pow(Math.E, 0.00006 * time);
            
            if(this.crashState.multiplier >= crashPoint) {
                this.triggerCrash(multEl, btn, crashPoint);
                return;
            }

            multEl.innerText = this.crashState.multiplier.toFixed(2) + 'x';
            
            // Draw Graph (Green Line + Gradient)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            const x = (time / 10000) * canvas.width; 
            const y = canvas.height - ((this.crashState.multiplier - 1) / 5) * canvas.height;
            ctx.quadraticCurveTo(x/2, canvas.height, x, y);
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#00FF66';
            ctx.stroke();
            
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,255,102,0.3)');
            gradient.addColorStop(1, 'rgba(0,255,102,0)');
            ctx.lineTo(x, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.fillStyle = gradient;
            ctx.fill();

            this.crashState.timer = requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
    },

    triggerCrash(multEl, btn, crashPoint) {
        this.crashState.crashed = true;
        this.crashState.isPlaying = false;
        multEl.innerText = crashPoint + 'x';
        multEl.classList.add('crashed');
        btn.innerText = 'Поставить';
        btn.classList.replace('btn-secondary', 'btn-primary');
        this.showToast(`Крэш на ${crashPoint}x`, 'error');
        setTimeout(() => { this.crashState.crashed = false; ctx.clearRect(0,0, canvas.width, canvas.height); multEl.innerText = "1.00x"; }, 3000);
    },

    cashoutCrash(btn) {
        this.crashState.isPlaying = false;
        const won = (this.crashState.bet * this.crashState.multiplier).toFixed(2);
        window.dispatchEvent(new CustomEvent('winBet', { detail: { amount: parseFloat(won) } }));
        btn.innerText = 'Ожидание...';
        this.showToast(`Вы забрали ${won}$ (${this.crashState.multiplier.toFixed(2)}x)`, 'success');
    },

    // --- GAME: ROULETTE ---
    initRoulette() {
        const tape = document.getElementById('roulette-tape');
        // Генерируем ленту (100 элементов для эффекта прокрутки)
        let html = '';
        const sequence = ['gray', 'green', 'dark', 'gray', 'dark']; // Pattern
        for(let i=0; i<100; i++) {
            const color = sequence[i % sequence.length];
            html += `<div class="r-block r-${color}" data-color="${color}">${color === 'green' ? '14x' : '2x'}</div>`;
        }
        tape.innerHTML = html;

        let selectedColor = null;
        document.querySelectorAll('.btn-bet').forEach(b => {
            b.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-bet').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedColor = e.target.dataset.color;
                this.spinRoulette(selectedColor, tape);
            });
        });
    },

    spinRoulette(betColor, tape) {
        const betInput = document.getElementById('roulette-bet');
        const betAmt = parseFloat(betInput.value);
        if(!betAmt || betAmt <= 0) return this.showToast('Неверная ставка', 'error');
        
        window.dispatchEvent(new CustomEvent('placeBet', { detail: { amount: betAmt } }));

        // Рандомизируем исход (упрощенно)
        const resultRand = Math.random();
        let winningColor = resultRand < 0.05 ? 'green' : (resultRand < 0.5 ? 'gray' : 'dark');
        
        // Ищем индекс блока с этим цветом примерно в середине ленты (индексы 40-60)
        const targetBlocks = Array.from(tape.children).map((el, i) => ({el, color: el.dataset.color, index: i}));
        const possibleTargets = targetBlocks.filter(b => b.color === winningColor && b.index > 40 && b.index < 60);
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        // Анимация кручения
        const blockWidth = 80; // из CSS
        const targetOffset = -(target.index * blockWidth) + (tape.parentElement.clientWidth / 2) - (blockWidth / 2);
        
        tape.style.transition = 'none';
        tape.style.transform = `translateX(0px)`; // сброс
        
        setTimeout(() => {
            tape.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
            tape.style.transform = `translateX(${targetOffset}px)`;
        }, 50);

        setTimeout(() => {
            target.el.style.opacity = '0.5'; setTimeout(()=> target.el.style.opacity = '1', 200);
            if(winningColor === betColor) {
                const mult = winningColor === 'green' ? 14 : 2;
                window.dispatchEvent(new CustomEvent('winBet', { detail: { amount: betAmt * mult } }));
                this.showToast(`Вы выиграли ${betAmt * mult}$!`, 'success');
            } else {
                this.showToast(`Выпал ${winningColor}. Ставка сгорела.`, 'error');
            }
            document.querySelectorAll('.btn-bet').forEach(btn => btn.classList.remove('selected'));
        }, 4050);
    },

    // --- SECRET FEATURES ---
    openDailyCase() {
        const btn = document.getElementById('daily-case-btn');
        btn.style.animation = 'shake 0.3s';
        setTimeout(() => {
            btn.style.animation = 'pulseGlow 2s infinite';
            // Вспышка (Overlay)
            const flash = document.createElement('div');
            flash.className = 'flash-overlay';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 300);

            const amount = Math.floor(Math.random() * 90) + 10; // от 10 до 100
            window.dispatchEvent(new CustomEvent('winBet', { detail: { amount: amount } }));
            this.showToast(`Из кейса выпало ${amount}$!`, 'success');
        }, 300);
    },

    activatePromo() {
        const input = document.getElementById('promo-input');
        const code = input.value.trim().toUpperCase();
        
        const codes = {
            'IVYCRAFT': 1000,
            'ECOSCA': 500,
            'VIP67': 250
        };

        if(codes[code]) {
            window.dispatchEvent(new CustomEvent('winBet', { detail: { amount: codes[code] } }));
            this.showToast(`Промокод активирован! +${codes[code]}$`, 'success');
            this.closeModal('promo-modal');
        } else {
            this.showToast('Неверный код', 'error');
        }
        input.value = '';
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());