import {esc,peso,MN,MF,ic} from '../util.js';
import {now,cur,S,mk,paySum} from '../state.js';
import {tone,topbar,monHtml,fold} from '../ui.js';
import {tax,takeHome} from './tax.js';
import {KINDS,OPTS,yearOf,monthPay,waiting,quarters,taxPaid,dayDiff} from '../pay.js';

const dt=d=>{const x=new Date(d+'T00:00');return`${MN[x.getMonth()]} ${x.getDate()}`};
const sum=(l,k='net')=>l.reduce((a,p)=>a+p[k],0);

function row(p){
 const k=KINDS[p.kind]||KINDS.other,late=!p.paid&&p.due&&dayDiff(p.due)<0;
 const st=p.paid?'Received':!p.due?'Waiting for payment':late?`Late ${-dayDiff(p.due)} days`:dayDiff(p.due)===0?'Expected today':`Expected ${dt(p.due)}`;
 return `<div class="pb ${p.paid?'':'wait'} ${late?'late':''}">${tone(p.kind==='freelance'?205:p.kind==='salary'?68:140,k[1])}<button class="n" data-editpay="${p.id}"><b>${esc(p.src||k[0])}</b><span class="${late?'over':''}">${k[0]} · ${dt(p.date)}${p.paid?'':' · invoiced'} · ${st}${p.note?' · '+esc(p.note):''}</span></button><div class="am ${p.paid?'in':''}">${p.paid?'+':''}${peso(p.net)}${p.gross>p.net?`<small>of ${peso(p.gross)} gross</small>`:''}</div><div class="pa2">${p.paid?'':`<button class="btn sm" data-recv="${p.id}">Mark received</button>`}</div></div>`}

function taxPanel(y){
 const o=S.tax.fopt||'8',q=quarters(y,o),paid=taxPaid(y),left=Math.max(0,q.tax-paid);
 const opts=Object.entries(OPTS).map(([k,v])=>`<option value="${k}" ${o===k?'selected':''}>${v}</option>`).join('');
 return fold('ftax'+y,`Freelancer tax ${y}`,'',`<div style="margin-bottom:12px"><button class="btn sm" data-act="taxpay">${ic('plus','sm')}Tax payment</button></div>
 <label class="fld" style="margin-bottom:14px">Tax option you chose<select id="fopt">${opts}</select></label>
 <div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><div class="tile t-lime"><small>Receipts so far</small><div><b class="serif">${peso(Math.round(q.receipts))}</b><em>freelance, received in ${y}</em></div></div><div class="tile t-mint"><small>Tax estimate</small><div><b class="serif">${peso(Math.round(q.tax))}</b><em>on receipts so far</em></div></div><div class="tile t-pink"><small>Still to set aside</small><div><b class="serif">${peso(Math.round(left))}</b><em>${peso(Math.round(paid))} paid so far</em></div></div></div>
 <div style="margin-top:14px">${q.rows.map(r=>{const d=dayDiff(r.due),past=d<0;return `<div class="pr"><span class="l"><span class="dot" style="background:${past?'var(--ink);opacity:.25':'var(--lime)'}"></span><span><b>${r.q} · ${r.span}</b><small>${r.q==='Annual'?'Annual return':'Quarterly return'} due ${dt(r.due)} · ${past?'passed':d===0?'today':'in '+d+' days'} · receipts ${peso(Math.round(r.inQ))}</small></span></span><b>${r.add>0?'Set aside '+peso(Math.round(r.add)):'Nothing new'}</b></div>`}).join('')}</div>
 <p class="note" style="margin-top:12px">Estimate only. Quarterly returns use receipts so far this year, and the tax option you pick in your first quarterly return applies for the whole year. Use the Tax payment button to record what you paid, and confirm amounts with the BIR or an accountant.</p>`,'Freelancer tax')}

