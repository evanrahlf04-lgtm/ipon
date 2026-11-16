// Goal contributions are expense transactions tagged with goalId, so saving lowers what is left this month.
// A goal can also save automatically each month: that is a monthly bill (goalId) in Payables, paid like any bill.
import {S,now,save} from './state.js';
import {uid,HUES} from './util.js';
import {mkey,fitBudget} from './bills.js';

const contribs=g=>S.tx.filter(t=>t.goalId===g.id&&t.type==='expense').sort((a,b)=>b.date.localeCompare(a.date));
function saveCat(){let c=S.cats.find(x=>x.grp==='save')||S.cats.find(x=>/^(saving|goal)/i.test(x.name));
 if(!c){c={id:uid(),name:'Savings & goals',budget:0,due:0,grp:'save',icon:'target',hue:HUES[S.cats.length%HUES.length]};S.cats.push(c)}return c.id}

// Create, update or remove the monthly bill behind a goal's automatic saving.
function linkGoalBill(g){
 let b=S.bills.find(x=>x.goalId===g.id);
 if(!(g.auto>0)){if(b)S.bills=S.bills.filter(x=>x!==b);return}
 if(!b){const day=g.autoDay||1;b={id:uid(),rep:'monthly',catId:saveCat(),goalId:g.id,from:mkey(now.getFullYear(),now.getMonth()+(day>=now.getDate()?0:1))};S.bills.push(b)}
 Object.assign(b,{name:'Save for '+g.name,amount:g.auto,due:g.autoDay||1,end:''});
 fitBudget(b.catId)}

// Once a goal is reached, stop its monthly saving.
function settleGoal(id){
 const g=S.goals.find(x=>x.id===id);if(!g||(g.base||0)+contribs(g).reduce((a,t)=>a+t.amount,0)<g.target)return false;
 const b=S.bills.find(x=>x.goalId===id);if(b)b.end=mkey(now.getFullYear(),now.getMonth());return true}
export{contribs,saveCat,linkGoalBill,settleGoal};
