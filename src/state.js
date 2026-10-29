import {$,pad,ds,HUES,uid,ic} from './util.js';
const KEY='ipon-v5',TK='ipon-theme';
const now=new Date(),T=ds(now.getFullYear(),now.getMonth(),now.getDate());
let cur={y:now.getFullYear(),m:now.getMonth()},view='home',q='',ft='all',fc='all';
const setCur=v=>{cur=v},setView=v=>{view=v},setQ=v=>{q=v},setFt=v=>{ft=v},setFc=v=>{fc=v},setS=v=>{S=v};
const isCur=()=>cur.y===now.getFullYear()&&cur.m===now.getMonth();
const isPast=()=>cur.y<now.getFullYear()||(cur.y===now.getFullYear()&&cur.m<now.getMonth());
const dim=()=>new Date(cur.y,cur.m+1,0).getDate();
function seed(){
 const cats=[['Transportation',600,0,'bus'],['Rent',8000,1,'house'],['Electricity',500,15,'bolt'],['Water',300,15,'drop'],['Office Lunch',2400,0,'fork'],['Office Dinner',1200,0,'coffee'],['Amenities',500,12,'building'],['Food (rest of month)',3000,0,'cart'],['Laundry & Clothing',840,0,'shirt'],['Internet',228.4,3,'wifi'],['Debt & Loan',20000,5,'bank']].map((c,i)=>({id:'c'+i,name:c[0],budget:c[1],due:c[2],icon:c[3],hue:HUES[i%HUES.length]}));
 const id=n=>cats.find(c=>c.name===n).id,tx=[];
 for(const off of [-2,-1,0]){const dt=new Date(now.getFullYear(),now.getMonth()+off,1),y=dt.getFullYear(),m=dt.getMonth(),dm=new Date(y,m+1,0).getDate(),last=(off===0)?now.getDate():dm;
  const add=(d,c,a,n)=>{if(d<=last)tx.push({id:uid(),date:ds(y,m,d),type:'expense',catId:id(c),amount:a,note:n})};
  add(1,'Rent',8000,'Monthly rent');add(3,'Internet',228.4,'Internet bill');add(12,'Amenities',500,'Association dues');
  if(off<0||now.getDate()>=5)add(5,'Debt & Loan',20000,'Loan payment');
  if(off<0||now.getDate()>=15){add(15,'Electricity',480,'Meralco');if(off<0)add(15,'Water',290,'Water bill')}
  for(let d=1;d<=dm;d++){const w=new Date(y,m,d).getDay();if(w>0&&w<6&&d%2){add(d,'Office Lunch',200,'Lunch');add(d,'Office Dinner',100,'Dinner');add(d,'Transportation',50,'Commute')}if(w===6)add(d,'Food (rest of month)',250,'Groceries / eating out')}
  add(8,'Laundry & Clothing',210,'Laundry');add(22,'Laundry & Clothing',210,'Laundry')}
 return{income:40000,cats,tx,goals:[{id:'g1',name:'Emergency fund',target:60000,saved:12500},{id:'g2',name:'New phone',target:25000,saved:4000}],sample:true};
}
let S;try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
if(!S||!Array.isArray(S.cats))S=seed();
function norm(old){S.tax=Object.assign({mode:'employee',auto:true,gross:40000,th:true,dm:3000,mw:12,abs:0,ob:0},old||S.tax||{});S.tax.cut=Object.assign({sss:'split',ph:'split',pi:'split',tax:'15'},S.tax.cut||{});S.goals=S.goals||[];S.tx=S.tx||[];S.income=S.income||0}
norm();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
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
export {KEY,TK,now,T,cur,view,q,ft,fc,S,setCur,setView,setQ,setFt,setFc,setS,isCur,isPast,dim,seed,norm,save,mk,cat,monthSum,calc};
