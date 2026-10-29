import {$} from './util.js';
import {T,view,S} from './state.js';
import {home} from './views/home.js';
import {tax} from './views/tax.js';
import {budgets} from './views/budgets.js';
import {goals} from './views/goals.js';
import {report} from './views/report.js';
function render(){$('#main').innerHTML={home,budgets,goals,report,tax}[view]();document.querySelectorAll('.nav[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===view))}
export {render};
