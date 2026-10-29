import {$,peso,ds,HUES,uid,ic} from './util.js';
import {TK,T,cur,tl,S,setCur,setView,setQ,setFt,setFc,setTl,setS,isCur,dim,emptyState,norm,save,mk,cat} from './state.js';
import {signOut} from './session.js';
import {toast} from './ui.js';
import {modal,amt,openTx,catModal,goalModal,accountSheet} from './modals.js';
import {saveFile,csv} from './files.js';
import {render} from './render.js';
import {taxRes,empCalc} from './views/tax.js';
import {txPart} from './views/home.js';
function toggleTheme(){const r=document.documentElement,dk=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.classList.add('tt');r.dataset.theme=dk?'light':'dark';try{localStorage.setItem(TK,r.dataset.theme)}catch(x){}setTimeout(()=>r.classList.remove('tt'),400)}
// Re-draws only the transaction list so typing in search never rebuilds the whole page.
function refreshList(){const l=$('#txlist');if(!l)return;const p=txPart();l.innerHTML=p.html;const c=$('#tcount');if(c)c.textContent=p.count+' total'}
document.addEventListener('click',e=>{const t=e.target,A=t.closest('[data-act]'),act=A&&A.dataset.act;
 const nv=t.closest('.nav[data-v]');if(nv){setView(nv.dataset.v);render();return window.scrollTo({top:0})}
 const v2=t.closest('[data-v2]');if(v2){setView(v2.dataset.v2);render();return window.scrollTo({top:0})}
 if(t.closest('#theme'))return toggleTheme();
 const tm=t.closest('[data-tm]');if(tm){S.tax.mode=tm.dataset.tm;save();return render()}
 const sc=t.closest('[data-sc]');if(sc){const el=document.querySelector('.tpls');if(el)el.scrollBy({left:+sc.dataset.sc*Math.max(220,el.clientWidth*.8),behavior:'smooth'});return}
 if(t.closest('#collapse')){const ap=$('#app'),op=ap.classList.toggle('open');t.closest('#collapse').setAttribute('aria-expanded',op);t.closest('#collapse').setAttribute('aria-label',op?'Collapse sidebar':'Expand sidebar');t.closest('#collapse').title=op?'Collapse sidebar':'Expand sidebar';t.closest('#collapse').querySelector('.lbl').textContent=op?'Collapse':'Expand';try{localStorage.setItem('ipon-side',op?'1':'0')}catch(x){}return}
 const mo=t.closest('[data-mo]');if(mo){const q2=mo.dataset.mo.split('-').map(Number);setCur({y:q2[0],m:q2[1]});return render()}
 const mm=t.closest('[data-m]');if(mm){const d=new Date(cur.y,cur.m+ +mm.dataset.m,1);setCur({y:d.getFullYear(),m:d.getMonth()});return render()}
 const ed=t.closest('[data-edit]');if(ed)return openTx(S.tx.find(x=>x.id===ed.dataset.edit));
 const py=t.closest('[data-pay]');if(py){const c=cat(py.dataset.pay),k=mk(),paid=S.tx.find(x=>x.catId===c.id&&x.type==='expense'&&x.date.startsWith(k));
  if(paid)return openTx(paid);
  const e={id:uid(),date:isCur()?T:ds(cur.y,cur.m,Math.min(c.due||1,dim())),type:'expense',catId:c.id,amount:c.budget,note:c.name+' payment'};
  if(!(c.budget>0))return openTx(e,true);
  S.tx.push(e);save();render();return toast(`Paid ${c.name} ${peso(c.budget)}`,()=>{S.tx=S.tx.filter(x=>x!==e);save();render()})}
 const ec=t.closest('[data-editcat]');if(ec)return catModal(cat(ec.dataset.editcat));
 const eg=t.closest('[data-editgoal]');if(eg)return goalModal(S.goals.find(x=>x.id===eg.dataset.editgoal));
 const fg=t.closest('[data-fund]');if(fg){const g=S.goals.find(x=>x.id===fg.dataset.fund);return modal('Add to '+g.name,amt(),f=>{const a=parseFloat(f.get('a'));if(!(a>0))return false;g.saved+=a;toast('Added to '+g.name)})}
 const pi=t.closest('[data-ic]');if(pi){pi.closest('.picks').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===pi));pi.closest('.fld').querySelector('input[name=icon]').value=pi.dataset.ic;return}
 const ph=t.closest('[data-hue]');if(ph){ph.closest('.picks').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===ph));ph.closest('.fld').querySelector('input[name=hue]').value=ph.dataset.hue;return}
 const sg=t.closest('#seg [data-ty]');if(sg){document.querySelectorAll('#seg button').forEach(x=>x.classList.toggle('on',x===sg));$('#cw').hidden=sg.dataset.ty==='income';return}
 if(!act)return;
 if(act==='add'&&(A.dataset.ty||'expense')==='expense'&&!S.cats.length)return toast('Add a category first');
 if(act==='add')return openTx({id:uid(),date:isCur()?T:ds(cur.y,cur.m,1),type:A.dataset.ty||'expense',catId:S.cats[0]&&S.cats[0].id,amount:'',note:''},true);
 if(act==='income')return modal('Monthly income',amt(S.income),f=>{const v=parseFloat(f.get('a'));if(!(v>0))return false;S.income=v;toast('Income updated')});
 if(act==='useNet'){const T=S.tax,g=T.auto?S.income:T.gross,n=Math.round(empCalc(g,T.th,T.dm).net),old=S.income,oa=T.auto,og=T.gross;T.gross=g;T.auto=false;S.income=n;save();render();return toast(`Budget income set to ${peso(n)}`,()=>{S.income=old;T.auto=oa;T.gross=og;save();render()})}
 if(act==='add13'){const T=S.tax,g=T.auto?S.income:T.gross,r=empCalc(g,T.th,T.dm),e={id:uid(),date:`${cur.y}-12-24`,type:'income',catId:null,amount:Math.round(r.net13*100)/100,note:'13th month pay'};S.tx.push(e);save();render();return toast('Added to December income',()=>{S.tx=S.tx.filter(x=>x!==e);save();render()})}
 if(act==='csv')return saveFile(`ipon-transactions.csv`,csv(),'text/csv');
 if(act==='backup')return saveFile('ipon-backup.json',JSON.stringify(S,null,2),'application/json');
 if(act==='restore')return $('#file').click();
 if(act==='addcat')return catModal({id:uid(),name:'',budget:0,due:0,icon:'tag',hue:HUES[S.cats.length%HUES.length]},true);
 if(act==='addgoal')return goalModal({id:uid(),name:'',target:0,saved:0},true);
 if(act==='wipe'){if(!confirm('Delete all your budget data? This cannot be undone.'))return;setS(emptyState());norm();save();toast('All data deleted');return render()}
 if(act==='signout')return signOut();
 if(act==='more'){setTl(tl+30);return refreshList()}
 if(act==='theme'){toggleTheme();return accountSheet()}
 if(act==='account')return accountSheet()});
