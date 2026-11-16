// Pay log: what you actually receive, from salary, clients or anything else.
// An entry with paid=false is an invoice you are still waiting on. It only counts as income once received.
import {S,now,mk} from './state.js';
import {bracketTax} from './views/tax.js';
import {HUES,uid} from './util.js';

const KINDS={salary:['Salary','building'],freelance:['Freelance','phone'],other:['Other','gift']};
const yearOf=y=>S.pay.filter(p=>p.paid&&p.date.startsWith(String(y)));
const monthPay=(y,m)=>S.pay.filter(p=>p.date.startsWith(mk(y,m))).sort((a,b)=>b.date.localeCompare(a.date));
const waiting=()=>S.pay.filter(p=>!p.paid).sort((a,b)=>(a.due||a.date).localeCompare(b.due||b.date));
const receipts=p=>p.gross>0?p.gross:p.net;

// Philippine freelancer income tax on receipts so far this year. Estimate only.
// 8% flat: 8% of receipts over 250,000 (up to 3M). Otherwise graduated rates plus 3% percentage tax,
// on 60% of receipts (40% optional standard deduction) or on all of them.
const OPTS={'8':'8% flat on receipts over ₱250,000','osd':'Graduated rates with 40% standard deduction, plus 3% percentage tax','full':'Graduated rates on all receipts, plus 3% percentage tax'};
function taxEst(opt,R){
 if(!(R>0))return 0;
 if(opt==='8'&&R<=3000000)return Math.max(0,R-250000)*.08;
 if(opt==='full')return bracketTax(R)+R*.03;
 return bracketTax(R*.6)+R*.03}

// Quarterly view for one year. Cumulative receipts drive cumulative tax, as in the quarterly returns.
function quarters(y,opt){
 const rec=yearOf(y).filter(p=>p.kind==='freelance');
 const ends=[3,6,9],out=[];let prevTax=0,cum=0;
 [['Q1','Jan to Mar',`${y}-05-15`],['Q2','Apr to Jun',`${y}-08-15`],['Q3','Jul to Sep',`${y}-11-15`]].forEach((q,i)=>{
  const inQ=rec.filter(p=>+p.date.slice(5,7)<=ends[i]&&+p.date.slice(5,7)>ends[i]-3).reduce((a,p)=>a+receipts(p),0);cum+=inQ;
  const t=taxEst(opt,cum);out.push({q:q[0],span:q[1],due:q[2],inQ,cum,tax:t,add:Math.max(0,t-prevTax)});prevTax=t});
 const all=rec.reduce((a,p)=>a+receipts(p),0),tY=taxEst(opt,all);
 out.push({q:'Annual',span:`Full year ${y}`,due:`${y+1}-04-15`,inQ:Math.max(0,all-cum),cum:all,tax:tY,add:Math.max(0,tY-prevTax)});
 return{rows:out,receipts:all,tax:tY}}

const taxPaid=y=>S.tx.filter(t=>t.taxPay&&t.date.startsWith(String(y))).reduce((a,t)=>a+t.amount,0);
const taxCat=()=>{let c=S.cats.find(x=>/tax/i.test(x.name));if(!c){c={id:uid(),name:'Taxes',budget:0,due:0,icon:'tag',hue:HUES[S.cats.length%HUES.length]};S.cats.push(c)}return c.id};
const dayDiff=d=>Math.round((new Date(d+'T00:00')-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/864e5);
export{KINDS,OPTS,yearOf,monthPay,waiting,receipts,taxEst,quarters,taxPaid,taxCat,dayDiff};
