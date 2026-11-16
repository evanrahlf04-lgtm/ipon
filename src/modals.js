import {$,esc,HUES,ICONS,ic,uid,peso,sym,CURRENCIES,curCode,setCurrency,MF,pad} from './util.js';
import {T,S,user,setCur,save,cat,now,GROUPS,grpOf,isBalance} from './state.js';
import {mkey,dateTxt,occ,overdue,monthOcc} from './bills.js';
import {balance,linkBill,settleDebt,debtCat} from './debts.js';
import {TYPES} from './views/debts.js';
import {KINDS,taxCat} from './pay.js';
import {contribs,saveCat,linkGoalBill,settleGoal} from './goals.js';
import {crossMsg,spentBy} from './alerts.js';
import {rate,cached,rateText,convertAll,refreshPHP,phpRate,ATTR} from './fx.js';
import {syncIncome} from './views/tax.js';
import {takeHome,pk} from './views/tax.js';
import {toast} from './ui.js';
import {render} from './render.js';
// Dialog helpers: lock the page behind a dialog, give focus back when it closes, and keep Tab inside it.
let locked=0;
function lock(on){const b=document.body;if(on){if(!locked){const sb=innerWidth-document.documentElement.clientWidth;b.style.overflow='hidden';if(sb>0)b.style.paddingRight=sb+'px'}locked=1}else{b.style.overflow='';b.style.paddingRight='';locked=0}}
const makeClose=(m,opener)=>()=>{const sc=$('#sc');if(!sc||sc.classList.contains('out'))return;sc.classList.add('out');setTimeout(()=>{if(sc.isConnected){m.innerHTML='';lock(false);if(opener&&opener.isConnected&&opener.focus)try{opener.focus({preventScroll:true})}catch(e){}}},180)};
// Phones: do not auto-open the keyboard. Move focus to the dialog itself instead.
const focusIn=(m)=>{const f=m.querySelector('input:not([type=hidden]),select'),sh=$('#sh');if(f&&!matchMedia('(pointer:coarse)').matches)f.focus();else if(sh){sh.tabIndex=-1;sh.focus({preventScroll:true})}};
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const sh=$('#sh');if(!sh)return;const f=[...sh.querySelectorAll('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);if(!f.length)return;const a=document.activeElement,first=f[0],last=f[f.length-1];if(!sh.contains(a)||(!e.shiftKey&&a===last)){e.preventDefault();first.focus()}else if(e.shiftKey&&(a===first||a===sh)){e.preventDefault();last.focus()}});
function modal(title,body,fn,del){const opener=document.activeElement;lock(true);const m=$('#modal');m.innerHTML=`<div class="scrim" id="sc"><form class="sheet" id="sh" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><h3 class="serif">${esc(title)}</h3>${body}<div class="acts">${del?'<button type="button" class="btn r" data-del>Delete</button>':''}<button type="button" class="btn g" data-close>Cancel</button><button class="btn">Save</button></div></form></div>`;
 const close=makeClose(m,opener);modal.close=close;m.querySelector('[data-close]').onclick=close;$('#sc').onclick=e=>{if(e.target.id==='sc')close()};
 if(del)m.querySelector('[data-del]').onclick=()=>{close();del();save();render()};
 $('#sh').onsubmit=e=>{e.preventDefault();if(fn(new FormData(e.target))!==false){save();close();render()}};focusIn(m)}
const fld=(l,n,t='text',x='',c='')=>`<label class="fld ${c}">${l}<input name="${n}" type="${t}" ${x}></label>`;
const amt=(v='')=>fld('Amount ('+sym()+')','a','number',`inputmode="decimal" step="0.01" min="0.01" value="${v}" required placeholder="0"`,'big');
const catSel=(sel)=>`<label class="fld">Category<select name="c">${S.cats.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`;
function txForm(t,fx){const ty=t.type;return `<div class="seg" id="seg" style="align-self:flex-start"><button type="button" data-ty="expense" class="${ty==='expense'?'on':''}">Expense</button><button type="button" data-ty="income" class="${ty==='income'?'on':''}">Income</button></div>${fx?amtRow(t.amount||''):amt(t.amount||'')}${!fx&&t.fx?`<p class="note">Entered as ${esc(t.fx.c)} ${Number(t.fx.a).toLocaleString('en-US')}, converted at the rate on that day.</p>`:''}<div id="cw" ${ty==='income'?'hidden':''}>${catSel(t.catId)}</div>${fld('Date','d','date',`value="${t.date}" required`)}${fld('Note','n','text',`maxlength="60" value="${esc(t.note||'')}" placeholder="Optional"`)}`}
function txSave(f,t){const a=parseFloat(f.get('a'));if(!(a>0))return false;const ty=document.querySelector('#seg .on').dataset.ty;Object.assign(t,{date:f.get('d'),type:ty,catId:ty==='expense'?f.get('c'):null,amount:a,note:(f.get('n')||'').trim()});const d=new Date(t.date+'T00:00');setCur({y:d.getFullYear(),m:d.getMonth()})}
function openTx(t,isNew){modal(isNew?'Add transaction':'Edit transaction',txForm(t,isNew),f=>{const x=isNew?fxApply(f):{};if(x===null)return false;const cid=f.get('c'),a0=parseFloat(f.get('a')),dd=new Date(f.get('d')+'T00:00'),exp=isNew&&document.querySelector('#seg .on').dataset.ty==='expense',before=exp?(spentBy(dd.getFullYear(),dd.getMonth())[cid]||0):0;if(txSave(f,t)===false)return false;if(x.fx)t.fx=x.fx;if(isNew)S.tx.push(t);toast((exp&&crossMsg(cid,before,before+a0,dd.getFullYear(),dd.getMonth()))||(isNew?'Added':'Updated'))},isNew?null:()=>{const i=S.tx.indexOf(t);S.tx.splice(i,1);toast('Transaction deleted',()=>{S.tx.splice(i,0,t);save();render()})});if(isNew)fxWire()}
const picker=(h,i)=>`<div class="fld">Icon<div class="picks" data-pk="icon">${ICONS.map(n=>`<button type="button" data-ic="${n}" class="${n===i?'on':''}" aria-label="${n}">${ic(n)}</button>`).join('')}</div><input type="hidden" name="icon" value="${i}"></div><div class="fld">Colour<div class="picks hues" data-pk="hue">${HUES.map(x=>`<button type="button" data-hue="${x}" style="--h:${x}" class="${x===h?'on':''}" aria-label="colour ${x}"></button>`).join('')}</div><input type="hidden" name="hue" value="${h}"></div>`;
function catModal(c,isNew){modal(isNew?'New category':'Edit category',fld('Name','n','text',`maxlength="30" required value="${esc(c.name)}"`)+fld('Usual monthly budget ('+sym()+')','b','number',`inputmode="decimal" min="0" step="any" required value="${c.budget}"`)+`<label class="fld">Budget group<select name="g">${Object.entries(GROUPS).map(([k,v])=>`<option value="${k}" ${grpOf(c)===k?'selected':''}>${v}</option>`).join('')}</select></label>`+picker(c.hue,c.icon),f=>{const n=(f.get('n')||'').trim(),b=parseFloat(f.get('b'));if(!n||!(b>=0))return false;Object.assign(c,{name:n,budget:b,grp:f.get('g'),icon:f.get('icon'),hue:+f.get('hue')});if(isNew)S.cats.push(c);toast('Saved')},isNew?null:()=>{if(S.tx.some(x=>x.catId===c.id)){toast('Category has transactions');return}if(S.bills.some(x=>x.catId===c.id)){toast('Category has bills');return}S.cats=S.cats.filter(x=>x!==c);toast('Category deleted')})}
function goalModal(g,isNew){modal(isNew?'New goal':'Edit goal',fld('Name','n','text',`maxlength="30" required value="${esc(g.name)}"`)+fld('Target ('+sym()+')','t','number',`inputmode="decimal" min="1" step="any" required value="${g.target||''}"`)+fld('Target date (optional)','dt','date',`value="${g.date||''}"`)+fld('Save automatically each month ('+sym()+', optional)','auto','number',`inputmode="decimal" min="0" step="any" value="${g.auto||''}" placeholder="e.g. 2000"`)+fld('Day of the month to save (1 to 31)','aday','number',`min="1" max="31" step="1" inputmode="numeric" value="${g.autoDay||''}"`)+(isNew?'':fld('Saved so far ('+sym()+')','s','number',`inputmode="decimal" min="0" step="any" value="${g.saved}"`)),f=>{const n=(f.get('n')||'').trim(),tg=parseFloat(f.get('t'));if(!n||!(tg>0))return false;const au=parseFloat(f.get('auto'))||0,ad=parseInt(f.get('aday'))||0;if(au>0&&!(ad>=1&&ad<=31)){toast('Add a day from 1 to 31 for automatic saving');return false}g.name=n;g.target=tg;g.date=f.get('dt')||'';g.auto=au;g.autoDay=au>0?ad:0;if(isNew){g.base=0;g.saved=0}else g.base=Math.max(0,parseFloat(f.get('s'))||0)-contribs(g).reduce((a,t)=>a+t.amount,0);if(isNew)S.goals.push(g);linkGoalBill(g);toast('Saved')},isNew?null:()=>{const i=S.goals.indexOf(g),bl=S.bills.filter(x=>x.goalId===g.id);S.goals.splice(i,1);S.bills=S.bills.filter(x=>x.goalId!==g.id);toast('Goal deleted',()=>{S.goals.splice(i,0,g);S.bills.push(...bl);save();render()})})}
// Put money toward a goal. It is logged as an expense so it comes out of what is left this month.
function fundModal(g){
 modal('Add to '+g.name,amt()+fld('Date','d','date',`value="${T}" required`)+fld('Note','n','text','maxlength="60" placeholder="Optional"')+`<p class="note">Saved so far ${peso(g.saved)} of ${peso(g.target)}. This counts as money you set aside, so it lowers what is left to spend this month.</p>`,
  f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;S.tx.push({id:uid(),date:f.get('d')||T,type:'expense',catId:saveCat(),goalId:g.id,amount:a,note:(f.get('n')||'').trim()||'Saved for '+g.name});toast(settleGoal(g.id)?g.name+' is fully funded':'Added to '+g.name)})}
// Add or edit a bill. Monthly bills repeat on a due day (1-31, short months use their last day).
// Month choice as a dropdown (instead of the browser's dashed month field). 'none' is the label for an empty choice.
function monthSel(name,val,none){
 const base=new Date(now.getFullYear(),now.getMonth()-12,1),list=[];
 for(let i=0;i<=96;i++){const d=new Date(base.getFullYear(),base.getMonth()+i,1);list.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}`)}
 if(val&&!list.includes(val)){list.push(val);list.sort()}
 return `<select name="${name}"><option value="">${none}</option>${list.map(v=>`<option value="${v}" ${v===val?'selected':''}>${MF[+v.slice(5)-1]} ${v.slice(0,4)}</option>`).join('')}</select>`}
function billModal(b,isNew){
 const once=b.rep==='once',dayNow=now.getDate();
 const defFrom=d=>d>=dayNow?mkey(now.getFullYear(),now.getMonth()):mkey(now.getFullYear(),now.getMonth()+1);
 const cats=(isNew?'<option value="__new" selected>+ New category from this name</option>':'')+S.cats.map(c=>`<option value="${c.id}" ${!isNew&&c.id===b.catId?'selected':''}>${esc(c.name)}</option>`).join('');
 modal(isNew?'New bill':'Edit bill',fld('Name','n','text',`maxlength="30" required value="${esc(b.name)}" placeholder="e.g. Rent, Meralco, Loan"`)+amt(b.amount||'')+
  `<label class="fld">Repeats<select name="rep" id="brep"><option value="monthly" ${once?'':'selected'}>Every month</option><option value="once" ${once?'selected':''}>One time</option></select></label>
  <div id="bmo" ${once?'hidden':''}>${fld('Due day of the month (1 to 31)','due','number',`min="1" max="31" step="1" inputmode="numeric" value="${b.due||''}" placeholder="e.g. 5"`)}<label class="fld">First due month${monthSel('from',b.from,'Next due date')}</label><label class="fld">Last month${monthSel('end',b.end,'Never ends')}</label></div>
  <div id="bon" ${once?'':'hidden'}>${fld('Due date','dt','date',`value="${b.date||''}"`)}</div>
  <label class="fld">Category<select name="c">${cats}</select></label>
  <p class="note">The category groups this bill with your other spending. You can pay a bill in parts from the Payables page.</p>`,
  f=>{const n=(f.get('n')||'').trim(),a=parseFloat(f.get('a')),rep=f.get('rep');if(!n||!(a>0))return false;
   const upd={rep,name:n,amount:a};
   if(rep==='once'){const d=f.get('dt');if(!d){toast('Pick a due date');return false}Object.assign(upd,{date:d,due:0,from:'',end:''})}
   else{const due=parseInt(f.get('due'));if(!(due>=1&&due<=31)){toast('Due day must be 1 to 31');return false}Object.assign(upd,{due,date:'',from:f.get('from')||b.from||defFrom(due),end:f.get('end')||''})}
   let cid=f.get('c');if(cid==='__new'){const c={id:uid(),name:n,budget:0,due:0,icon:'bank',hue:HUES[S.cats.length%HUES.length]};S.cats.push(c);cid=c.id}
   Object.assign(b,upd,{catId:cid});if(isNew)S.bills.push(b);
   // Keep the category budget large enough to cover its monthly bills.
   const c=cat(cid),tot=S.bills.filter(x=>x.catId===cid&&x.rep==='monthly').reduce((s,x)=>s+x.amount,0);if(S.cats.includes(c)&&c.budget<tot)c.budget=tot;
   toast(isNew?'Bill added':'Bill updated')},
  isNew?null:()=>{const i=S.bills.indexOf(b);S.bills.splice(i,1);toast('Bill deleted',()=>{S.bills.splice(i,0,b);save();render()})})}
// Pay all or part of one month of a bill.
function payModal(o){const b=o.b;
 modal('Pay '+b.name,amt(o.rem>0?o.rem:o.amt)+fld('Date','d','date',`value="${T}" required`)+fld('Note','n','text',`maxlength="60" placeholder="Optional"`)+`<p class="note">${dateTxt(o.date)} bill of ${peso(o.amt)}${o.paid?`, already paid ${peso(o.paid)}`:''}. Paying less leaves the rest owed unless you tick the box below.</p><label class="chk"><input type="checkbox" name="full">Nothing more is owed for this bill</label>`,
  f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;S.tx.push({id:uid(),date:f.get('d')||T,type:'expense',catId:b.catId,billId:b.id,bm:o.key,amount:a,full:f.get('full')?1:0,...(b.debtId?{debtId:b.debtId}:{}),...(b.goalId?{goalId:b.goalId}:{}),note:(f.get('n')||'').trim()||b.name+' payment'});if(b.debtId)settleDebt(b.debtId);if(b.goalId)settleGoal(b.goalId);toast(`Paid ${peso(a)} to ${b.name}`)})}
// Add or edit a debt. The balance field is the amount you owe today; changing it restarts the tracking from now.
function debtModal(d,isNew){
 const ty=Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${d.type===k?'selected':''}>${v[0]}</option>`).join('');
 modal(isNew?'New debt':'Edit debt',fld('Name','n','text',`maxlength="30" required value="${esc(d.name)}" placeholder="e.g. BPI credit card"`)+`<label class="fld">Type<select name="t">${ty}</select></label>`+
  fld('Amount you owe now ('+sym()+')','bal','number',`inputmode="decimal" step="0.01" min="0" required value="${isNew?'':balance(d)}" placeholder="0"`,'big')+
  fld('Interest a year (%)','apr','number',`inputmode="decimal" step="0.01" min="0" value="${d.apr||''}" placeholder="0 if none"`)+
  fld('Minimum payment each month ('+sym()+')','min','number',`inputmode="decimal" step="0.01" min="0" value="${d.min||''}" placeholder="0 if none"`)+
  fld('Due day of the month (1 to 31)','due','number',`min="1" max="31" step="1" inputmode="numeric" value="${d.due||''}"`)+
  fld('Original amount (optional, for the progress bar)','orig','number',`inputmode="decimal" step="0.01" min="0" value="${d.orig||''}"`)+
  `<p class="note">With a minimum payment, Tally adds this debt to your Payables as a monthly bill so you see its due date.</p>`,
  f=>{const n=(f.get('n')||'').trim(),bal=parseFloat(f.get('bal')),min=parseFloat(f.get('min'))||0,due=parseInt(f.get('due'))||0;
   if(!n||!(bal>=0))return false;if(min>0&&!(due>=1&&due<=31)){toast('Add a due day from 1 to 31');return false}
   const was=isNew?null:balance(d);
   Object.assign(d,{name:n,type:f.get('t'),apr:parseFloat(f.get('apr'))||0,min,due,orig:parseFloat(f.get('orig'))||0});
   if(isNew){Object.assign(d,{bal0:bal,asOf:T});S.debts.push(d)}else if(Math.abs(bal-was)>.005){d.bal0=bal;d.asOf=T}
   linkBill(d);toast(isNew?'Debt added':'Debt updated')},
  isNew?null:()=>{const i=S.debts.indexOf(d),bl=S.bills.filter(x=>x.debtId===d.id);S.debts.splice(i,1);S.bills=S.bills.filter(x=>x.debtId!==d.id);toast('Debt deleted',()=>{S.debts.splice(i,0,d);S.bills.push(...bl);save();render()})})}
