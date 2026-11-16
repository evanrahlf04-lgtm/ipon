import {esc,peso,MN,MF,ic,php,curCode} from '../util.js';
import {now,cur,S,mk,paySum,isBalance} from '../state.js';
import {tone,topbar,monHtml,fold} from '../ui.js';
import {tax,takeHome,pd} from './tax.js';
import {liveRate,liveInfo,liveStale,refreshLive,when,ATTR} from '../fx.js';
import {KINDS,OPTS,yearOf,monthPay,waiting,quarters,taxPaid,dayDiff} from '../pay.js';

const dt=d=>{const x=new Date(d+'T00:00');return`${MN[x.getMonth()]} ${x.getDate()}`};
const sum=(l,k='net')=>l.reduce((a,p)=>a+p[k],0);

// Money received in another currency: the original amount, and what it is worth today.
const foreign=p=>p.fx&&p.fx.c&&p.fx.c!==S.currency;
function liveLine(p){if(!foreign(p))return '';const r=liveRate(p.fx.c);
 return `<small>${esc(p.fx.c)} ${p.fx.a.toLocaleString('en-US')}${r?` · now ${peso(Math.round(p.fx.a*r*100)/100)}`:''}</small>`}
function otherCur(){
 const f=S.pay.filter(foreign);if(!f.length)return '';
 const info=liveInfo(),by={};
 f.forEach(p=>{const k=p.fx.c,g=by[k]||(by[k]={c:k,got:0,gotRec:0,gotNow:0,wait:0,waitNow:0,ok:true}),r=liveRate(k);
  if(!(r>0))g.ok=false;const now=r>0?p.fx.a*r:0;
  if(p.paid){g.got+=p.fx.a;g.gotRec+=p.net;g.gotNow+=now}else{g.wait+=p.fx.a;g.waitNow+=now}});
 const rows=Object.values(by).sort((a,b)=>(b.gotNow+b.waitNow)-(a.gotNow+a.waitNow)),all=rows.reduce((a,g)=>a+g.gotNow+g.waitNow,0);
 const d=g=>g.gotNow-g.gotRec,dd=g=>Math.abs(d(g))<.005?'<small>no change since you received it</small>':`<small class="${d(g)>=0?'':'over'}" style="${d(g)>=0?'color:var(--good)':''}">${d(g)>=0?'+':'−'}${peso(Math.abs(d(g)))} since you received it</small>`;
 return fold('othercur','Income in other currencies',info?`as of ${when(info.updated)}`:'getting rates…',
  rows.map(g=>`<div class="pr"><span class="l"><span><b>${esc(g.c)}</b><small>${g.got?`Received ${g.c} ${g.got.toLocaleString('en-US')} · counted as ${peso(g.gotRec)}`:''}${g.got&&g.wait?'<br>':''}${g.wait?`Waiting ${g.c} ${g.wait.toLocaleString('en-US')}`:''}</small></span></span><span style="text-align:right"><b>${g.ok?'≈ '+peso(g.gotNow+g.waitNow):'…'}</b>${g.ok&&g.got?dd(g):''}</span></div>`).join('')+
  `<div class="pr"><b>All other currencies today</b><b>${all?'≈ '+peso(all):'…'}</b></div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="fxrefresh">Refresh rates</button><span class="note">Your totals and budget use the amount counted when you received each payment. "Today" shows what it would be worth now. The rate provider publishes new rates once a day. ${ATTR}</span></div>`,'Other currencies')}
function row(p){
 const k=KINDS[p.kind]||KINDS.other,late=!p.paid&&p.due&&dayDiff(p.due)<0;
 const st=p.paid?'Received':!p.due?'Waiting for payment':late?`Late ${-dayDiff(p.due)} days`:dayDiff(p.due)===0?'Expected today':`Expected ${dt(p.due)}`;
 return `<div class="pb ${p.paid?'':'wait'} ${late?'late':''}">${tone(p.kind==='freelance'?205:p.kind==='salary'?68:140,k[1])}<button class="n" data-editpay="${p.id}"><b>${esc(p.src||k[0])}</b><span class="${late?'over':''}">${k[0]} · ${dt(p.date)}${p.paid?'':' · invoiced'} · ${st}${p.note?' · '+esc(p.note):''}</span></button><div class="am ${p.paid?'in':''}">${p.paid?'+':''}${peso(p.net)}${p.gross>p.net?`<small>of ${peso(p.gross)} gross</small>`:''}${liveLine(p)}</div><div class="pa2">${p.paid?'':`<button class="btn sm" data-recv="${p.id}">Mark received</button>`}</div></div>`}

