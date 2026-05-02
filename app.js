import { reg,log,watch,out,initUser,watchUser,addBalance } from "./firebase.js";

let user=null;
let balance=0;

loginBtn.onclick=()=>log(email.value,password.value);
regBtn.onclick=()=>reg(email.value,password.value);
logoutBtn.onclick=()=>out();

watch(async u=>{
if(u){
user=u;
await initUser(u);

watchUser(u.uid,data=>{
balance=data.balance;
document.getElementById("balance").innerText=balance;
});

document.getElementById("auth").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");
}
else{
location.reload();
}
});

window.openGame=(g)=>{
document.getElementById("game").classList.remove("hidden");
const el=document.getElementById("gameArea");

if(g=="crash") crash(el);
if(g=="roulette") roulette(el);
if(g=="slots") slots(el);
if(g=="coin") coin(el);
};

window.back=()=>document.getElementById("game").classList.add("hidden");

// CRASH
function crash(el){
el.innerHTML=`<h2>Crash</h2><button id='start'>Start</button><div id='mult'>1.00x</div>`;
let m=1;
let running=false;
let interval;

start.onclick=()=>{
running=true;
interval=setInterval(()=>{
m+=Math.random()*0.2;
document.getElementById("mult").innerText=m.toFixed(2)+"x";
if(Math.random()<0.02){clearInterval(interval);running=false;alert("CRASH!");}
},100);
};
}

// ROULETTE
function roulette(el){
el.innerHTML=`<h2>Roulette</h2><button id='spin'>Spin</button><div id='res'></div>`;
spin.onclick=()=>{
let r=[2,2,14,2][Math.floor(Math.random()*4)];
document.getElementById("res").innerText=r+"x";
};
}

// SLOTS
function slots(el){
el.innerHTML=`<h2>Slots</h2><button onclick='this.innerText="Spin...";setTimeout(()=>this.innerText=Math.random()>0.5?"WIN":"LOSE",800)'>Spin</button>`;
}

// COIN
function coin(el){
el.innerHTML=`<h2>CoinFlip</h2><button onclick='this.innerText=Math.random()>0.5?"HEADS":"TAILS"'>Flip</button>`;
}