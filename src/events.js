import {$,peso,ds,HUES,uid,ic,MN,sym,php} from './util.js';
import {T,cur,tl,S,setCur,setView,setQ,setFt,setFc,setTl,setS,isCur,dim,emptyState,norm,save,mk,cat,calc,PAGE,clean} from './state.js';
import {signOut} from './session.js';
import {toggleTheme} from './theme.js';
import {toast} from './ui.js';
import {modal,fld,amt,openTx,catModal,goalModal,accountSheet,billModal,payModal,debtModal,debtPayModal,payEntryModal,recvModal,taxPayModal,fundModal,currencyModal} from './modals.js';
import {settleGoal} from './goals.js';
import {refreshLive} from './fx.js';
import {setStab} from './views/salary.js';
import {setBscope,getBscope} from './views/budgets.js';
import {setRtab} from './views/analytics.js';
import {takeHome} from './views/tax.js';
import {setPtab} from './views/bills.js';
import {settleDebt} from './debts.js';
import {planHtml} from './views/debts.js';
import {occ} from './bills.js';
// Opens the latest payment of a bill month so it can be corrected or deleted.
function lastPay(o){const b=o.b,l=S.tx.filter(t=>t.type==='expense'&&(t.billId?t.billId===b.id&&(t.bm||t.date.slice(0,7))===o.key:b.lg&&t.catId===b.catId&&t.date.startsWith(o.key))).sort((a,c)=>a.date.localeCompare(c.date)).pop();return l?openTx(l):toast('No payment found')}
import {saveFile,csv} from './files.js';
import {render} from './render.js';
import {taxRes,empCalc,syncIncome} from './views/tax.js';
import {txPart} from './views/home.js';
// Re-draws only the transaction list so typing in search never rebuilds the whole page.
// Keeps the "use my take-home" label showing the current income while typing.
function linkLabel(){const c=$('#tlink');if(c&&c.nextSibling)c.nextSibling.textContent='Use my take-home pay as my monthly income ('+peso(S.income)+')'}
function refreshList(){const l=$('#txlist');if(!l)return;const p=txPart();l.innerHTML=p.html;const c=$('#tcount');if(c)c.textContent=p.count+' total'}
document.addEventListener('click',e=>{const t=e.target,A=t.closest('[data-act]'),act=A&&A.dataset.act;
 const nv=t.closest('.nav[data-v]');if(nv){setView(nv.dataset.v);render();return window.scrollTo({top:0})}
 const v2=t.closest('[data-v2]');if(v2){setView(v2.dataset.v2);render();return window.scrollTo({top:0})}
 if(t.closest('#theme'))return toggleTheme();
 const tm=t.closest('[data-tm]');if(tm){S.tax.mode=tm.dataset.tm;syncIncome();save();return render()}
 const sc=t.closest('[data-sc]');if(sc){const el=document.querySelector('.tpls');if(el)el.scrollBy({left:+sc.dataset.sc*Math.max(220,el.clientWidth*.8),behavior:'smooth'});return}
 if(t.closest('#collapse')){const ap=$('#app'),op=ap.classList.toggle('open');t.closest('#collapse').setAttribute('aria-expanded',op);t.closest('#collapse').setAttribute('aria-label',op?'Collapse sidebar':'Expand sidebar');t.closest('#collapse').title=op?'Collapse sidebar':'Expand sidebar';t.closest('#collapse').querySelector('.lbl').textContent=op?'Collapse':'Expand';try{localStorage.setItem('ipon-side',op?'1':'0')}catch(x){}return}
 const mo=t.closest('[data-mo]');if(mo){const q2=mo.dataset.mo.split('-').map(Number);setCur({y:q2[0],m:q2[1]});return render()}
 const mm=t.closest('[data-m]');if(mm){const d=new Date(cur.y,cur.m+ +mm.dataset.m,1);setCur({y:d.getFullYear(),m:d.getMonth()});return render()}
 const ed=t.closest('[data-edit]');if(ed)return openTx(S.tx.find(x=>x.id===ed.dataset.edit));
 const bo=v=>{const [id,k]=(v||'').split('|'),b=S.bills.find(x=>x.id===id);return b?occ(b,+k.slice(0,4),+k.slice(5)-1):null};
 const py=t.closest('[data-pay]');if(py){const o=bo(py.dataset.pay);if(!o)return;
  if(o.rem<=0)return lastPay(o);
  const e={id:uid(),date:T,type:'expense',catId:o.b.catId,billId:o.b.id,bm:o.key,amount:o.rem,note:o.b.name+' payment',...(o.b.debtId?{debtId:o.b.debtId}:{}),...(o.b.goalId?{goalId:o.b.goalId}:{})};
  S.tx.push(e);if(o.b.debtId)settleDebt(o.b.debtId);if(o.b.goalId)settleGoal(o.b.goalId);save();render();return toast(`Paid ${o.b.name} ${peso(o.rem)}`,()=>{S.tx=S.tx.filter(x=>x!==e);save();render()})}
 const po=t.closest('[data-payopen]');if(po){const o=bo(po.dataset.payopen);return o&&payModal(o)}
 const lp=t.closest('[data-lastpay]');if(lp){const o=bo(lp.dataset.lastpay);return o&&lastPay(o)}
 const sk=t.closest('[data-skip]');if(sk){const o=bo(sk.dataset.skip);if(!o)return;o.b.skip=(o.b.skip||[]).concat(o.key);save();render();return toast(`Skipped ${o.b.name} for ${MN[o.m]}`,()=>{o.b.skip=o.b.skip.filter(x=>x!==o.key);save();render()})}
 const bs=t.closest('[data-bscope]');if(bs){setBscope(bs.dataset.bscope);return render()}
 const br=t.closest('[data-bud-reset]');if(br){const c=cat(br.dataset.budReset);if(c.mb){delete c.mb[mk()]}save();render();return toast('Back to the usual budget for '+MN[cur.m])}
 const rt=t.closest('[data-rtab]');if(rt){setRtab(rt.dataset.rtab);render();return window.scrollTo({top:0})}
 const ue=t.closest('[data-useextra]');if(ue){S.debtPlan.extra=+ue.dataset.useextra;save();setPtab('debts');setView('bills');render();window.scrollTo({top:0});return toast('Extra debt payment set. See the payoff plan.')}
 const st=t.closest('[data-stab]');if(st){setStab(st.dataset.stab);render();return window.scrollTo({top:0})}
 const ep=t.closest('[data-editpay]');if(ep)return payEntryModal(S.pay.find(x=>x.id===ep.dataset.editpay));
 const rv=t.closest('[data-recv]');if(rv)return recvModal(S.pay.find(x=>x.id===rv.dataset.recv));
 const pt=t.closest('[data-ptab]');if(pt){setPtab(pt.dataset.ptab);render();return window.scrollTo({top:0})}
 const dm=t.closest('[data-dm]');if(dm){S.debtPlan.method=dm.dataset.dm;save();return render()}
 const ed2=t.closest('[data-editdebt]');if(ed2)return debtModal(S.debts.find(x=>x.id===ed2.dataset.editdebt));
 const pd=t.closest('[data-paydebt]');if(pd)return debtPayModal(S.debts.find(x=>x.id===pd.dataset.paydebt));
 const eb=t.closest('[data-editbill]');if(eb)return billModal(S.bills.find(x=>x.id===eb.dataset.editbill));
 const ec=t.closest('[data-editcat]');if(ec)return catModal(cat(ec.dataset.editcat));
 const eg=t.closest('[data-editgoal]');if(eg)return goalModal(S.goals.find(x=>x.id===eg.dataset.editgoal));
 const fg=t.closest('[data-fund]');if(fg)return fundModal(S.goals.find(x=>x.id===fg.dataset.fund));
 const pi=t.closest('[data-ic]');if(pi){pi.closest('.picks').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===pi));pi.closest('.fld').querySelector('input[name=icon]').value=pi.dataset.ic;return}
 const ph=t.closest('[data-hue]');if(ph){ph.closest('.picks').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===ph));ph.closest('.fld').querySelector('input[name=hue]').value=ph.dataset.hue;return}
 const sg=t.closest('#seg [data-ty]');if(sg){document.querySelectorAll('#seg button').forEach(x=>x.classList.toggle('on',x===sg));$('#cw').hidden=sg.dataset.ty==='income';return}
 if(!act)return;
 if(act==='add'&&(A.dataset.ty||'expense')==='expense'&&!S.cats.length)return toast('Add a category first');
 if(act==='add')return openTx({id:uid(),date:isCur()?T:ds(cur.y,cur.m,1),type:A.dataset.ty||'expense',catId:S.cats[0]&&S.cats[0].id,amount:'',note:''},true);
 if(act==='income'){const extra=calc().income-S.income;
  return modal('Monthly income',fld('Monthly income ('+sym()+')','a','number',`inputmode="decimal" step="0.01" min="0" required value="${S.income||''}" placeholder="0"`,'big')+`<p class="note">This amount counts in every month. Income you log as a transaction is added to that one month only${extra>0?` (this month has ${peso(extra)} extra)`:''}.${S.tax.track?' Right now your Pay log sets your income, so this fixed amount is not used until you turn that off on the Salary page.':''}${S.tax.link?' Right now it follows your take-home pay from the Salary page, and saving a different amount stops that.':''}</p>`,f=>{const v=parseFloat(f.get('a'));if(!(v>=0))return false;if(v!==S.income)S.tax.link=false;S.income=v;toast('Income updated')})}
 if(act==='useNet'){const T=S.tax,old=S.income,ol=T.link;T.link=true;syncIncome();save();render();return toast(`Income now follows your take-home, ${peso(S.income)}`,()=>{S.income=old;T.link=ol;save();render()})}
 if(act==='add13'){const T=S.tax,r=empCalc(T.gross,T.th,T.dm),e={id:uid(),date:`${cur.y}-12-24`,type:'income',catId:null,amount:Math.round(r.net13*100)/100,note:'13th month pay'};S.tx.push(e);save();render();return toast('Added to December income',()=>{S.tx=S.tx.filter(x=>x!==e);save();render()})}
 if(act==='csv')return saveFile(`ipon-transactions.csv`,csv(),'text/csv');
 if(act==='backup')return saveFile('ipon-backup.json',JSON.stringify(S,null,2),'application/json');
 if(act==='restore')return $('#file').click();
 if(act==='addpay'){const k=S.tax.mode==='freelance'?'freelance':'salary',g=S.tax.gross>0&&k==='salary'?Math.round(takeHome(S.tax)/2*100)/100:'';return payEntryModal({id:uid(),kind:k,src:'',net:g,gross:0,paid:true,date:isCur()?T:ds(cur.y,cur.m,1),due:'',note:''},true)}
 if(act==='taxpay')return taxPayModal();
 if(act==='adddebt'){setPtab('debts');return debtModal({id:uid(),name:'',type:'card',apr:0,min:0,due:0,hue:356,bal0:0,asOf:T},true)}
 if(act==='addbill')return billModal({id:uid(),name:'',amount:0,rep:'monthly',due:0,catId:S.cats[0]&&S.cats[0].id,from:''},true);
 if(act==='addcat')return catModal({id:uid(),name:'',budget:0,due:0,icon:'tag',hue:HUES[S.cats.length%HUES.length]},true);
 if(act==='addgoal')return goalModal({id:uid(),name:'',target:0,saved:0,base:0},true);
 if(act==='wipe'){if(!confirm('Delete all your budget data? This cannot be undone.'))return;setS(emptyState());norm();save();toast('All data deleted');return render()}
 if(act==='signout')return signOut();
 if(act==='more'){setTl(tl+PAGE());return refreshList()}
 if(act==='theme'){toggleTheme();return accountSheet()}
 if(act==='currency')return currencyModal();
 if(act==='fxrefresh'){toast('Refreshing rates…');return refreshLive(true).then(i=>{render();toast(Date.now()-i.fetched<6e4?'Rates refreshed':'Rates are already up to date')}).catch(()=>toast('Could not get exchange rates. Check your connection.'))}
 if(act==='account')return accountSheet()});
