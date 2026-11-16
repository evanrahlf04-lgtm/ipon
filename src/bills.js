// Payables: bills repeat monthly or happen once. Each month a bill shows up as one "occurrence"
// that can be paid in parts. Payments are expense transactions tagged with billId and bm (the month they settle).
import {S,now} from './state.js';
import {pad,ds,MN,peso} from './util.js';

const mkey=(y,m)=>{const d=new Date(y,m,1);return`${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const dayIn=(y,m)=>new Date(y,m+1,0).getDate();
const todayKey=()=>ds(now.getFullYear(),now.getMonth(),now.getDate());
const dayDiff=(a,b)=>Math.round((new Date(a+'T00:00')-new Date(b+'T00:00'))/864e5);

// Money paid toward one month of one bill. Old data had no billId, so migrated bills also count
// any expense in their category that month.
// A payment marked full (or any payment on a migrated bill, as before) settles the month even if it is less than the bill.
function paidFor(b,key){let a=0,full=false;S.tx.forEach(t=>{if(t.type!=='expense')return;
 if(t.billId){if(t.billId===b.id&&(t.bm||t.date.slice(0,7))===key){a+=t.amount;if(t.full)full=true}}
 else if(b.lg&&t.catId===b.catId&&t.date.startsWith(key)){a+=t.amount;full=true}});return{a:Math.round(a*100)/100,full}}

// One bill in one month, or null when it does not apply (before it starts, after it ends, skipped).
function occ(b,y,m){const key=mkey(y,m);
 if((b.skip||[]).includes(key))return null;
 let date;
 if(b.rep==='once'){if(!b.date||!b.date.startsWith(key))return null;date=b.date}
 else{if(b.from&&key<b.from)return null;if(b.end&&key>b.end)return null;date=ds(y,m,Math.min(b.due||1,dayIn(y,m)))}
 const pf=paidFor(b,key),paid=pf.a,rem=pf.full?0:Math.max(0,Math.round((b.amount-paid)*100)/100),td=todayKey(),days=dayDiff(date,td);
 return{b,key,y,m,date,amt:b.amount,paid,rem,days,part:paid>0&&rem>0,st:rem<=0?'paid':days<0?'late':days===0?'today':'soon'}}

const byDate=(a,c)=>a.date.localeCompare(c.date)||a.b.name.localeCompare(c.b.name);
const monthOcc=(y,m)=>S.bills.map(b=>occ(b,y,m)).filter(Boolean).sort(byDate);

// Unpaid and past due, from any earlier month up to today (looks back at most 24 months).
function overdue(){const out=[],cy=now.getFullYear(),cm=now.getMonth(),base=cy*12+cm;
 S.bills.forEach(b=>{
  if(b.rep==='once'){const d=b.date?new Date(b.date+'T00:00'):null;if(d){const o=occ(b,d.getFullYear(),d.getMonth());if(o&&o.st==='late')out.push(o)}return}
  for(let i=base-24;i<=base;i++){const o=occ(b,Math.floor(i/12),i%12);if(o&&o.st==='late')out.push(o)}});
 return out.sort(byDate)}

// Unpaid bills falling in the next N days, counting today.
function upcoming(n){const out=[],base=now.getFullYear()*12+now.getMonth();
 for(let i=base;i<=base+2;i++){monthOcc(Math.floor(i/12),i%12).forEach(o=>{if(o.rem>0&&o.days>=0&&o.days<=n)out.push(o)})}
 return out.sort(byDate)}

// Everything still owed this month, including earlier months that were never paid.
function dueLeft(){const y=now.getFullYear(),m=now.getMonth();
 return overdue().filter(o=>o.key!==mkey(y,m)).reduce((a,o)=>a+o.rem,0)+monthOcc(y,m).reduce((a,o)=>a+o.rem,0)}

function label(o){
 const part=o.part?` · ${rs(o.rem)} left`:'';
 if(o.st==='paid')return'Paid';
 if(o.st==='late')return`Overdue ${-o.days} day${o.days===-1?'':'s'}${part}`;
 if(o.st==='today')return`Due today${part}`;
 return(o.days<=31?`Due in ${o.days} day${o.days===1?'':'s'}`:`Due ${dateTxt(o.date)}`)+part}
const rs=n=>peso(n);
const dateTxt=d=>{const x=new Date(d+'T00:00');return`${MN[x.getMonth()]} ${x.getDate()}`};
// Keep a category's budget large enough to cover its monthly bills.
function fitBudget(id){const c=S.cats.find(x=>x.id===id);if(!c)return;const t=S.bills.filter(x=>x.catId===id&&x.rep==='monthly').reduce((a,x)=>a+x.amount,0);if(c.budget<t)c.budget=t}
const billsInCat=id=>S.bills.filter(b=>b.catId===id);
export {fitBudget,mkey,paidFor,occ,monthOcc,overdue,upcoming,dueLeft,label,dateTxt,billsInCat};
