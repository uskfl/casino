import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyCPNGc7YPQMp5rSFieGfpGzAlHYoaBZuDg",
authDomain: "casino-2af36.firebaseapp.com",
projectId: "casino-2af36",
storageBucket: "casino-2af36.firebasestorage.app",
messagingSenderId: "264494327310",
appId: "1:264494327310:web:a8b4d1660daaab1cef7e5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function reg(e,p){return createUserWithEmailAndPassword(auth,e,p)}
export function log(e,p){return signInWithEmailAndPassword(auth,e,p)}
export function out(){return signOut(auth)}

export function watch(cb){return onAuthStateChanged(auth,cb)}

export async function initUser(u){
const ref = doc(db,"users",u.uid);
const snap = await getDoc(ref);
if(!snap.exists()){
await setDoc(ref,{balance:1000});
}
}

export function watchUser(uid,cb){
return onSnapshot(doc(db,"users",uid),s=>cb(s.data()));
}

export async function addBalance(uid,val){
const ref = doc(db,"users",uid);
const snap = await getDoc(ref);
await updateDoc(ref,{balance:(snap.data().balance||0)+val});
}