function taxPanel(y){
 const o=S.tax.fopt||'8',q=quarters(y,o),paid=taxPaid(y),left=Math.max(0,q.tax-paid);
 const opts=Object.entries(OPTS).map(([k,v])=>`<option value="${k}" ${o===k?'selected':''}>${v}</option>`).join('');
 return fold('ftax'+y,`Freelancer tax ${y}`,'',`<div style="margin-bottom:12px"><button class="btn sm" data-act="taxpay">${ic('plus','sm')}Tax payment</button></div>
 <label class="fld" style="margin-bottom:14px">Tax option you chose<select id="fopt">${opts}</select></label>
 <div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(min(100%,184px),1fr))"><div class="tile t-lime"><small>Receipts so far</small><div><b class="serif">${pd(q.receipts)}</b><em>freelance, received in ${y}</em></div></div><div class="tile t-mint"><small>Tax estimate</small><div><b class="serif">${pd(q.tax)}</b><em>on receipts so far</em></div></div><div class="tile t-pink"><small>Still to set aside</small><div><b class="serif">${pd(left)}</b><em>${pd(paid)} paid so far</em></div></div></div>
 <div style="margin-top:14px">${q.rows.map(r=>{const d=dayDiff(r.due),past=d<0;return `<div class="pr"><span class="l"><span class="dot" style="background:${past?'var(--ink);opacity:.25':'var(--lime)'}"></span><span><b>${r.q} · ${r.span}</b><small>${r.q==='Annual'?'Annual return':'Quarterly return'} due ${dt(r.due)} · ${past?'passed':d===0?'today':'in '+d+' days'} · receipts ${pd(r.inQ)}</small></span></span><b>${r.add>0?'Set aside '+pd(r.add):'Nothing new'}</b></div>`}).join('')}</div>
 <p class="note" style="margin-top:12px">${curCode()!=='PHP'?'Tax is worked out in pesos and shown in your currency at today\'s rate. ':''}Estimate only. Quarterly returns use receipts so far this year, and the tax option you pick in your first quarterly return applies for the whole year. Use the Tax payment button to record what you paid, and confirm amounts with the BIR or an accountant.</p>`,'Freelancer tax')}

function tracker(){
 if(S.pay.some(foreign)&&liveStale())refreshLive().then(()=>import('../render.js').then(m=>m.render())).catch(()=>{});
 const y=cur.y,list=monthPay(cur.y,cur.m).filter(p=>p.paid),recv=paySum(cur.y,cur.m),wait=waiting(),waitSum=sum(wait);
 const ytd=sum(yearOf(y)),emp=S.tax.mode==='employee'&&S.tax.gross>0?takeHome(S.tax):0,salaryIn=sum(list.filter(p=>p.paid&&p.kind==='salary'));
 const mons=Array.from({length:12},(_,i)=>({i,v:paySum(y,i)})).filter(x=>x.v>0),mx=Math.max(1,...mons.map(x=>x.v));
 const src={};yearOf(y).forEach(p=>{const k=p.src||(KINDS[p.kind]||KINDS.other)[0];src[k]=(src[k]||0)+p.net});
 const srcs=Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,6),hasFree=S.pay.some(p=>p.kind==='freelance')||S.tax.mode==='freelance';
 return `<section class="panel fade" data-sec="Summary"><div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(min(100%,184px),1fr))"><div class="tile t-lime"><small>Received in ${MF[cur.m]}</small><div><b class="serif">${peso(recv)}</b><em>${emp&&salaryIn?`salary ${peso(salaryIn)} of about ${peso(emp)} expected`:'logged as received'}</em></div></div><div class="tile t-mint"><small>Waiting to be paid</small><div><b class="serif">${peso(waitSum)}</b><em>${wait.length?wait.length+' invoice'+(wait.length>1?'s':''):'nothing outstanding'}</em></div></div><div class="tile t-pink"><small>Received in ${y}</small><div><b class="serif">${peso(ytd)}</b><em>${mons.length?'about '+peso(ytd/mons.length)+' a month':'nothing logged yet'}</em></div></div></div>
 ${isBalance()?'<p class="note" style="margin-top:14px">Pay you log here is added to your balance, which started from your starting amount. Change that from the account menu.</p></section>':`<div class="checks" style="margin-top:14px"><label class="chk"><input type="checkbox" id="ttrack" ${S.tax.track?'checked':''}>Use the pay I log as my monthly income</label></div>
 <p class="note" style="margin-top:8px">${S.tax.track?'Your Overview, budgets and report use what you logged as received each month. A month with nothing logged shows zero income.':'Off: your income is the fixed amount you set. Turn this on if your pay changes from month to month, such as freelance work.'}</p></section>`}
 <section class="panel fade" data-sec="${MF[cur.m]}"><div class="sec"><h2>Pay log · ${MF[cur.m]}</h2><button class="btn sm" data-act="addpay">${ic('plus','sm')}Log pay</button></div>${list.length?list.map(row).join(''):`<div class="empty">${ic('wallet','lg')}Nothing logged for ${MF[cur.m]}. Log each payday or client payment to see what you really earn.<button class="btn" data-act="addpay">${ic('plus','sm')}Log pay</button></div>`}</section>
 ${wait.length?`<section class="panel fade" data-sec="Waiting"><div class="sec"><h2>Waiting to be paid</h2><span class="mute">${peso(waitSum)}</span></div>${wait.map(row).join('')}</section>`:''}
 ${otherCur()}
 ${mons.length?fold('year'+y,`${y} so far`,'received',`<div class="hl">${mons.map(x=>`<div class="hr"><div style="grid-column:1/-1"><div class="t"><span>${MF[x.i]}</span><span>${peso(x.v)}</span></div><div class="bar"><i style="width:${x.v/mx*100}%;background:var(--accent)"></i></div></div></div>`).join('')}</div>${srcs.length>1?`<div class="sec" style="margin-top:18px"><h2 style="font-size:16px">By source</h2></div>${srcs.map(([k,v])=>`<div class="pr"><span>${esc(k)}</span><b>${peso(v)}</b></div>`).join('')}`:''}`,y):''}
 ${hasFree?taxPanel(y):''}`}

let tab='calc';
const setStab=v=>{tab=v},getStab=()=>tab;
function salary(){const t=tab==='track';
 return topbar('Salary',t?'Log what you actually receive and track freelance tax':'Your pay, take-home and Philippine tax for 2026 · estimate',!t,true)+`<div class="trow"><div class="seg" id="stab"><button data-stab="calc" class="${t?'':'on'}">Calculator</button><button data-stab="track" class="${t?'on':''}">Pay log</button></div>${t?monHtml():''}</div>`+(t?tracker():tax())}
export{salary,setStab,getStab};
