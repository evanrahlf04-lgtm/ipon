// Validates budget data before the app uses it, whether it came from the server, the local cache or a backup file.
// Only known fields are kept, every field is coerced to a safe type, ids are limited to a safe character set,
// icons come from a fixed list and numbers are bounded. Text is stored as typed and escaped when it is drawn.
import {uid} from './util.js';

const ICONS=new Set(['home','wallet','target','chart','moon','search','plus','minus','out','in','down','up','edit','check','x','l','r','cal','alert','bus','house','bolt','drop','fork','coffee','building','shirt','wifi','bank','cart','tag','heart','phone','gift','logo','tax','bell','sel','flag','sun','logout','grid']);
const GROUPS=new Set(['need','want','save','debt']);
const MAXN=1e12,LIMIT={tx:50000,other:3000};
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const num=(v,lo,hi,d)=>{const n=typeof v==='string'&&v.trim()===''?NaN:Number(v);return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):d};
const int=(v,lo,hi,d)=>{const n=num(v,lo,hi,d);return n===undefined?undefined:Math.round(n)};
const str=(v,max)=>typeof v==='string'?v.slice(0,max):typeof v==='number'?String(v).slice(0,max):'';
const sid=v=>typeof v==='string'||typeof v==='number'?String(v).replace(/[^A-Za-z0-9_-]/g,'_').slice(0,40):'';
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';
const mon=v=>typeof v==='string'&&/^\d{4}-\d{2}$/.test(v)?v:'';
const pick=(v,set,d)=>set.includes(v)?v:d;
const list=(v,max)=>Array.isArray(v)?v.slice(0,max).filter(isObj):[];
// Sets only fields that have a value, so defaults applied later are not overwritten with undefined.
const put=(o,k,v)=>{if(v!==undefined&&v!==null)o[k]=v;return o};

// The original amount and currency of an entry that was converted.
const fx=v=>{if(!isObj(v))return null;const a=num(v.a,0,MAXN,undefined);return a!==undefined&&typeof v.c==='string'&&/^[A-Z]{3}$/.test(v.c)?{a,c:v.c}:null};
function cat(c){
 const o={id:sid(c.id)||uid(),name:str(c.name,60)||'Category',budget:num(c.budget,0,MAXN,0),due:int(c.due,0,31,0),icon:ICONS.has(c.icon)?c.icon:'tag',hue:int(c.hue,0,360,200)};
 if(GROUPS.has(c.grp))o.grp=c.grp;
 if(isObj(c.mb)){const mb={};Object.keys(c.mb).slice(0,240).forEach(k=>{const v=num(c.mb[k],0,MAXN,undefined);if(mon(k)&&v!==undefined)mb[k]=v});o.mb=mb}
 return o}
function tx(t){
 const type=pick(t.type,['expense','income'],''),date=day(t.date),amount=num(t.amount,0,MAXN,undefined);
 if(!type||!date||amount===undefined)return null;
 const o={id:sid(t.id)||uid(),date,type,catId:t.catId?sid(t.catId):null,amount,note:str(t.note,200)};
 if(t.billId)o.billId=sid(t.billId);if(mon(t.bm))o.bm=t.bm;if(t.debtId)o.debtId=sid(t.debtId);if(t.goalId)o.goalId=sid(t.goalId);
 if(t.full)o.full=1;if(t.taxPay)o.taxPay=1;const f=fx(t.fx);if(f)o.fx=f;return o}
function goal(g){
 const o={id:sid(g.id)||uid(),name:str(g.name,60)||'Goal',target:num(g.target,0,MAXN,0),saved:num(g.saved,0,MAXN,0),date:day(g.date),auto:num(g.auto,0,MAXN,0),autoDay:int(g.autoDay,0,31,0)};
 put(o,'base',num(g.base,-MAXN,MAXN,undefined));return o}
