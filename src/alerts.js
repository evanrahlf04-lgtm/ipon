// Budget alerts: a category warns when it has used a set share of its budget, and again when it goes over.
// For everyday categories in the current month it also warns when the pace of spending will overshoot.
import {S,now,mk,grpOf,budgetOf} from './state.js';
import {peso} from './util.js';

const P=v=>peso(Math.round(v));
function spentBy(y,m){const k=mk(y,m),by={};S.tx.forEach(t=>{if(t.type==='expense'&&t.date.startsWith(k))by[t.catId]=(by[t.catId]||0)+t.amount});return by}

function budgetAlerts(y,m){
 if(!S.alerts.on)return[];
 const by=spentBy(y,m),isNow=y===now.getFullYear()&&m===now.getMonth(),day=now.getDate(),dm=new Date(y,m+1,0).getDate(),bc=new Set(S.bills.map(b=>b.catId)),w=S.alerts.warn/100,out=[];
 S.cats.forEach(c=>{const bg=budgetOf(c,y,m);if(!(bg>0)||grpOf(c)==='save')return;
  const sp=by[c.id]||0,p=sp/bg;
  if(p>1)out.push({c,lvl:'over',p,t:`${c.name} is ${P(sp-bg)} over budget`});
  else if(p>=w&&!bc.has(c.id))out.push({c,lvl:'warn',p,t:`${c.name} has used ${Math.round(p*100)}% of its budget, ${P(bg-sp)} left`});
  else if(isNow&&!bc.has(c.id)&&day>=5&&sp>0){const proj=sp/day*dm;if(proj>bg*1.05)out.push({c,lvl:'pace',p,t:`${c.name} is on pace for ${P(proj)}, ${P(proj-bg)} over its budget`})}});
 const rank={over:0,warn:1,pace:2};
 return out.sort((a,b)=>rank[a.lvl]-rank[b.lvl]||b.p-a.p)}

// Message when a new expense pushes a category across a threshold, or '' if it did not.
function crossMsg(catId,before,after,y,m){
 const c=S.cats.find(x=>x.id===catId),bg=c?budgetOf(c,y,m):0;
 if(!S.alerts.on||!c||!(bg>0)||grpOf(c)==='save')return'';
 const w=S.alerts.warn/100,pb=before/bg,pa=after/bg;
 if(pb<=1&&pa>1)return`${c.name} is now ${P(after-bg)} over budget`;
 if(pb<w&&pa>=w&&pa<=1&&!S.bills.some(b=>b.catId===c.id))return`${c.name} has used ${Math.round(pa*100)}% of its budget`;
 return''}
export{budgetAlerts,crossMsg,spentBy};
