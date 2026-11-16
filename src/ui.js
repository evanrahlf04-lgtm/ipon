import {$,esc,pad,MN,ic} from './util.js';
import {T,cur,S,user} from './state.js';
const tone=(h,icn,cls='ico')=>`<span class="tone ${cls}" style="--h:${h}">${ic(icn)}</span>`;
function toast(m,undo){const t=$('#toast');t.innerHTML=`<div class="toast" role="status">${esc(m)}${undo?'<button id="undo">Undo</button>':''}</div>`;clearTimeout(toast.h);const hide=()=>{const e=t.firstElementChild;if(!e)return;e.classList.add('out');setTimeout(()=>{if(t.firstElementChild===e)t.innerHTML=''},200)};toast.h=setTimeout(hide,undo?5000:2400);if(undo)$('#undo').onclick=()=>{undo();clearTimeout(toast.h);hide()}}
const money=n=>{const a=Math.abs(n),w=Math.floor(a),c=Math.round((a-w)*100);return(n<0?'−':'')+'₱'+w.toLocaleString('en-PH')+(c?`<small>.${pad(c)}</small>`:'')};
const monHtml=()=>`<div class="mon"><button data-m="-1" aria-label="Previous month">${ic('l','sm')}</button><span>${MN[cur.m]} ${cur.y}</span><button data-m="1" aria-label="Next month">${ic('r','sm')}</button></div>`;
// tabbed: the page has a tab row, so on phones the month stepper moves down onto that row.
// Collapsible panel. Open by default on wide screens and closed on phones, and it remembers what you toggled.
const foldState={};
const fold=(id,title,right,inner,sec)=>{const open=id in foldState?foldState[id]:innerWidth>=861;return `<details class="panel fade fold" data-sec="${esc(sec||title)}" data-fold="${id}" ${open?'open':''}><summary class="sec"><h2>${title}</h2><span class="mute">${right||''}</span><span class="chev" aria-hidden="true">${ic('sel','sm')}</span></summary>${inner}</details>`};
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.fold)foldState[d.dataset.fold]=d.open},true);
function topbar(title,sub,nomon,tabbed){const who=user&&user.email?user.email.split('@')[0]:'You',mon=nomon?'':monHtml();return `<div class="top${tabbed?' tabbed':''}"><div class="tt"><h1 class="serif">${title}</h1><small>${sub}</small></div>${mon}<button class="user" data-act="account" aria-label="Account"><span class="av">${esc(who.slice(0,1).toUpperCase())}</span><span class="un"><b>${esc(who)}</b><small>${esc(user?user.email:'')}</small></span></button></div>`}
export {tone,toast,money,topbar,monHtml,fold};