// Pay toward a debt. If its monthly bill is unpaid, the payment counts toward that bill too.
function debtPayModal(d){
 const cur=balance(d),n=new Date(),o=[...overdue(),...monthOcc(n.getFullYear(),n.getMonth())].filter(x=>x.b.debtId===d.id&&x.rem>0).sort((a,b)=>a.date.localeCompare(b.date))[0];
 modal('Pay '+d.name,amt(Math.min(o?o.rem:(d.min||cur),cur))+fld('Date','d','date',`value="${T}" required`)+fld('Note','n','text','maxlength="60" placeholder="Optional"')+`<p class="note">You owe about ${peso(cur)}. ${o?'This counts toward the '+dateTxt(o.date)+' payment. Pay more than the minimum to clear the debt sooner.':'No payment is due right now, so this is an extra payment.'}</p>`,
  f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;const b=S.bills.find(x=>x.debtId===d.id);
   const e={id:uid(),date:f.get('d')||T,type:'expense',catId:b?b.catId:debtCat(),debtId:d.id,amount:a,note:(f.get('n')||'').trim()||d.name+' payment'};if(o){e.billId=o.b.id;e.bm=o.key}
   S.tx.push(e);toast(settleDebt(d.id)?d.name+' is paid off':`Paid ${peso(a)} to ${d.name}`)})}
