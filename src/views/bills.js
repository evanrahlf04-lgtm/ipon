import {esc,peso,MF,ic} from '../util.js';
import {cur,S,cat} from '../state.js';
import {tone,topbar,monHtml,fold} from '../ui.js';
import {debts} from './debts.js';
import {mkey,monthOcc,overdue,upcoming,label,dateTxt} from '../bills.js';

const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');
const repText=b=>b.rep==='once'?`One-time · ${dateTxt(b.date)}`:`Every month on the ${ord(b.due)}`;

// One bill for one month, with its payment progress and buttons.
function row(o){
 const c=cat(o.b.catId),late=o.st==='late',pct=o.amt?Math.min(100,o.paid/o.amt*100):0,id=`${o.b.id}|${o.key}`;
 const acts=o.rem>0
  ?`<button class="btn sm" data-payopen="${id}">Pay</button>${late&&o.b.rep!=='once'?`<button class="btn sm g" data-skip="${id}" title="Mark this month as not owed">Skip</button>`:''}`
  :`<button class="btn sm g" data-lastpay="${id}">${ic('check','sm')}Paid</button>`;
 return `<div class="pb ${late?'late':''} ${o.st==='paid'?'done':''}">${tone(c.hue,c.icon)}<button class="n" data-editbill="${o.b.id}"><b>${esc(o.b.name)}</b><span class="${late?'over':''}">${dateTxt(o.date)}${o.b.rep==='once'?' · One-time':''} · ${label(o)}</span>${o.part?`<div class="bar"><i style="width:${pct}%;background:hsl(${c.hue} 75% 48%)"></i></div>`:''}</button><div class="am">${peso(o.rem>0?o.rem:o.amt)}${o.part?`<small>of ${peso(o.amt)}</small>`:''}</div><div class="pa2">${acts}</div></div>`}

const list=(os,empty)=>os.length?os.map(row).join(''):`<div class="empty">${ic('check','lg')}${empty}</div>`;
const sum=(os,k)=>os.reduce((a,o)=>a+o[k],0);

function billsBody(){
 const month=monthOcc(cur.y,cur.m),key=mkey(cur.y,cur.m),carried=overdue().filter(o=>o.key!==key),soon=upcoming(30);
 const due=sum(month,'amt'),paid=month.reduce((a,o)=>a+Math.min(o.paid,o.amt),0),left=sum(month,'rem'),over=sum(overdue(),'rem'),nOver=overdue().length;
 return  (S.bills.length?'':`<section class="panel fade" data-nojump><div class="empty">${ic('cal','lg')}No bills yet. Add rent, utilities, loans or any payment with a due date and Tally will track what is paid and what is late.<button class="btn" data-act="addbill">${ic('plus','sm')}Add your first bill</button></div></section>`)+
 `<section class="panel fade" data-sec="Summary"><div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(min(100%,184px),1fr))"><div class="tile t-lime"><small>Due in ${MF[cur.m]}</small><div><b class="serif">${peso(due)}</b><em>${month.length} bill${month.length===1?'':'s'}</em></div></div><div class="tile t-mint"><small>Paid so far</small><div><b class="serif">${peso(paid)}</b><em>${due?Math.round(paid/due*100):0}% of this month</em></div></div><div class="tile t-pink"><small>Still to pay</small><div><b class="serif">${peso(left)}</b><em>this month</em></div></div><div class="tile ${over?'t-late':'t-lilac'}"><small>Overdue now</small><div><b class="serif">${peso(over)}</b><em>${nOver?nOver+' unpaid, all months':'nothing overdue'}</em></div></div></div></section>`+
 (carried.length?`<section class="panel fade" data-sec="Overdue"><div class="sec"><h2>Unpaid from earlier months</h2><span class="mute">${peso(sum(carried,'rem'))}</span></div><p class="note" style="margin:-4px 0 8px">Pay these or tap Skip if you did not owe them that month.</p>${carried.map(row).join('')}</section>`:'')+
 `<section class="panel fade" data-sec="${MF[cur.m]}"><div class="sec"><h2>${MF[cur.m]} bills</h2><button class="btn sm" data-act="addbill">${ic('plus','sm')}Bill</button></div>${list(month,'No bills due this month.')}</section>`+
 `<section class="panel fade" data-sec="Next 30 days"><div class="sec"><h2>Due in the next 30 days</h2><span class="mute">${peso(sum(soon,'rem'))} to pay</span></div>${list(soon,'Nothing due in the next 30 days.')}</section>`+
 (S.bills.length?fold('allbills','All bills',`${S.bills.length} set up`,`${S.bills.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(b=>{const c=cat(b.catId);return `<button class="pb" data-editbill="${b.id}">${tone(c.hue,c.icon)}<div class="n"><b>${esc(b.name)}</b><span>${repText(b)} · ${esc(c.name)}${b.end?' · ends '+b.end:''}</span></div><div class="am">${peso(b.amount)}</div><span class="go">${ic('edit','sm')}</span></button>`}).join('')}`):'');
}
let ptab='bills';
const setPtab=v=>{ptab=v},getPtab=()=>ptab;
function bills(){const d=ptab==='debts';
 return topbar('Payables',d?'Debts, interest and how to pay them off':`Bills, due dates and what you still owe · ${MF[cur.m]} ${cur.y}`,d,true)+`<div class="trow"><div class="seg" id="ptab"><button data-ptab="bills" class="${d?'':'on'}">Bills</button><button data-ptab="debts" class="${d?'on':''}">Debts</button></div>${d?'':monHtml()}</div>`+(d?debts():billsBody())}
export {bills,setPtab,getPtab};