document.addEventListener('change',e=>{if(e.target.id==='t13m'||e.target.id==='t13a'||e.target.id==='t13o'){const k={t13m:'mw',t13a:'abs',t13o:'ob'}[e.target.id];S.tax[k]=Math.max(0,parseFloat(e.target.value)||0);save();$('#taxres').innerHTML=taxRes();return}if(e.target.dataset&&e.target.dataset.cut){S.tax.cut[e.target.dataset.cut]=e.target.value;save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='tauto'){S.tax.auto=e.target.checked;if(!S.tax.auto)S.tax.gross=S.income;save();return render()}if(e.target.id==='tth'){S.tax.th=e.target.checked;save();return render()}if(e.target.id==='fc'){setFc(e.target.value);setTl(30);return refreshList()}if(e.target.id==='ft2'){setFt(e.target.value);setTl(30);return refreshList()}const b=e.target.closest('[data-bud]');if(b){const c=cat(b.dataset.bud),v=parseFloat(b.value);if(v>=0){c.budget=v;save();render();toast('Budget updated')}}});
document.addEventListener('input',e=>{if(e.target.id==='t13a'||e.target.id==='t13o'){S.tax[e.target.id==='t13a'?'abs':'ob']=Math.max(0,parseFloat(e.target.value)||0);save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='tdm'){S.tax.dm=Math.max(0,parseFloat(e.target.value)||0);save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='tg'){S.tax.gross=parseFloat(e.target.value)||0;save();$('#taxres').innerHTML=taxRes();return}if(e.target.id==='q'){setQ(e.target.value);setTl(30);refreshList()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.close)modal.close()});
$('#file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.cats)||!Array.isArray(d.tx))throw 0;const old=S.tax;setS(Object.assign({income:0,goals:[]},d));norm(d.tax||old);save();render();toast('Backup restored')}catch(x){toast('That file is not an Ipon backup')}};r.readAsText(f);e.target.value=''});
let drag=null,swallow=false;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.tpls');if(!el||e.pointerType!=='mouse'||e.button!==0)return;drag={el,x:e.clientX,l:el.scrollLeft,m:false}});
document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5){drag.m=true;drag.el.classList.add('drag')}if(drag.m)drag.el.scrollLeft=drag.l-dx});
document.addEventListener('pointerup',()=>{if(!drag)return;if(drag.m)swallow=true;drag.el.classList.remove('drag');drag=null;setTimeout(()=>{swallow=false},0)});
document.addEventListener('click',e=>{if(swallow){e.stopPropagation();e.preventDefault()}},true);
// Swipe left/right on a page with a month picker to change month.
let sx=0,sy=0,st=0,skip=true;
document.addEventListener('touchstart',e=>{const p=e.touches[0];sx=p.clientX;sy=p.clientY;st=Date.now();skip=!!e.target.closest('.tpls,.tplot,input,select,textarea,#modal,#auth,.side')||!document.querySelector('.mon')},{passive:true});
document.addEventListener('touchend',e=>{if(skip)return;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<80||Math.abs(dy)>50||Date.now()-st>600)return;const d=new Date(cur.y,cur.m+(dx<0?1:-1),1);setCur({y:d.getFullYear(),m:d.getMonth()});render()},{passive:true});