// Log money received, or an invoice you are still waiting on.
function payEntryModal(p,isNew){
 const kinds=Object.entries(KINDS).map(([k,v])=>`<option value="${k}" ${p.kind===k?'selected':''}>${v[0]}</option>`).join('');
 modal(isNew?'Log pay':'Edit pay',`<label class="fld">Type<select name="k">${kinds}</select></label>`+fld('From (employer or client)','src','text',`maxlength="40" value="${esc(p.src||'')}" placeholder="e.g. Acme Corp, Juan Dela Cruz"`)+(isNew?amtRow(p.net||''):amt(p.net||''))+(!isNew&&p.fx?`<p class="note">Entered as ${esc(p.fx.c)} ${Number(p.fx.a).toLocaleString('en-US')}, converted at the rate on that day.</p>`:'')+
  fld('Gross before deductions (optional)','gross','number',`inputmode="decimal" step="0.01" min="0" value="${p.gross||''}"`)+
  `<label class="fld">Status<select name="st" id="pst"><option value="in" ${p.paid?'selected':''}>Received</option><option value="out" ${p.paid?'':'selected'}>Invoiced, waiting for payment</option></select></label>`+
  fld('Date','d','date',`value="${p.date}" required`)+`<div id="pdue" ${p.paid?'hidden':''}>${fld('Expected payment date','due','date',`value="${p.due||''}"`)}</div>`+
  fld('Note','n','text',`maxlength="60" value="${esc(p.note||'')}" placeholder="Optional"`)+(isNew&&p.kind==='salary'&&p.net?'<p class="note">The amount is one payday from your Salary calculator. Change it to match your payslip.</p>':''),
  f=>{const x=isNew?fxApply(f):{};if(x===null)return false;const a=parseFloat(f.get('a'));if(!(a>0)||!f.get('d'))return false;const paid=f.get('st')==='in';if(x.fx)p.fx=x.fx;
   Object.assign(p,{kind:f.get('k'),src:(f.get('src')||'').trim(),net:a,gross:parseFloat(f.get('gross'))||0,paid,date:f.get('d'),due:paid?'':(f.get('due')||''),note:(f.get('n')||'').trim()});
   if(isNew)S.pay.push(p);toast(isNew?'Logged':'Updated')},
  isNew?null:()=>{const i=S.pay.indexOf(p);S.pay.splice(i,1);toast('Entry deleted',()=>{S.pay.splice(i,0,p);save();render()})});if(isNew)fxWire()}