document.addEventListener('change',e=>{if(e.target.id==='alon'){S.alerts.on=e.target.checked;save();return render()}if(e.target.id==='alwarn'){S.alerts.warn=+e.target.value;save();return render()}if(e.target.id==='ttrack'){S.tax.track=e.target.checked;save();return render()}if(e.target.id==='fopt'){S.tax.fopt=e.target.value;save();return render()}if(e.target.id==='pst'){$('#pdue').hidden=e.target.value==='in';return}if(e.target.id==='brep'){$('#bmo').hidden=e.target.value==='once';$('#bon').hidden=e.target.value!=='once';return}if(e.target.id==='t13m'||e.target.id==='t13a'||e.target.id==='t13o'){const k={t13m:'mw',t13a:'abs',t13o:'ob'}[e.target.id];S.tax[k]=Math.max(0,parseFloat(e.target.value)||0);save();$('#taxres').innerHTML=taxRes();return}if(e.target.dataset&&e.target.dataset.cut){S.tax.cut[e.target.dataset.cut]=e.target.value;save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='tlink'){S.tax.link=e.target.checked;syncIncome();save();return render()}if(e.target.id==='tth'){S.tax.th=e.target.checked;save();return render()}if(e.target.id==='fc'){setFc(e.target.value);setTl(PAGE());return refreshList()}if(e.target.id==='ft2'){setFt(e.target.value);setTl(PAGE());return refreshList()}const b=e.target.closest('[data-bud]');if(b){const c=cat(b.dataset.bud),v=parseFloat(b.value);if(v>=0){if(getBscope()==='month'&&v!==c.budget){c.mb=Object.assign(c.mb||{},{[mk()]:v})}else{if(getBscope()==='month'&&c.mb)delete c.mb[mk()];else c.budget=v}save();setTimeout(render,0);toast(getBscope()==='month'?'Budget set for '+MN[cur.m]:'Budget updated')}}});
document.addEventListener('input',e=>{if(e.target.id==='dx'){S.debtPlan.extra=Math.max(0,parseFloat(e.target.value)||0);save();$('#planres').innerHTML=planHtml();return}if(e.target.id==='t13a'||e.target.id==='t13o'){S.tax[e.target.id==='t13a'?'abs':'ob']=Math.max(0,parseFloat(e.target.value)||0);save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='tdm'){S.tax.dm=Math.max(0,parseFloat(e.target.value)||0);syncIncome();save();$('#taxres').innerHTML=taxRes();linkLabel();return}if(e.target.id==='tg'){S.tax.gross=Math.max(0,parseFloat(e.target.value)||0);syncIncome();save();$('#taxres').innerHTML=taxRes();linkLabel();return}if(e.target.id==='q'){setQ(e.target.value);setTl(PAGE());refreshList()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.close)modal.close()});
$('#file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(f.size>5e6){e.target.value='';return toast('That file is too large to be an Ipon backup')}const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.cats)||!Array.isArray(d.tx))throw 0;const c=clean(d);if(!c)throw 0;setS(c);norm();save();render();toast('Backup restored')}catch(x){toast('That file is not an Ipon backup')}};r.readAsText(f);e.target.value=''});
let drag=null,swallow=false;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.tpls');if(!el||e.pointerType!=='mouse'||e.button!==0)return;drag={el,x:e.clientX,l:el.scrollLeft,m:false}});
document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5){drag.m=true;drag.el.classList.add('drag')}if(drag.m)drag.el.scrollLeft=drag.l-dx});
document.addEventListener('pointerup',()=>{if(!drag)return;if(drag.m)swallow=true;drag.el.classList.remove('drag');drag=null;setTimeout(()=>{swallow=false},0)});
document.addEventListener('click',e=>{if(swallow){e.stopPropagation();e.preventDefault()}},true);
// Swipe left/right on a page with a month picker to change month.
let sx=0,sy=0,st=0,skip=true;
document.addEventListener('touchstart',e=>{const p=e.touches[0];sx=p.clientX;sy=p.clientY;st=Date.now();skip=!!e.target.closest('.tpls,.tplot,input,select,textarea,#modal,#auth,.side')||!document.querySelector('.mon')},{passive:true});
document.addEventListener('touchend',e=>{if(skip)return;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<80||Math.abs(dy)>50||Date.now()-st>600)return;const d=new Date(cur.y,cur.m+(dx<0?1:-1),1);setCur({y:d.getFullYear(),m:d.getMonth()});render()},{passive:true});
