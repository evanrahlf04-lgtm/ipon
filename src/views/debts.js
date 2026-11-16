import {esc,peso,MN,ic,sym} from '../util.js';
import {now,S,incomeRef} from '../state.js';
import {tone} from '../ui.js';
import {withBal,simulate} from '../debts.js';

const TYPES={card:['Credit card','bank'],loan:['Loan','building'],personal:['Personal / informal','heart'],other:['Other','tag']};
const dur=m=>{const y=Math.floor(m/12),r=m%12;return[y?`${y} yr${y>1?'s':''}`:'',r?`${r} mo${r>1?'s':''}`:''].filter(Boolean).join(' ')||'under a month'};
const when=m=>{const d=new Date(now.getFullYear(),now.getMonth()+m,1);return`${MN[d.getMonth()]} ${d.getFullYear()}`};

// The payoff planner result. Redrawn on its own while the extra amount is typed.
function planHtml(){
 const ds=withBal(S.debts).filter(d=>d.cur>.005),P=S.debtPlan;
 if(!ds.length)return '';
 const mine=simulate(ds,P.extra,P.method),base=simulate(ds,0,P.method),other=simulate(ds,P.extra,P.method==='snowball'?'avalanche':'snowball');
 if(!mine.ok)return `<p class="note">${base.ok?'':'The minimums alone do not cover the interest on at least one debt, so the balance never reaches zero. '}Adding more each month, or paying more than the minimum on the costliest debt, is the way out. Try a higher extra amount.</p>`;
 const names=Object.fromEntries(ds.map(d=>[d.id,d.name])),order=Object.entries(mine.done).sort((a,b)=>a[1]-b[1]);
 const saved=base.ok?Math.max(0,base.interest-mine.interest):null,sooner=base.ok?base.months-mine.months:null;
 const diff=Math.round(Math.abs(other.interest-mine.interest));
 return `<div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><div class="tile t-lime"><small>Debt-free</small><div><b class="serif">${when(mine.months)}</b><em>in ${dur(mine.months)}</em></div></div><div class="tile t-mint"><small>Total interest</small><div><b class="serif">${peso(Math.round(mine.interest))}</b><em>on top of what you owe now</em></div></div><div class="tile t-pink"><small>${P.extra?'Saved by paying extra':'Minimums only'}</small><div><b class="serif">${saved!=null&&P.extra?peso(Math.round(saved)):peso(Math.round(base.interest))}</b><em>${P.extra&&sooner>0?`interest, and ${dur(sooner)} sooner`:'interest if you pay just the minimums'}</em></div></div></div>
 <div class="hl" style="margin-top:14px">${order.map(([id,m],i)=>`<div class="pr"><span class="l"><span class="dot" style="background:var(--ink);opacity:${1-i*.12}"></span><span><b>${i+1}. ${esc(names[id])}</b><small>${P.method==='snowball'?'smallest balance first':'highest rate first'}</small></span></span><b>${when(m)}</b></div>`).join('')}</div>
 ${diff>=50?`<p class="note" style="margin-top:10px">${other.interest<mine.interest?`${P.method==='snowball'?'Avalanche':'Snowball'} would cost ${peso(diff)} less interest.`:`${P.method==='snowball'?'Snowball':'Avalanche'} saves ${peso(diff)} in interest over the other method.`} Snowball clears small debts sooner, which some people find easier to stick to.</p>`:''}
 <p class="note" style="margin-top:10px">Assumes you pay every minimum, put the extra amount toward one debt at a time, and roll each cleared debt's minimum into the next. Interest is estimated monthly.</p>`}