// An invoice was paid: confirm the date and the amount that actually arrived.
function recvModal(p){
 modal('Mark received',amt(p.net)+fld('Date received','d','date',`value="${T}" required`)+`<p class="note">${esc(p.src||'Invoice')}. Change the amount if the payment was different.</p>`,
  f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;Object.assign(p,{net:a,paid:true,date:f.get('d')||T,due:''});toast('Marked as received')})}
// Record a tax payment as an expense so your budget reflects it.
function taxPayModal(){
 modal('Record tax payment',amt('')+fld('Date','d','date',`value="${T}" required`)+fld('Note','n','text','maxlength="60" placeholder="e.g. 1701Q Q1"'),
  f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;S.tx.push({id:uid(),date:f.get('d')||T,type:'expense',catId:taxCat(),taxPay:1,amount:a,note:(f.get('n')||'').trim()||'Tax payment'});toast('Tax payment recorded')})}
// Choose the display currency. Changes the symbol and number format only; amounts are not converted.
// Entering an amount in another currency: pick it, see the converted amount, and it is saved in the budget currency.
const curOpts=sel=>CURRENCIES.map(([c,n])=>`<option value="${c}" ${c===sel?'selected':''}>${c} · ${esc(n)}</option>`).join('');
// Amount with a compact currency picker beside it, and a line below for the converted figure.
const fxSel=()=>`<label class="fld cur">Currency<select name="fxc">${CURRENCIES.map(([c])=>`<option value="${c}" ${c===curCode()?'selected':''}>${c}</option>`).join('')}</select></label>`;
const amtRow=v=>`<div class="amtrow">${amt(v)}${fxSel()}</div><p class="note" id="fxn" hidden></p>`;
function fxWire(){const sh=$('#sh');if(!sh)return;const sel=sh.querySelector('[name=fxc]'),inp=sh.querySelector('[name=a]'),note=sh.querySelector('#fxn');if(!sel||!inp||!note)return;
 const upd=async()=>{const c=sel.value,to=curCode();if(c===to){note.hidden=true;return}note.hidden=false;if(!cached(c,to))note.textContent="Getting today's rate…";
  try{const r=await rate(c,to);if(sel.value!==c)return;const a=parseFloat(inp.value);note.innerHTML=(a>0?`${esc(c)} ${a.toLocaleString('en-US')} = <b>${peso(Math.round(a*r.rate*100)/100)}</b>. `:'')+esc(rateText(c,to,r))+'. '+ATTR}
  catch(e){note.textContent=e.message}};
 sel.onchange=upd;inp.addEventListener('input',()=>{if(sel.value!==curCode())upd()})}
