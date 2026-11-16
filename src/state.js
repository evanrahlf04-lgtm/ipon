import {pad,ds,HUES} from './util.js';
import {dueLeft} from './bills.js';
import {clean} from './sanitize.js';
const KEY='ipon-v6',TK='ipon-theme';
const now=new Date(),T=ds(now.getFullYear(),now.getMonth(),now.getDate());
let cur={y:now.getFullYear(),m:now.getMonth()},view='home',q='',ft='all',fc='all',tl=innerWidth<861?12:30,user=null,savedAt=0,saveHook=null;
const setCur=v=>{cur=v},setView=v=>{view=v},setQ=v=>{q=v},setFt=v=>{ft=v},setFc=v=>{fc=v},setTl=v=>{tl=v},setS=v=>{S=v},setUser=v=>{user=v},setSaveHook=v=>{saveHook=v};
const isCur=()=>cur.y===now.getFullYear()&&cur.m===now.getMonth();
const isPast=()=>cur.y<now.getFullYear()||(cur.y===now.getFullYear()&&cur.m<now.getMonth());
const dim=()=>new Date(cur.y,cur.m+1,0).getDate();
const STARTER=[['Rent','house'],['Electricity','bolt'],['Water','drop'],['Internet','wifi'],['Transportation','bus'],['Groceries','cart'],['Eating out','fork'],['Health','heart'],['Shopping','shirt'],['Other','tag']];
const emptyState=()=>({income:0,cats:STARTER.map((c,i)=>({id:'c'+i,name:c[0],budget:0,due:0,icon:c[1],hue:HUES[i%HUES.length]})),tx:[],goals:[],bills:[],debts:[],pay:[]});
let S=emptyState();
function norm(old){const t=Object.assign({},old||S.tax||{});
 // Older data had no link flag: keep an existing income as it was, and start new accounts linked to take-home pay.
 if(t.link===undefined){if(S.income>0){if(!(t.gross>0))t.gross=S.income;t.link=false}else t.link=true}
 // Bills used to be categories with a due day. Move them into their own list once.
 if(!Array.isArray(S.bills)){const nk=`${now.getFullYear()}-${pad(now.getMonth()+1)}`;S.bills=(S.cats||[]).filter(c=>c.due>0&&c.budget>0).map(c=>({id:'b'+c.id,name:c.name,amount:c.budget,rep:'monthly',due:c.due,catId:c.id,from:(S.tx||[]).filter(t=>t.catId===c.id).map(t=>t.date.slice(0,7)).sort()[0]||nk,lg:1}));(S.cats||[]).forEach(c=>{c.due=0})}
 S.tax=Object.assign({mode:'employee',track:false,fopt:'8',link:true,gross:0,th:true,dm:0,mw:12,abs:0,ob:0},t);S.tax.cut=Object.assign({sss:'split',ph:'split',pi:'split',tax:'15'},S.tax.cut||{});S.cats=S.cats||[];S.bills=S.bills||[];S.debts=S.debts||[];S.pay=S.pay||[];S.alerts=Object.assign({on:true,warn:80},S.alerts||{});S.debtPlan=Object.assign({extra:0,method:'avalanche'},S.debtPlan||{});S.goals=S.goals||[];S.tx=S.tx||[];S.income=S.income||0;syncGoals()}