function bill(b){
 const o={id:sid(b.id)||uid(),name:str(b.name,60)||'Bill',amount:num(b.amount,0,MAXN,0),rep:pick(b.rep,['monthly','once'],'monthly'),due:int(b.due,0,31,0),date:day(b.date),catId:sid(b.catId),from:mon(b.from),end:mon(b.end)};
 if(Array.isArray(b.skip))o.skip=b.skip.slice(0,240).filter(mon);
 if(b.lg)o.lg=1;if(b.debtId)o.debtId=sid(b.debtId);if(b.goalId)o.goalId=sid(b.goalId);return o}
function debt(d){
 return{id:sid(d.id)||uid(),name:str(d.name,60)||'Debt',type:pick(d.type,['card','loan','personal','other'],'other'),apr:num(d.apr,0,1000,0),min:num(d.min,0,MAXN,0),due:int(d.due,0,31,0),hue:int(d.hue,0,360,356),bal0:num(d.bal0,0,MAXN,0),asOf:day(d.asOf),orig:num(d.orig,0,MAXN,0)}}
function pay(p){
 const date=day(p.date);if(!date)return null;
 const o={id:sid(p.id)||uid(),kind:pick(p.kind,['salary','freelance','other'],'other'),src:str(p.src,40),net:num(p.net,0,MAXN,0),gross:num(p.gross,0,MAXN,0),paid:!!p.paid,date,due:day(p.due),note:str(p.note,60)};const f=fx(p.fx);if(f)o.fx=f;return o}
function tax(t){
 if(!isObj(t))return undefined;
 const o={};
 if(t.mode==='employee'||t.mode==='freelance')o.mode=t.mode;
 if(typeof t.link==='boolean')o.link=t.link;
 if(typeof t.track==='boolean')o.track=t.track;
 if(typeof t.th==='boolean')o.th=t.th;
 if(['8','osd','full'].includes(t.fopt))o.fopt=t.fopt;
 ['gross','dm','abs','ob'].forEach(k=>put(o,k,num(t[k],0,MAXN,undefined)));
 put(o,'mw',int(t.mw,1,12,undefined));
 if(isObj(t.cut)){const c={};['sss','ph','pi','tax'].forEach(k=>{if(['split','15','30'].includes(t.cut[k]))c[k]=t.cut[k]});o.cut=c}
 return o}

export function clean(d){
 if(!isObj(d))return null;
 const out={income:num(d.income,0,MAXN,0),cats:list(d.cats,LIMIT.other).map(cat),tx:list(d.tx,LIMIT.tx).map(tx).filter(Boolean),goals:list(d.goals,LIMIT.other).map(goal)};
 // Left unset when absent: the app migrates older data that has no bills list.
 if(Array.isArray(d.bills))out.bills=list(d.bills,LIMIT.other).map(bill);
 if(Array.isArray(d.debts))out.debts=list(d.debts,LIMIT.other).map(debt);
 if(Array.isArray(d.pay))out.pay=list(d.pay,LIMIT.other).map(pay).filter(Boolean);
 const t=tax(d.tax);if(t)out.tax=t;
 if(typeof d.currency==='string'&&/^[A-Z]{3}$/.test(d.currency))out.currency=d.currency;
 if(isObj(d.fxPHP)){const r=num(d.fxPHP.rate,0,1e7,undefined);if(r>0)out.fxPHP={rate:r,updated:num(d.fxPHP.updated,0,9e15,0),time:num(d.fxPHP.time,0,9e15,0)}}
 if(isObj(d.alerts)){out.alerts={};if(typeof d.alerts.on==='boolean')out.alerts.on=d.alerts.on;put(out.alerts,'warn',int(d.alerts.warn,50,100,undefined))}
 if(isObj(d.debtPlan)){out.debtPlan={};put(out.debtPlan,'extra',num(d.debtPlan.extra,0,MAXN,undefined));if(['avalanche','snowball'].includes(d.debtPlan.method))out.debtPlan.method=d.debtPlan.method}
 return out}
