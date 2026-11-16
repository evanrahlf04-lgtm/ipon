// Debts: a balance, an annual rate and a monthly minimum. Each debt with a minimum gets a linked monthly bill,
// so its due date shows up in Payables. Payments are expense transactions tagged with debtId.
// Balance = the balance you entered, plus a month of interest for each month that passed, minus payments.
import {S,now,save} from './state.js';
import {uid,HUES} from './util.js';
import {mkey,fitBudget} from './bills.js';

const r2=n=>Math.round(n*100)/100;
const mi=key=>+key.slice(0,4)*12+ +key.slice(5,7)-1;
const nowIdx=()=>now.getFullYear()*12+now.getMonth();

function balance(d){
 let bal=d.bal0,last=mi(d.asOf);
 const charge=to=>{while(last<to){bal+=Math.max(0,bal)*(d.apr||0)/1200;last++}};
 S.tx.filter(t=>t.debtId===d.id&&t.type==='expense'&&t.date>=d.asOf).sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>{charge(mi(t.date));bal=Math.max(0,bal-t.amount)});
 charge(nowIdx());
 return r2(Math.max(0,bal))}

const withBal=ds=>ds.map(d=>({...d,cur:balance(d)}));

// Month-by-month payoff. Every month all minimums are paid, then the rest of the budget
// (minimums plus extra) goes to one debt at a time: highest rate first, or smallest balance first.
function simulate(list,extra,method){
 const b=list.map(d=>({id:d.id,bal:d.cur,apr:d.apr||0,min:d.min||0,done:0}));
 const total=b.reduce((a,x)=>a+x.min,0)+extra;let months=0,interest=0;
 while(b.some(x=>x.bal>.005)&&months<600){
  months++;
  b.forEach(x=>{if(x.bal>0){const i=x.bal*x.apr/1200;x.bal+=i;interest+=i}});
  let pool=total;
  b.forEach(x=>{if(x.bal>0){const p=Math.min(x.min,x.bal,pool);x.bal-=p;pool-=p}});
  const order=b.filter(x=>x.bal>.005).sort(method==='snowball'?(a,c)=>a.bal-c.bal:(a,c)=>c.apr-a.apr||a.bal-c.bal);
  for(const x of order){if(pool<=0)break;const p=Math.min(pool,x.bal);x.bal-=p;pool-=p}
  b.forEach(x=>{if(x.bal<=.005&&!x.done){x.done=months;x.bal=0}})}
 return{months,interest:r2(interest),done:Object.fromEntries(b.map(x=>[x.id,x.done])),ok:!b.some(x=>x.bal>.005)}}

const debtCat=()=>{let c=S.cats.find(x=>/^debt/i.test(x.name));if(!c){c={id:uid(),name:'Debt payments',budget:0,due:0,icon:'bank',hue:HUES[S.cats.length%HUES.length]};S.cats.push(c)}return c.id};

// Create or update the monthly bill behind a debt's minimum payment.
function linkBill(d){
 let b=S.bills.find(x=>x.debtId===d.id);
 if(!(d.min>0)){if(b)S.bills=S.bills.filter(x=>x!==b);return}
 const cid=b?b.catId:debtCat();
 if(!b){b={id:uid(),rep:'monthly',catId:cid,debtId:d.id,from:mkey(now.getFullYear(),now.getMonth()+(d.due>=now.getDate()?0:1))};S.bills.push(b)}
 Object.assign(b,{name:d.name,amount:d.min,due:d.due,end:''});
 fitBudget(cid)}

// When a payment clears the balance, stop the monthly bill so it is not reported overdue.
function settleDebt(id){
 const d=S.debts.find(x=>x.id===id);if(!d||balance(d)>.005)return false;
 const b=S.bills.find(x=>x.debtId===id);if(b)b.end=mkey(now.getFullYear(),now.getMonth());return true}

const addDebt=d=>{S.debts.push(d);linkBill(d);save()};
export{balance,withBal,simulate,linkBill,settleDebt,addDebt,debtCat,nowIdx};
