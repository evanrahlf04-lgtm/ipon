// Money plan: matches income against bills, debt payments, everyday spending and goals,
// for the month on screen and the next three months. Everything here is an estimate from your own data.
import {S,now,cur,mk,calc,incomeRef,grpOf,cat,budgetOf} from './state.js';
import {monthOcc,overdue} from './bills.js';
import {withBal,simulate} from './debts.js';
import {peso,MF} from './util.js';

const idx=(y,m)=>y*12+m,ym=i=>[Math.floor(i/12),((i%12)+12)%12];
const sum=(l,f)=>l.reduce((a,x)=>a+f(x),0);

// What to save each month to reach a dated goal. Goals with no date add nothing.
function goalNeed(g){
 if(g.saved>=g.target||!g.date)return 0;
 const days=(new Date(g.date+'T00:00')-now)/864e5,months=Math.max(1,Math.ceil(days/30.44));
 return Math.ceil((g.target-g.saved)/months)}

// Goals that do not already save through a monthly bill.
const unbilled=()=>S.goals.filter(g=>!S.bills.some(b=>b.goalId===g.id));

// Average spending per category over the last 3 months that have any data.
function avgBy(){
 const out={};let n=0;
 for(let i=1;i<=3;i++){const[y,m]=ym(idx(now.getFullYear(),now.getMonth())-i),k=mk(y,m);
  if(!S.tx.some(t=>t.date.startsWith(k)))continue;n++;
  S.tx.forEach(t=>{if(t.type==='expense'&&t.date.startsWith(k))out[t.catId]=(out[t.catId]||0)+t.amount})}
 Object.keys(out).forEach(k=>{out[k]/=n});return{avg:out,n}}

// Splits one month of commitments into bills, debt payments, everyday budgets and savings.
function buckets(occ){
 const bc=new Set(S.bills.map(b=>b.catId)),b={bills:0,debt:0,everyday:0,savings:0};
 occ.forEach(o=>{if(o.b.goalId)b.savings+=o.amt;else if(o.b.debtId||grpOf(cat(o.b.catId))==='debt')b.debt+=o.amt;else b.bills+=o.amt});
 S.cats.filter(c=>!bc.has(c.id)).forEach(c=>{const g=grpOf(c),bg=budgetOf(c);if(g==='debt')b.debt+=bg;else if(g==='save')b.savings+=bg;else b.everyday+=bg});
 b.savings+=sum(unbilled(),goalNeed);return b}

function monthPlan(){
 const s=calc(),occ=monthOcc(cur.y,cur.m),b=buckets(occ),total=b.bills+b.debt+b.everyday+b.savings;
 return{income:s.income,s,...b,total,left:s.income-total}}

// 50/30/20 check: what you spent (and planned) in needs, wants, and savings plus debt.
function split(s,income){
 const g={need:{plan:0,act:0},want:{plan:0,act:0},sd:{plan:0,act:0}};
 S.cats.forEach(c=>{const k=grpOf(c),t=k==='need'?'need':k==='want'?'want':'sd';g[t].plan+=budgetOf(c);g[t].act+=s.by[c.id]||0});
 return g}

// Budget against what was spent, plus the 3-month average so habitual overspending shows up.
function catRows(s){
 const{avg}=avgBy();
 return S.cats.map(c=>({c,b:budgetOf(c),sp:s.by[c.id]||0,avg:avg[c.id]||0})).filter(r=>r.b>0||r.sp>0||r.avg>0).sort((a,b)=>(b.sp-b.b)-(a.sp-a.b))}

// The next three months: expected income against known bills, usual everyday spending and goals.
function forecast(){
 const{avg,n}=avgBy(),bc=new Set(S.bills.map(b=>b.catId)),goals=sum(unbilled(),goalNeed),inc=S.tax.track?incomeRef():S.income;
 const usualFor=(y,m)=>sum(S.cats.filter(c=>!bc.has(c.id)),c=>n?(avg[c.id]||0):budgetOf(c,y,m));
 const rows=[];let run=0;
 for(let i=1;i<=3;i++){const[y,m]=ym(idx(now.getFullYear(),now.getMonth())+i),occ=monthOcc(y,m),oblig=sum(occ,o=>o.amt),usual=usualFor(y,m);
  const net=inc-oblig-usual-goals;run+=net;rows.push({y,m,inc,oblig,usual,goals,net,run,n:occ.length})}
 return{rows,hist:n}}

