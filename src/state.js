import {pad,ds,HUES} from './util.js';
const KEY='ipon-v6',TK='ipon-theme';
const now=new Date(),T=ds(now.getFullYear(),now.getMonth(),now.getDate());
let cur={y:now.getFullYear(),m:now.getMonth()},view='home',q='',ft='all',fc='all',tl=30,user=null,savedAt=0,saveHook=null;
const setCur=v=>{cur=v},setView=v=>{view=v},setQ=v=>{q=v},setFt=v=>{ft=v},setFc=v=>{fc=v},setTl=v=>{tl=v},setS=v=>{S=v},setUser=v=>{user=v},setSaveHook=v=>{saveHook=v};
const isCur=()=>cur.y===now.getFullYear()&&cur.m===now.getMonth();
const isPast=()=>cur.y<now.getFullYear()||(cur.y===now.getFullYear()&&cur.m<now.getMonth());
const dim=()=>new Date(cur.y,cur.m+1,0).getDate();
const STARTER=[['Rent','house'],['Electricity','bolt'],['Water','drop'],['Internet','wifi'],['Transportation','bus'],['Groceries','cart'],['Eating out','fork'],['Health','heart'],['Shopping','shirt'],['Other','tag']];
const emptyState=()=>({income:0,cats:STARTER.map((c,i)=>({id:'c'+i,name:c[0],budget:0,due:0,icon:c[1],hue:HUES[i%HUES.length]})),tx:[],goals:[]});
let S=emptyState();
function norm(old){S.tax=Object.assign({mode:'employee',auto:true,gross:0,th:true,dm:0,mw:12,abs:0,ob:0},old||S.tax||{});S.tax.cut=Object.assign({sss:'split',ph:'split',pi:'split',tax:'15'},S.tax.cut||{});S.cats=S.cats||[];S.goals=S.goals||[];S.tx=S.tx||[];S.income=S.income||0}
norm();
// Data is cached per user so two accounts on one browser never see each other's budget.
const localKey=()=>`${KEY}:${user?user.id:'anon'}`;
function loadLocal(){try{return JSON.parse(localStorage.getItem(localKey())||'null')}catch(e){return null}}
function clearLocal(){try{localStorage.removeItem(localKey())}catch(e){}}
function adopt(data,ts){S=data&&Array.isArray(data.cats)?data:emptyState();norm();savedAt=ts||0}
const getSavedAt=()=>savedAt;
const save=()=>{savedAt=Date.now();try{localStorage.setItem(localKey(),JSON.stringify({ts:savedAt,data:S}))}catch(e){}if(saveHook)saveHook(S,savedAt)};
const mk=(y=cur.y,m=cur.m)=>`${y}-${pad(m+1)}`;
const cat=id=>S.cats.find(c=>c.id===id)||{name:'Uncategorized',hue:220,icon:'tag',budget:0,due:0};
function monthSum(y,m){const k=mk(y,m);let e=0,i=0;S.tx.forEach(t=>{if(t.date.startsWith(k))t.type==='income'?i+=t.amount:e+=t.amount});return{e,i:i+S.income}}
function calc(){const k=mk(),tx=S.tx.filter(t=>t.date.startsWith(k)),by={};let extra=0,spent=0;
 tx.forEach(t=>{if(t.type==='income')extra+=t.amount;else{spent+=t.amount;by[t.catId]=(by[t.catId]||0)+t.amount}});
 const income=S.income+extra,left=income-spent,dm=dim(),day=isCur()?now.getDate():(isPast()?dm:0);
 const unpaid=S.cats.filter(c=>c.due&&!by[c.id]).reduce((a,c)=>a+c.budget,0);
 const variable=S.cats.filter(c=>!c.due).reduce((a,c)=>a+(by[c.id]||0),0);
 const proj=isCur()?spent+(day?variable/day*(dm-day):0)+unpaid:spent;
 const daysLeft=isCur()?dm-day+1:0,free=isCur()&&daysLeft?Math.max(0,left-unpaid)/daysLeft:0;
 return{tx,by,spent,income,left,unpaid,proj,free,budget:S.cats.reduce((a,c)=>a+c.budget,0),day,dm}}
export {KEY,TK,now,T,cur,view,q,ft,fc,tl,S,user,setTl,setCur,setView,setQ,setFt,setFc,setS,setUser,setSaveHook,isCur,isPast,dim,emptyState,norm,loadLocal,clearLocal,adopt,getSavedAt,save,mk,cat,monthSum,calc};