// Saved so far = what was already saved before tracking (base) plus every contribution logged for the goal.
function syncGoals(){S.goals.forEach(g=>{if(g.base===undefined)g.base=g.saved||0;g.saved=Math.max(0,g.base+S.tx.reduce((a,t)=>a+(t.goalId===g.id&&t.type==='expense'?t.amount:0),0))})}
norm();
// Data is cached per user so two accounts on one browser never see each other's budget.
const localKey=()=>`${KEY}:${user?user.id:'anon'}`;
function loadLocal(){try{return JSON.parse(localStorage.getItem(localKey())||'null')}catch(e){return null}}
function clearLocal(){try{localStorage.removeItem(localKey())}catch(e){}}
function adopt(data,ts){S=(data&&Array.isArray(data.cats)&&clean(data))||emptyState();norm();savedAt=ts||0}
const getSavedAt=()=>savedAt;
const save=()=>{syncGoals();savedAt=Date.now();try{localStorage.setItem(localKey(),JSON.stringify({ts:savedAt,data:S}))}catch(e){}if(saveHook)saveHook(S,savedAt)};
const mk=(y=cur.y,m=cur.m)=>`${y}-${pad(m+1)}`;
// Budget group of a category: need, want, save or debt. Guessed from the name until you pick one.
const GROUPS={need:'Need',want:'Want',save:'Savings',debt:'Debt'};
function grpOf(c){if(c.grp&&GROUPS[c.grp])return c.grp;if(S.bills.some(b=>b.catId===c.id&&b.debtId)||/debt|loan|credit card|utang/i.test(c.name))return'debt';if(/save|saving|invest|emergency|fund|ipon/i.test(c.name))return'save';if(/rent|electric|water|internet|transport|grocer|health|medic|insur|tuition|school|phone|load|bill|fare|gas|commute|food/i.test(c.name))return'need';return'want'}
// A category's budget for a month: a one-month override if you set one, otherwise its normal budget.
const budgetOf=(c,y=cur.y,m=cur.m)=>{const v=c.mb&&c.mb[mk(y,m)];return v===undefined?c.budget:v};
const cat=id=>S.cats.find(c=>c.id===id)||{name:'Uncategorized',hue:220,icon:'tag',budget:0,due:0};
// Logged pay that has actually been received in a month.
const paySum=(y,m)=>{const k=mk(y,m);return S.pay.reduce((a,p)=>a+(p.paid&&p.date.startsWith(k)?p.net:0),0)};
// Base income of a month: the fixed monthly amount, or what you logged as received when tracking pay.
const baseIncome=(y=cur.y,m=cur.m)=>S.tax.track?paySum(y,m):S.income;
// A steady figure for ratios: the fixed amount, or the average of the last 3 months with logged pay.
function incomeRef(){if(!S.tax.track)return S.income;let t=0,n=0;for(let i=0;i<3;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1),v=paySum(d.getFullYear(),d.getMonth());if(v>0){t+=v;n++}}return n?t/n:0}
function monthSum(y,m){const k=mk(y,m);let e=0,i=0;S.tx.forEach(t=>{if(t.date.startsWith(k))t.type==='income'?i+=t.amount:e+=t.amount});return{e,i:i+baseIncome(y,m)}}
function calc(){const k=mk(),tx=S.tx.filter(t=>t.date.startsWith(k)),by={};let extra=0,spent=0;
 tx.forEach(t=>{if(t.type==='income')extra+=t.amount;else{spent+=t.amount;by[t.catId]=(by[t.catId]||0)+t.amount}});
 const income=baseIncome()+extra,left=income-spent,dm=dim(),day=isCur()?now.getDate():(isPast()?dm:0);
 const bc=new Set(S.bills.map(b=>b.catId)),unpaid=isCur()?dueLeft():0;
 const gs=tx.filter(t=>t.goalId&&t.type==='expense'),saved=gs.reduce((a,t)=>a+t.amount,0),savedVar=gs.filter(t=>!bc.has(t.catId)).reduce((a,t)=>a+t.amount,0);
 const variable=S.cats.filter(c=>!bc.has(c.id)).reduce((a,c)=>a+(by[c.id]||0),0)-savedVar;
 const proj=isCur()?spent+(day?variable/day*(dm-day):0)+unpaid:spent;
 const daysLeft=isCur()?dm-day+1:0,free=isCur()&&daysLeft?Math.max(0,left-unpaid)/daysLeft:0;
 return{tx,by,spent,saved,income,left,unpaid,proj,free,budget:S.cats.reduce((a,c)=>a+budgetOf(c),0),day,dm}}
// Rows shown in the transaction list at a time: fewer on phones.
const PAGE=()=>innerWidth<861?12:30;
export {clean,PAGE,KEY,TK,now,T,cur,view,q,ft,fc,tl,S,user,setTl,setCur,setView,setQ,setFt,setFc,setS,setUser,setSaveHook,isCur,isPast,dim,emptyState,norm,loadLocal,clearLocal,adopt,getSavedAt,save,mk,cat,monthSum,calc,paySum,baseIncome,incomeRef,GROUPS,grpOf,budgetOf};
