import {$} from './util.js';
import {view,cur} from './state.js';
import {money} from './ui.js';
import {home} from './views/home.js';
import {tax} from './views/tax.js';
import {budgets} from './views/budgets.js';
import {goals} from './views/goals.js';
import {report} from './views/report.js';

// The floating button always does the most useful add for the page you are on.
const FAB={home:['add','Add expense'],report:['add','Add expense'],budgets:['addcat','Add category'],goals:['addgoal','Add goal']};
const views={home,budgets,goals,report,tax};
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
let lastView=null,lastMonth=null,raf=0;

// Counts [data-count] figures up from zero when a page or month is first shown.
function countUp(root){
 cancelAnimationFrame(raf);
 const els=[...root.querySelectorAll('[data-count]')];
 if(!els.length||still())return;
 const t0=performance.now(),D=650;
 const step=t=>{
  const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);
  els.forEach(el=>{el.innerHTML=money(Math.round(+el.dataset.count*e))});
  if(k<1)raf=requestAnimationFrame(step);else els.forEach(el=>{el.innerHTML=money(+el.dataset.count)});
 };
 raf=requestAnimationFrame(step);
}

function render(){
 const main=$('#main'),month=`${cur.y}-${cur.m}`;
 const kind=lastView!==view?'enter':lastMonth!==month?'swap':'';
 main.innerHTML=views[view]();
 document.querySelectorAll('.nav[data-v]').forEach(b=>{b.classList.toggle('on',b.dataset.v===view);b.setAttribute('aria-current',b.dataset.v===view?'page':'false')});
 const fab=$('#fab'),fa=FAB[view];if(fab){fab.hidden=!fa;if(fa){fab.dataset.act=fa[0];fab.dataset.ty='expense';fab.setAttribute('aria-label',fa[1]);fab.title=fa[1]}}
 main.classList.remove('enter','swap');
 if(kind){void main.offsetWidth;main.classList.add(kind);countUp(main)}
 lastView=view;lastMonth=month;
}
export {render};
