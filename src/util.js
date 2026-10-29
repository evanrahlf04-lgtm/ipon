
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:d});
const peso=n=>{const v=Math.abs(n||0),w=Math.abs(v-Math.round(v))<.005;return(n<0?'−':'')+'₱'+v.toLocaleString('en-PH',{minimumFractionDigits:w?0:2,maximumFractionDigits:w?0:2})};
const pad=n=>String(n).padStart(2,'0'),ds=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const HUES=[68,173,356,262,28,205,100,320,45,140];
const ICONS=['bus','house','bolt','drop','fork','coffee','building','shirt','wifi','bank','cart','tag','heart','phone','gift'];
const uid=()=>Math.random().toString(36).slice(2,9);
const ic=(n,c='')=>`<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
export {$,esc,fmt,peso,pad,ds,MN,MF,HUES,ICONS,uid,ic};
