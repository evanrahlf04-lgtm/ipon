import {esc,peso,MN,ic} from '../util.js';
import {S} from '../state.js';
import {tone,topbar} from '../ui.js';

// What to set aside each month to reach the goal by its target date.
function pace(g){
 if(g.saved>=g.target)return {t:'Goal reached',cls:'ok'};
 if(!g.date)return null;
 const end=new Date(g.date+'T00:00'),days=(end-new Date())/864e5,tag=`${end.getDate()} ${MN[end.getMonth()]} ${end.getFullYear()}`;
 if(days<0)return {t:`Target date passed (${tag})`,cls:'late'};
 const months=Math.max(1,Math.ceil(days/30.44));
 return {t:`${peso(Math.ceil((g.target-g.saved)/months))} a month to finish by ${tag}`,cls:''};
}
function goals(){
 const saved=S.goals.reduce((a,g)=>a+g.saved,0),target=S.goals.reduce((a,g)=>a+g.target,0);
 return topbar('Goals',S.goals.length?`${peso(saved)} saved of ${peso(target)}`:'Money set aside for later',true)+`<section class="full fade"><div class="sec"><h2>${S.goals.length} goal${S.goals.length===1?'':'s'}</h2><button class="btn sm" data-act="addgoal">${ic('plus','sm')}Goal</button></div><div class="grid2">${S.goals.length?S.goals.map(g=>{const p=Math.min(100,g.saved/g.target*100),pc=pace(g);return `<div class="bc"><div class="h">${tone(68,'target')}<button class="n" data-editgoal="${g.id}"><b>${esc(g.name)}</b><span class="s">${g.target-g.saved>0?peso(g.target-g.saved)+' to go':'Reached'}</span></button><button class="btn sm g" data-fund="${g.id}">${ic('plus','sm')}Add</button></div><div class="bar"><i style="width:${p}%;background:var(--accent)"></i></div><div class="f"><span>${peso(g.saved)} of ${peso(g.target)}</span><span>${Math.round(p)}%</span></div>${pc?`<div class="pace ${pc.cls}">${ic(pc.cls==='late'?'alert':pc.cls==='ok'?'check':'cal','sm')}${pc.t}</div>`:''}</div>`}).join(''):`<div class="empty full">${ic('target','lg')}No goals yet. Add one to start saving toward something.<button class="btn sm" data-act="addgoal">${ic('plus','sm')}New goal</button></div>`}</div></section>`}
export {goals};