function insights(p,f){
 const out=[],P=v=>peso(Math.round(v)),od=overdue(),ds=withBal(S.debts).filter(d=>d.cur>.005);
 if(od.length)out.push({cls:'late',i:'alert',t:`${od.length} bill${od.length>1?'s are':' is'} overdue, ${P(sum(od,o=>o.rem))} in total. Pay or skip them on the Payables page.`});
 if(p.income>0&&p.left<0)out.push({cls:'late',i:'alert',t:`This month's plan is ${P(-p.left)} more than your income. Trim everyday budgets or move a goal date out.`});
 const bad=f.rows.find(r=>r.net<0);
 if(bad)out.push({cls:'late',i:'alert',t:`${MF[bad.m]} looks ${P(-bad.net)} short once bills, usual spending and goals are counted.`});
 const mins=sum(ds,d=>d.min||0),ref=incomeRef();
 if(ref>0&&mins>0){const r=mins/ref*100;if(r>=36)out.push({cls:'late',i:'alert',t:`Debt minimums take ${Math.round(r)}% of your income. Above about 36% is hard to sustain, so a payoff plan matters.`});else if(r>=20)out.push({cls:'',i:'cal',t:`Debt minimums take ${Math.round(r)}% of your income. Worth keeping an eye on.`})}
 const over=p.s&&S.cats.filter(c=>grpOf(c)!=='save'&&budgetOf(c)>0&&(p.s.by[c.id]||0)>budgetOf(c)).sort((a,b)=>(p.s.by[b.id]||0)/budgetOf(b)-(p.s.by[a.id]||0)/budgetOf(a)).slice(0,2);
 if(over&&over.length)out.push({cls:'late',i:'alert',t:over.map(c=>`${c.name} is ${P((p.s.by[c.id]||0)-budgetOf(c))} over budget`).join(', ')+' this month.'});
 const habit=catRows(p.s).filter(r=>r.b>0&&r.avg>r.b*1.1&&r.sp<=r.b).slice(0,2);
 habit.forEach(r=>out.push({cls:'',i:'cal',t:`${r.c.name} usually costs ${P(r.avg)} a month against a ${P(r.b)} budget. Raise the budget or cut back.`}));
 unbilled().forEach(g=>{const need=goalNeed(g);if(need>0&&p.left<need&&p.income>0&&p.left>=0)out.push({cls:'',i:'target',t:`${g.name} needs about ${P(need)} a month, and only ${P(p.left)} is unassigned after your plan.`})});
 if(p.left>=500&&p.income>0){
  if(ds.length){const x=Math.floor(p.left/100)*100,a=simulate(ds,0,S.debtPlan.method),b=simulate(ds,x,S.debtPlan.method);
   out.push({cls:'ok',i:'check',x,t:a.ok&&b.ok?`About ${P(p.left)} a month is unassigned. Using ${P(x)} of it on debt clears everything about ${Math.max(0,a.months-b.months)} months sooner and saves around ${P(Math.max(0,a.interest-b.interest))} in interest.`:`About ${P(p.left)} a month is unassigned. Putting it on debt would speed up payoff.`})}
  else out.push({cls:'ok',i:'check',t:`About ${P(p.left)} a month is unassigned. Give it a job: a goal, an emergency fund, or a higher budget where you overspend.`})}
 if(S.tax.track){const v=Array.from({length:6},(_,i)=>{const[y,m]=ym(idx(now.getFullYear(),now.getMonth())-i);return S.pay.filter(x=>x.paid&&x.date.startsWith(mk(y,m))).reduce((a,x)=>a+x.net,0)}).filter(x=>x>0);
  if(v.length>=2){const av=sum(v,x=>x)/v.length,lo=Math.min(...v);if(lo<av*.7)out.push({cls:'',i:'cal',t:`Your lowest month was ${P(lo)}, ${Math.round((1-lo/av)*100)}% below your average of ${P(av)}. Budget on the low figure and keep a buffer for lean months.`})}}
 if(!out.length)out.push({cls:'ok',i:'check',t:'Nothing needs attention. Your plan matches your income.'});
 return out}

export{monthPlan,split,catRows,forecast,insights,goalNeed};