function debts(){
 const list=withBal(S.debts),owed=list.reduce((a,d)=>a+d.cur,0),mins=list.filter(d=>d.cur>.005).reduce((a,d)=>a+(d.min||0),0),int=list.reduce((a,d)=>a+d.cur*(d.apr||0)/1200,0),dti=incomeRef()?mins/incomeRef()*100:null;
 const dtiNote=dti==null?'set your income':dti<20?'comfortable':dti<36?'getting heavy':'high';
 const P=S.debtPlan,seg=(k,l)=>`<button type="button" data-dm="${k}" class="${P.method===k?'on':''}">${l}</button>`;
 if(!S.debts.length)return `<section class="panel fade" data-nojump><div class="empty">${ic('bank','lg')}No debts yet. Add credit cards, loans or money you owe someone. Ipon will track the balance, set the minimum payment as a bill with a due date, and show how to be debt-free sooner.<button class="btn" data-act="adddebt">${ic('plus','sm')}Add a debt</button></div></section>`;
 return `<section class="panel fade" data-sec="Summary"><div class="tiles" style="margin-top:0;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><div class="tile t-lime"><small>Total owed</small><div><b class="serif">${peso(Math.round(owed))}</b><em>${list.filter(d=>d.cur>.005).length} active debt${list.filter(d=>d.cur>.005).length===1?'':'s'}</em></div></div><div class="tile t-mint"><small>Minimums a month</small><div><b class="serif">${peso(Math.round(mins))}</b><em>${dti==null?'no income set':Math.round(dti)+'% of income · '+dtiNote}</em></div></div><div class="tile t-pink"><small>Interest this month</small><div><b class="serif">${peso(Math.round(int))}</b><em>estimated, across all debts</em></div></div></div><p class="note" style="margin-top:12px">A common guideline is to keep debt payments under 36% of income. Balances are estimates from the balance you entered, your payments and the interest rate. Update the balance from your latest statement to stay accurate.</p></section>
 <section class="panel fade" data-sec="Your debts"><div class="sec"><h2>${S.debts.length} debt${S.debts.length===1?'':'s'}</h2><button class="btn sm" data-act="adddebt">${ic('plus','sm')}Debt</button></div><div class="grid2">${list.map(d=>{
  const t=TYPES[d.type]||TYPES.other,orig=Math.max(d.orig||d.bal0,d.cur,1),p=Math.min(100,Math.max(0,(1-d.cur/orig)*100)),done=d.cur<=.005,one=done?null:simulate([d],0,'avalanche');
  const pace=done?{t:'Paid off',cls:'ok'}:one.ok?{t:`Debt-free by ${when(one.months)} at the minimum`,cls:''}:{t:'The minimum does not cover the interest',cls:'late'};
  return `<div class="bc"><div class="h">${tone(d.hue||356,t[1])}<button class="n" data-editdebt="${d.id}"><b>${esc(d.name)}</b><span class="s">${t[0]} · ${d.apr||0}% a year${d.min?` · min ${peso(d.min)}`:''}</span></button>${done?'':`<button class="btn sm g" data-paydebt="${d.id}">${ic('plus','sm')}Pay</button>`}</div><div class="bar"><i style="width:${p}%;background:var(--accent)"></i></div><div class="f"><span>${peso(d.cur)} left${orig>d.cur?` of ${peso(orig)}`:''}</span><span>${Math.round(p)}% paid</span></div><div class="pace ${pace.cls}">${ic(pace.cls==='late'?'alert':pace.cls==='ok'?'check':'cal','sm')}${pace.t}</div></div>`}).join('')}</div></section>
 ${list.some(d=>d.cur>.005)?`<section class="panel fade" data-sec="Payoff plan"><div class="sec"><h2>Payoff plan</h2></div><div class="hrow" style="align-items:center;margin-bottom:14px"><div class="seg">${seg('avalanche','Highest rate first')}${seg('snowball','Smallest first')}</div><label class="fld" style="max-width:240px">Extra each month (${sym()})<input id="dx" type="number" inputmode="decimal" min="0" step="any" value="${P.extra||''}" placeholder="0"></label></div><div id="planres">${planHtml()}</div></section>`:''}`}
export{debts,planHtml,TYPES};
