import {$,esc,pad,MN,ic} from './util.js';
import {T,cur,S,user} from './state.js';
const tone=(h,icn,cls='ico')=>`<span class="tone ${cls}" style="--h:${h}">${ic(icn)}</span>`;
function toast(m,undo){const t=$('#toast');t.innerHTML=`<div class="toast" role="status">${esc(m)}${undo?'<button id="undo">Undo</button>':''}</div>`;clearTimeout(toast.h);toast.h=setTimeout(()=>t.innerHTML='',undo?5000:2200);if(undo)$('#undo').onclick=()=>{undo();t.innerHTML=''}}
const money=n=>{const a=Math.abs(n),w=Math.floor(a),c=Math.round((a-w)*100);return(n<0?'−':'')+'₱'+w.toLocaleString('en-PH')+(c?`<small>.${pad(c)}</small>`:'')};
function topbar(title,sub,nomon){const who=user&&user.email?user.email.split('@')[0]:'You',mon=nomon?'':`<div class="mon"><button data-m="-1" aria-label="Previous month">${ic('l','sm')}</button><span>${MN[cur.m]} ${cur.y}</span><button data-m="1" aria-label="Next month">${ic('r','sm')}</button></div>`;return `<div class="top"><div><h1 class="serif">${title}</h1><small>${sub}</small></div><div class="topr">${mon}<div class="user"><span class="av">${esc(who.slice(0,1).toUpperCase())}</span><span><b>${esc(who)}</b><small>${esc(user?user.email:'')}</small></span></div></div></div>`}
export {tone,toast,money,topbar};
