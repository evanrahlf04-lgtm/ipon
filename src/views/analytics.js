import {esc,peso,MF,ic} from '../util.js';
import {cur,S,grpOf} from '../state.js';
import {tone,topbar,monHtml,fold} from '../ui.js';
import {report} from './report.js';
import {monthPlan,split,catRows,forecast,insights} from '../analytics.js';

const R=v=>peso(Math.round(v)),pc=(v,t)=>t>0?Math.round(v/t*100):0;

function match(p){
 const parts=[['Bills',p.bills,'var(--mint)'],['Debt payments',p.debt,'var(--pink)'],['Everyday spending',p.everyday,'var(--lime)'],['Goals and savings',p.savings,'hsl(262 75% 80%)']];
 const max=Math.max(p.income,p.total,1),short=p.left<0;
 return `<section class="panel fade" data-sec="Does it match"><div class="sec"><h2>Does your money match?</h2><span class="mute">${MF[cur.m]}</span></div>
 <div class="lab">${short?'Short by':'Unassigned'}</div><div class="bal serif ${short?'over':''}" style="font-size:44px">${R(Math.abs(p.left))}</div>
 <div class="sub">${p.income?`Income ${R(p.income)} against ${R(p.total)} of bills, debt payments, everyday budgets and goals.`:'Set your income first, then this shows how your plan lines up.'}</div>
 <div class="stack" role="img" aria-label="How income is planned">${parts.map(x=>`<i style="width:${x[1]/max*100}%;background:${x[2]}"></i>`).join('')}${p.left>0?`<i style="width:${p.left/max*100}%;background:var(--tile)"></i>`:''}</div>
 ${parts.map(x=>`<div class="pr"><span class="l"><span class="dot" style="background:${x[2]}"></span><span><b>${x[0]}</b><small>${p.income?pc(x[1],p.income)+'% of income':''}</small></span></span><b>${R(x[1])}</b></div>`).join('')}
 <div class="pr"><span class="l"><span class="dot" style="background:var(--tile);box-shadow:inset 0 0 0 1px var(--line)"></span><span><b>${short?'Shortfall':'Left over'}</b></span></span><b class="${short?'over':''}">${short?'−':''}${R(Math.abs(p.left))}</b></div>
 <p class="note" style="margin-top:10px">Bills and debt come from your Payables for this month. Everyday spending uses your category budgets. Goals use the monthly amount needed to hit each target date.</p></section>`}

function rule(p){
 const g=split(p.s,p.income),inc=p.income,T=[['need','Needs','Rent, utilities, groceries, transport',50],['want','Wants','Eating out, shopping, treats',30],['sd','Savings and debt','Goals, emergency fund, debt payments',20]];
 return fold('rule','Needs, wants, savings',MF[cur.m],`
 <div class="hl">${T.map(([k,l,h,t])=>{const a=pc(g[k].act,inc),pl=pc(g[k].plan,inc),hi=k==='sd'?a<t:a>t;return `<div class="hr"><div style="grid-column:1/-1"><div class="t"><span><b>${l}</b> <span class="mute">· aim for about ${t}%</span></span><span class="${hi?'over':''}">${a}% spent · ${pl}% planned</span></div><div class="bar"><i style="width:${Math.min(100,a)}%;background:${hi?'var(--bad)':'var(--accent)'}"></i></div><small class="mute">${h} · ${R(g[k].act)} spent of ${R(g[k].plan)} planned</small></div></div>`}).join('')}</div>
 <p class="note" style="margin-top:10px">A common guideline, not a rule. Each category's group comes from its name. Change it in the category form if it is wrong. Debt payments above the minimum count toward savings and debt.</p>`,'50/30/20')}

function catTable(p){
 const rows=catRows(p.s);
 return fold('bva','Budget vs actual',MF[cur.m],`${rows.length?rows.map(r=>{const o=r.sp>r.b&&r.b>0&&grpOf(r.c)!=='save',w=r.b?Math.min(100,r.sp/r.b*100):100;return `<div class="hr" style="margin-bottom:12px">${tone(r.c.hue,r.c.icon)}<div><div class="t"><span>${esc(r.c.name)}</span><span class="${o?'over':''}">${R(r.sp)} of ${R(r.b)}</span></div><div class="bar"><i style="width:${w}%;background:${o?'var(--bad)':`hsl(${r.c.hue} 75% 48%)`}"></i></div><small class="mute">${r.b?(o?'Over by '+R(r.sp-r.b):R(r.b-r.sp)+' left'):'No budget set'}${r.avg?' · usually '+R(r.avg)+' a month':''}</small></div></div>`}).join(''):`<div class="empty">${ic('chart','lg')}Add budgets and expenses to compare them.</div>`}`)}

function ahead(f){
 return `<section class="panel fade" data-sec="Next 3 months"><div class="sec"><h2>Next 3 months</h2><span class="mute">forecast</span></div>${f.rows.map(r=>`<div class="pr"><span class="l"><span class="dot" style="background:${r.net<0?'var(--bad)':'var(--lime)'}"></span><span><b>${MF[r.m]} ${r.y}</b><small>Income ${R(r.inc)} − bills and debt ${R(r.oblig)} − usual spending ${R(r.usual)}${r.goals?' − goals '+R(r.goals):''}</small></span></span><b class="${r.net<0?'over':''}">${r.net<0?'−':''}${R(Math.abs(r.net))}</b></div>`).join('')}
 <p class="note" style="margin-top:10px">Uses your bills due in each month, ${f.hist?`your average everyday spending over the last ${f.hist} month${f.hist>1?'s':''}`:'your category budgets for everyday spending'}, and goals with a target date. Income is your fixed amount, or the average of your recent logged pay.</p></section>`}

function highlights(list){
 return `<section class="panel fade" data-sec="Highlights"><div class="sec"><h2>Highlights</h2></div>${list.map(x=>`<div class="pace ${x.cls}" style="align-items:flex-start;font-size:14px;margin-bottom:10px;color:${x.cls==='late'?'var(--bad)':x.cls==='ok'?'var(--good)':'var(--ink)'}"><span style="margin-top:2px">${ic(x.i,'sm')}</span><span style="flex:1">${x.t}${x.x?`<br><button class="btn sm" style="margin-top:8px" data-useextra="${x.x}">Use ${R(x.x)} as my extra debt payment</button>`:''}</span></div>`).join('')}</section>`}

let tab='report';
const setRtab=v=>{tab=v},getRtab=()=>tab;
function analytics(){const t=tab==='plan';
 return topbar('Report',t?'How your money lines up with what you owe':`${MF[cur.m]} ${cur.y}`,false,true)+`<div class="trow"><div class="seg" id="rtab"><button data-rtab="report" class="${t?'':'on'}">Report</button><button data-rtab="plan" class="${t?'on':''}">Money plan</button></div>${monHtml()}</div>`+(t?plan():report())}
function plan(){const p=monthPlan(),f=forecast();return highlights(insights(p,f))+match(p)+rule(p)+catTable(p)+ahead(f)}
export{analytics,setRtab,getRtab};
