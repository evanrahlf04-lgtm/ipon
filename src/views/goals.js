import {esc,peso,MN,ic} from '../util.js';
import {S} from '../state.js';
import {tone,topbar} from '../ui.js';
import {contribs} from '../goals.js';
const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');

// What to set aside each month to reach the goal by its target date.
function pace(g){
 if(g.saved>=g.target)return {t:'Goal reached',cls:'ok'};
 if(!g.date)return null;
 const end=new Date(g.date+'T00:00'),days=(end-new Date())/864e5,tag=`${end.getDate()} ${MN[end.getMonth()]} ${end.getFullYear()}`;
 if(days<0)return {t:`Target date passed (${tag})`,cls:'late'};
 const months=Math.max(1,Math.ceil(days/30.44));
 return {t:`${peso(Math.ceil((g.target-g.saved)/months))} a month to finish by ${tag}`,cls:''};
}
// Recent contributions for a goal. Tap one to edit or delete it.
function hist(g){const h=contribs(g);if(!h.length)return '';const d=t=>{const x=new Date(t.date+'T00:00');return `${x.getDate()} ${MN[x.getMonth()]} ${x.getFullYear()}`};
 return `<details class="gh"><summary>${h.length} contribution${h.length>1?'s':''} · ${peso(h.reduce((a,t)=>a+t.amount,0))}</summary>${h.slice(0,10).map(t=>`<button class="ghr" data-edit="${t.id}"><span>${d(t)}</span><span class="mute">${esc(t.note||'')}</span><b>+${peso(t.amount)}</b></button>`).join('')}${h.length>10?`<div class="mute" style="font-size:12px;padding:6px 0">${h.length-10} older ones are in your transactions.</div>`:''}</details>`}
function summary(){if(!S.goals.length)return '';const saved=S.goals.reduce((a,g)=>a+g.saved,0),target=S.goals.reduce((a,g)=>a+g.target,0),p=target?Math.min(100,saved/target*100):0,auto=S.goals.reduce((a,g)=>a+(g.auto||0),0),next=S.goals.filter(g=>g.date&&g.saved<g.target).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const nx=next?new Date(next.date+'T00:00'):null;
 return `<section class="panel fade dsk" data-nojump><div class="hrow" style="align-items:flex-end"><div><div class="lab">Saved so far</div><div class="serif" style="font-size:34px;font-weight:700">${peso(saved)} <span class="mute" style="font-size:15px;font-weight:500">of ${peso(target)}</span></div></div><div class="sub" style="text-align:right">${auto?`Saving ${peso(auto)} a month automatically<br>`:''}${next?`Next target: <b>${esc(next.name)}</b> by ${nx.getDate()} ${MN[nx.getMonth()]} ${nx.getFullYear()}`:'No target dates set yet'}</div></div><div class="meter"><i style="width:${p}%"></i></div></section>`}
function goals(){
 const saved=S.goals.reduce((a,g)=>a+g.saved,0),target=S.goals.reduce((a,g)=>a+g.target,0);
 return topbar('Goals',S.goals.length?`${peso(saved)} saved of ${peso(target)}`:'Money set aside for later',true)+summary()+`<section class="full fade"><div class="sec"><h2>${S.goals.length} goal${S.goals.length===1?'':'s'}</h2><button class="btn sm" data-act="addgoal">${ic('plus','sm')}Goal</button></div><div class="grid2 goalg">${S.goals.length?S.goals.map(g=>{const p=Math.min(100,g.saved/g.target*100),pc=pace(g);return `<div class="bc"><div class="h">${tone(68,'target')}<button class="n" data-editgoal="${g.id}"><b>${esc(g.name)}</b><span class="s">${g.target-g.saved>0?peso(g.target-g.saved)+' to go':'Reached'}</span></button><button class="btn sm g" data-fund="${g.id}">${ic('plus','sm')}Add</button></div><div class="bar"><i style="width:${p}%;background:var(--accent)"></i></div><div class="f"><span>${peso(g.saved)} of ${peso(g.target)}</span><span>${Math.round(p)}%</span></div>${pc?`<div class="pace ${pc.cls}">${ic(pc.cls==='late'?'alert':pc.cls==='ok'?'check':'cal','sm')}${pc.t}</div>`:''}${g.auto>0?`<div class="pace">${ic('cal','sm')}Saving ${peso(g.auto)} on the ${ord(g.autoDay)} each month. See Payables.</div>`:''}${hist(g)}</div>`}).join(''):`<div class="empty full">${ic('target','lg')}No goals yet. Add one to start saving toward something.<button class="btn sm" data-act="addgoal">${ic('plus','sm')}New goal</button></div>`}</div></section>`}
export {goals};
