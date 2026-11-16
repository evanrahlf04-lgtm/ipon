import {$} from './util.js';
import {view,cur} from './state.js';
import {money} from './ui.js';
import {buildJump} from './jump.js';
import {home} from './views/home.js';
import {salary,getStab} from './views/salary.js';
import {budgets} from './views/budgets.js';
import {goals} from './views/goals.js';
import {analytics} from './views/analytics.js';
import {bills,getPtab} from './views/bills.js';
import {overdue,upcoming} from './bills.js';
import {budgetAlerts} from './alerts.js';

// The floating button always does the most useful add for the page you are on.
const FAB={bills:['addbill','Add bill'],home:['add','Add expense'],report:['add','Add expense'],budgets:['addcat','Add category'],goals:['addgoal','Add goal']};
const views={home,bills,budgets,goals,report:analytics,tax:salary};
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
let lastView=null,lastMonth=null,raf=0;

// Counts [data-count] figures up from zero when a page or month is first shown.
function countUp(root){
 cancelAnimationFrame(raf);
 const els=[...root.querySelectorAll('[data-count]')];
 if(!els.length||still())return;
 const t0=performance.now(),D=420;
 const step=t=>{
  const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);
  els.forEach(el=>{el.innerHTML=money(Math.round(+el.dataset.count*e))});
  if(k<1)raf=requestAnimationFrame(step);else els.forEach(el=>{el.innerHTML=money(+el.dataset.count)});
 };
 raf=requestAnimationFrame(step);
}

// After a re-render the focused control is rebuilt, so find the same one again and focus it.
function focusKey(el){const m=$('#main');if(!el||!m||!m.contains(el))return null;if(el.id)return '#'+el.id;for(const a of el.attributes)if(a.name.startsWith('data-')&&a.name!=='data-sec')return '['+a.name+'="'+CSS.escape(a.value)+'"]';return null}
function render(){
 const main=$('#main'),month=`${cur.y}-${cur.m}`;
 const kind=lastView!==view?'enter':lastMonth!==month?'swap':'';
 const fk=lastView===view?focusKey(document.activeElement):null;
 main.innerHTML=views[view]();
 if(fk){const el=main.querySelector(fk);if(el)el.focus({preventScroll:true})}
 document.querySelectorAll('.nav[data-v]').forEach(b=>{b.classList.toggle('on',b.dataset.v===view);b.setAttribute('aria-current',b.dataset.v===view?'page':'false')});
 const fab=$('#fab'),fa=view==='bills'&&getPtab()==='debts'?['adddebt','Add debt']:view==='tax'&&getStab()==='track'?['addpay','Log pay']:FAB[view];if(fab){fab.hidden=!fa;if(fa){fab.dataset.act=fa[0];fab.dataset.ty='expense';fab.setAttribute('aria-label',fa[1]);fab.title=fa[1]}}
 // Red dot on the Payables button while anything is overdue or due within 3 days.
 const nb=document.querySelector('.nav[data-v=bills]');if(nb){const n=overdue().length+upcoming(3).length;nb.classList.toggle('alert',n>0);nb.dataset.n=n>9?'9+':n||''}
 const bb=document.querySelector('.nav[data-v=budgets]');if(bb){const d=new Date(),n=budgetAlerts(d.getFullYear(),d.getMonth()).length;bb.classList.toggle('alert',n>0);bb.dataset.n=n>9?'9+':n||''}
 buildJump();
 main.classList.remove('enter','swap');
 if(kind){void main.offsetWidth;main.classList.add(kind);countUp(main)}
 lastView=view;lastMonth=month;
}
export {render};
