import {$,esc} from './util.js';

// Sticky "jump to" bar: one chip per section of the current page.
const MIN=3;
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;

// Sections are anything tagged data-sec, plus panels whose first heading names them.
function sections(){
 const out=[];
 document.querySelectorAll('#main [data-sec],#main .panel,#main section.full').forEach(el=>{
  if(el.hasAttribute('data-nojump')||out.includes(el))return;
  if(!el.dataset.sec){const h=el.querySelector(':scope > .sec > h2');if(!h)return;el.dataset.sec=h.textContent.trim()}
  out.push(el);
 });
 return out;
}

let bar=null,secs=[];

function spy(){

 if(!bar||!bar.isConnected)return;
 const line=bar.getBoundingClientRect().bottom+24;
 // Side-by-side panels sit at about the same height, so take the earliest one near the lowest top that has passed the line.
 const tops=secs.map(el=>el.isConnected?el.getBoundingClientRect().top:Infinity),best=Math.max(-Infinity,...tops.filter(v=>v<=line));
 let on=Math.max(0,tops.findIndex(v=>v<=line&&v>=best-40));
 // At the very bottom the last chip wins, even if the last section is short.
 if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)on=secs.length-1;
 bar.querySelectorAll('button').forEach((b,i)=>{
  const is=i===on;
  b.classList.toggle('on',is);b.setAttribute('aria-current',is?'true':'false');
  if(is&&bar.dataset.on!==String(on)){bar.dataset.on=on;bar.scrollTo({left:b.offsetLeft-bar.clientWidth/2+b.offsetWidth/2,behavior:still()?'auto':'smooth'})}
 });
}

export function buildJump(){
 bar=null;
 const top=$('#main .top');
 secs=sections();
 if(!top||secs.length<MIN)return;
 bar=document.createElement('nav');
 bar.className='jump';bar.setAttribute('aria-label','Jump to section');
 bar.innerHTML=secs.map((el,i)=>`<button type="button" data-jump="${i}">${esc(el.dataset.sec)}</button>`).join('');
 top.after(bar);
 spy();
}

document.addEventListener('click',e=>{
 const b=e.target.closest('[data-jump]');if(!b)return;
 secs=sections();
 const el=secs.find(s=>s.dataset.sec===b.textContent)||secs[+b.dataset.jump];if(!el)return;
 el.scrollIntoView({behavior:still()?'auto':'smooth',block:'start'});
});
addEventListener('scroll',spy,{passive:true});
addEventListener('resize',spy);