function tracker(){
 const y=cur.y,list=monthPay(cur.y,cur.m).filter(p=>p.paid),recv=paySum(cur.y,cur.m),wait=waiting(),waitSum=sum(wait);
 const ytd=sum(yearOf(y)),emp=S.tax.mode==='employee'&&S.tax.gross>0?takeHome(S.tax):0,salaryIn=sum(list.filter(p=>p.paid&&p.kind==='salary'));
 const mons=Array.from({length:12},(_,i)=>({i,v:paySum(y,i)})).filter(x=>x.v>0),mx=Math.max(1,...mons.map(x=>x.v));
 const src={};yearOf(y).forEach(p=>{const k=p.src||(KINDS[p.kind]||KINDS.other)[0];src[k]=(src[k]||0)+p.net});
 const srcs=Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,6),hasFree=S.pay.some(p=>p.kind==='freelance')||S.tax.mode==='freelance';
 return `<section class="panel fade" data-sec="Summary"><div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><div class="tile t-lime"><small>Received in ${MF[cur.m]}</small><div><b class="serif">${peso(Math.round(recv))}</b><em>${emp&&salaryIn?`salary ${peso(Math.round(salaryIn))} of about ${peso(Math.round(emp))} expected`:'logged as received'}</em></div></div><div class="tile t-mint"><small>Waiting to be paid</small><div><b class="serif">${peso(Math.round(waitSum))}</b><em>${wait.length?wait.length+' invoice'+(wait.length>1?'s':''):'nothing outstanding'}</em></div></div><div class="tile t-pink"><small>Received in ${y}</small><div><b class="serif">${peso(Math.round(ytd))}</b><em>${mons.length?'about '+peso(Math.round(ytd/mons.length))+' a month':'nothing logged yet'}</em></div></div></div>
 <div class="checks" style="margin-top:14px"><label class="chk"><input type="checkbox" id="ttrack" ${S.tax.track?'checked':''}>Use the pay I log as my monthly income</label></div>
 <p class="note" style="margin-top:8px">${S.tax.track?'Your Overview, budgets and report use what you logged as received each month. A month with nothing logged shows zero income.':'Off: your income is the fixed amount you set. Turn this on if your pay changes from month to month, such as freelance work.'}</p></section>
 <section class="panel fade" data-sec="${MF[cur.m]}"><div class="sec"><h2>Pay log · ${MF[cur.m]}</h2><button class="btn sm" data-act="addpay">${ic('plus','sm')}Log pay</button></div>${list.length?list.map(row).join(''):`<div class="empty">${ic('wallet','lg')}Nothing logged for ${MF[cur.m]}. Log each payday or client payment to see what you really earn.<button class="btn" data-act="addpay">${ic('plus','sm')}Log pay</button></div>`}</section>
 ${wait.length?`<section class="panel fade" data-sec="Waiting"><div class="sec"><h2>Waiting to be paid</h2><span class="mute">${peso(Math.round(waitSum))}</span></div>${wait.map(row).join('')}</section>`:''}
 ${mons.length?fold('year'+y,`${y} so far`,'received',`<div class="hl">${mons.map(x=>`<div class="hr"><div style="grid-column:1/-1"><div class="t"><span>${MF[x.i]}</span><span>${peso(Math.round(x.v))}</span></div><div class="bar"><i style="width:${x.v/mx*100}%;background:var(--accent)"></i></div></div></div>`).join('')}</div>${srcs.length>1?`<div class="sec" style="margin-top:18px"><h2 style="font-size:16px">By source</h2></div>${srcs.map(([k,v])=>`<div class="pr"><span>${esc(k)}</span><b>${peso(Math.round(v))}</b></div>`).join('')}`:''}`,y):''}
 ${hasFree?taxPanel(y):''}`}

let tab='calc';
const setStab=v=>{tab=v},getStab=()=>tab;
function salary(){const t=tab==='track';
 return topbar('Salary',t?'Log what you actually receive and track freelance tax':'Your pay, take-home and Philippine tax for 2026 · estimate',!t,true)+`<div class="trow"><div class="seg" id="stab"><button data-stab="calc" class="${t?'':'on'}">Calculator</button><button data-stab="track" class="${t?'on':''}">Pay log</button></div>${t?monHtml():''}</div>`+(t?tracker():tax())}
export{salary,setStab,getStab};