// On save: convert a foreign amount with the rate already fetched. Returns null to keep the form open.
function fxApply(f){const c=f.get('fxc'),to=curCode();if(!c||c===to)return{};const a=parseFloat(f.get('a'));if(!(a>0))return{};
 const r=cached(c,to);if(!r){toast("Getting today's rate. Try again in a moment.");rate(c,to).catch(()=>{});return null}
 f.set('a',String(Math.round(a*r*100)/100));const g=parseFloat(f.get('gross'));if(g>0&&f.has('gross'))f.set('gross',String(Math.round(g*r*100)/100));return{fx:{a,c}}}
// Where the budget starts from. Main choice: a starting amount (the money you have). Second choice: your salary.
function baseModal(){
 const sal=S.base==='salary',th=Math.round(takeHome(S.tax)*pk()*100)/100;
 modal('Where does your money start?',
  `<label class="choice"><input type="radio" name="mode" value="amount" ${sal?'':'checked'}><span class="cx"><b>Starting amount</b><small>The money you have right now. It stays as your balance: income you log adds to it and spending takes from it.</small></span></label>
  <div id="bamt" class="bsec" ${sal?'hidden':''}>${fld('Starting amount ('+sym()+')','a','number',`inputmode="decimal" step="0.01" min="0" value="${sal?'':(S.start.amount||'')}" placeholder="0"`,'big')}
   <label class="chk"><input type="checkbox" name="rep" ${S.start.repeat&&!sal?'checked':''}>Add this amount again every month instead</label>
   <p class="note">${!sal&&!S.start.repeat&&S.start.date?'Counted from '+S.start.date+'. ':''}Changing the amount changes your balance from that date.</p></div>
  <label class="choice"><input type="radio" name="mode" value="salary" ${sal?'checked':''}><span class="cx"><b>Use my salary</b><small>Your take-home pay from the Salary page is added to your money every month.</small></span></label>
  <div id="bsal" class="bsec" ${sal?'':'hidden'}><p class="note">${S.tax.gross>0?'Your take-home pay is about <b>'+peso(th)+'</b> a month. Change your pay on the Salary page.':'You have not entered your pay yet. After saving, open the Salary page to enter it.'}</p></div>`,
  f=>{
   if(f.get('mode')==='salary'){S.base='salary';S.tax.link=true;syncIncome();toast('Your salary is now your base');return}
   const v=parseFloat(f.get('a'));if(!(v>=0)){toast('Enter your starting amount');return false}
   const rep=!!f.get('rep'),was=S.base==='amount'&&!S.start.repeat;
   S.base='amount';S.tax.link=false;S.start={amount:v,repeat:rep,date:(was&&!rep)?S.start.date:T};S.income=rep?v:0;
   toast(rep?'Fixed monthly amount set':'Starting amount set')})}
