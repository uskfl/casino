import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Конфиг юзера
const firebaseConfig = {
  apiKey: "AIzaSyCPNGc7YPQMp5rSFieGfpGzAlHYoaBZuDg",
  authDomain: "casino-2af36.firebaseapp.com",
  projectId: "casino-2af36",
  storageBucket: "casino-2af36.firebasestorage.app",
  messagingSenderId: "264494327310",
  appId: "1:264494327310:web:a8b4d1660daaab1cef7e5f"
};

const appData = initializeApp(firebaseConfig);
const auth = getAuth(appData);
const db = getFirestore(appData);

// ID администратора для доступа в панель
const ADMIN_UID = "ТВОЙ_UID_АДМИНА_ИЗ_КОНСОЛИ"; 

let currentUser = null;

// UI Elements
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-pass');
const profileWidget = document.getElementById('user-profile');
const balanceEl = document.getElementById('balance-amount');
const emailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const navAdmin = document.getElementById('nav-admin');

// Auth Logic
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const pass = passInput.value;
    if(!email || !pass) return;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        if(e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            // Если нет, регистрируем
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                // Создаем док юзера
                await setDoc(doc(db, "users", cred.user.uid), {
                    email: email,
                    balance: 1000 // Начальный баланс
                });
            } catch(regErr) {
                alert(regErr.message);
            }
        } else {
            alert(e.message);
        }
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// Session State & Balance Listener
onAuthStateChanged(auth, (user) => {
    if(user) {
        currentUser = user;
        authModal.classList.add('hidden');
        profileWidget.classList.remove('hidden');
        emailEl.innerText = user.email.split('@')[0];

        // Слушаем баланс в реал-тайме
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if(docSnap.exists()) {
                const data = docSnap.data();
                // Эффект одометра (простая замена, JS анимация опциональна)
                balanceEl.innerText = Math.floor(data.balance); 
            }
        });

        if(user.uid === ADMIN_UID) {
            navAdmin.classList.remove('hidden');
            loadAdminPanel();
        }

    } else {
        currentUser = null;
        authModal.classList.remove('hidden');
        profileWidget.classList.add('hidden');
        navAdmin.classList.add('hidden');
    }
});

// Game Events (Связь app.js и Firebase)
window.addEventListener('placeBet', async (e) => {
    if(!currentUser) return;
    const amount = e.detail.amount;
    await updateDoc(doc(db, "users", currentUser.uid), { balance: increment(-amount) });
});

window.addEventListener('winBet', async (e) => {
    if(!currentUser) return;
    const amount = e.detail.amount;
    await updateDoc(doc(db, "users", currentUser.uid), { balance: increment(amount) });
});

// Admin Panel Logic (mocked fetch for client side simplicity, assuming open read rules for /users for demo)
async function loadAdminPanel() {
    const list = document.getElementById('admin-users-list');
    try {
        const snapshot = await getDocs(collection(db, "users"));
        let html = '';
        let total = 0;
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            total += data.balance;
            html += `
                <tr>
                    <td>${data.email} <br><small style="color:var(--text-muted)">${docSnap.id}</small></td>
                    <td class="text-green">${Math.floor(data.balance)}$</td>
                    <td>
                        <button class="btn-primary btn-sm" onclick="promptEdit('${docSnap.id}')">Edit</button>
                        <button class="btn-secondary btn-sm btn-danger">Ban</button>
                    </td>
                </tr>
            `;
        });
        
        // Инжект демо-юзеров (пасхалки) для полноты UI если БД пустая
        if(snapshot.size <= 1) {
            html += `<tr><td>ecosca@mail.ru</td><td class="text-green">54200$</td><td><button class="btn-secondary btn-sm">Edit</button></td></tr>`;
            html += `<tr><td>lovecult_fan@gmail.com</td><td class="text-green">10$</td><td><button class="btn-secondary btn-sm">Edit</button></td></tr>`;
        }

        list.innerHTML = html;
        document.getElementById('total-server-money').innerText = `${Math.floor(total)}$`;
    } catch (e) {
        list.innerHTML = '<tr><td colspan="3">Ошибка доступа к БД (Настрой правила Firestore)</td></tr>';
    }
}

// Global func for inline HTML admin button
window.promptEdit = async function(uid) {
    const sum = prompt("Введите сумму для добавления/вычитания:");
    if(sum && !isNaN(sum)) {
        await updateDoc(doc(db, "users", uid), { balance: increment(parseFloat(sum)) });
        loadAdminPanel(); // refresh
    }
}