// Choose the budget currency. Either convert every saved amount at today's rate, or only change the symbol.
function currencyModal(){
 const from=curCode();
 modal('Currency',`<label class="fld">Show amounts in<select name="cur">${curOpts(from)}</select></label>
  <label class="chk"><input type="checkbox" name="conv" checked>Convert my amounts at today's rate</label>
  <p class="note" id="fxn">Pick a currency to see today's rate.</p>
  <p class="note">Converting changes every amount you have saved, all at one rate. Untick it to change only the symbol. The Salary calculator and freelancer tax stay in pesos, and your take-home pay is converted for your budget.</p>`,
  f=>{const c=f.get('cur');if(c===from)return;let msg='Currency set to '+c;
   // Older salary figures were kept in pesos: move them into the current currency first so they convert correctly.
   if(S.tax.cur===undefined&&from!=='PHP'){const pr=phpRate();if(pr)['gross','dm','abs','ob'].forEach(k=>{S.tax[k]=Math.round((S.tax[k]||0)*pr*100)/100})}
   if(f.get('conv')){const r=cached(from,c);if(!r){toast("Getting today's rate. Try again in a moment.");rate(from,c).catch(()=>{});return false}convertAll(r);msg=`Converted everything to ${c}`}
   S.currency=c;setCurrency(c);S.tax.cur=c;delete S.fxPHP;
   if(c==='PHP')syncIncome();else refreshPHP(()=>{syncIncome();save();render()});
   toast(msg)});
 const sh=$('#sh'),sel=sh&&sh.querySelector('[name=cur]'),note=sh&&sh.querySelector('#fxn');if(!sel)return;
 const upd=async()=>{const c=sel.value;if(c===from){note.textContent='This is your current currency.';return}if(!cached(from,c))note.textContent="Getting today's rate…";
  try{const r=await rate(from,c);if(sel.value!==c)return;note.innerHTML=esc(rateText(from,c,r))+'. '+ATTR}catch(e){note.textContent=e.message+' You can still change only the symbol.'}};
 sel.onchange=upd;upd()}
function accountSheet(){const opener=document.activeElement;lock(true);const m=$('#modal'),dk=(document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches);
 m.innerHTML=`<div class="scrim" id="sc"><div class="sheet" id="sh" role="dialog" aria-modal="true" aria-label="Account"><div class="grab"></div><h3 class="serif">Account</h3><p class="sub" style="margin-top:-8px">${esc(user?user.email:'')}</p><div class="menu"><button data-act="theme">${ic('moon')}<span>${dk?'Switch to light mode':'Switch to dark mode'}</span></button><button data-act="csv">${ic('down')}<span>Export transactions (CSV)</span></button><button data-act="income">${ic('wallet')}<span>Starting amount or salary</span></button><button data-act="currency">${ic('wallet')}<span>Currency · ${curCode()} ${esc(sym().trim())}</span></button><button data-act="backup">${ic('down')}<span>Backup (JSON)</span></button><button data-act="restore">${ic('up')}<span>Restore backup</span></button><button data-act="signout" class="danger">${ic('logout')}<span>Sign out</span></button></div><button type="button" class="btn g" data-close>Close</button></div></div>`;
 const close=makeClose(m,opener);modal.close=close;m.querySelector('[data-close]').onclick=close;$('#sc').onclick=e=>{if(e.target.id==='sc'||(e.target.closest('[data-act]')&&!e.target.closest('[data-act=theme]')))close()};focusIn(m)}
export {baseModal,currencyModal,fundModal,payEntryModal,recvModal,taxPayModal,debtModal,debtPayModal,billModal,payModal,accountSheet,modal,fld,amt,catSel,txForm,txSave,openTx,picker,catModal,goalModal};
