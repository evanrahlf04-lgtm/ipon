
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:d});
// Display currency. Amounts are stored as plain numbers, so switching changes the symbol and format, not the values.
const CURRENCIES=[['PHP','Philippine peso'],['USD','US dollar'],['EUR','Euro'],['GBP','British pound'],['JPY','Japanese yen'],['AUD','Australian dollar'],['CAD','Canadian dollar'],['NZD','New Zealand dollar'],['SGD','Singapore dollar'],['HKD','Hong Kong dollar'],['CNY','Chinese yuan'],['KRW','South Korean won'],['INR','Indian rupee'],['MYR','Malaysian ringgit'],['IDR','Indonesian rupiah'],['THB','Thai baht'],['VND','Vietnamese dong'],['AED','UAE dirham'],['SAR','Saudi riyal'],['QAR','Qatari riyal'],['KWD','Kuwaiti dinar']];
const PHP={code:'PHP',sym:'₱',dp:2};
function curInfo(code){try{const f=new Intl.NumberFormat('en',{style:'currency',currency:code,currencyDisplay:'narrowSymbol'});let sym=f.formatToParts(1).filter(p=>p.type==='currency').map(p=>p.value).join('');if(/[A-Za-z]$/.test(sym))sym+=' ';return{code,sym,dp:f.resolvedOptions().maximumFractionDigits}}catch(e){return PHP}}
let CUR=PHP;
const setCurrency=code=>{const c=CURRENCIES.some(x=>x[0]===code)?code:'PHP';if(c!==CUR.code)CUR=c==='PHP'?PHP:curInfo(c)};
const curNow=()=>CUR,sym=()=>CUR.sym,curCode=()=>CUR.code;
function fmtMoney(n,c){const v=Math.abs(n||0),w=c.dp===0||Math.abs(v-Math.round(v))<.005;return(n<0?'−':'')+c.sym+v.toLocaleString('en-US',{minimumFractionDigits:w?0:c.dp,maximumFractionDigits:w?0:c.dp})}
// Amounts in the chosen currency, and amounts that are always pesos (Philippine tax).
const peso=n=>fmtMoney(n,CUR),php=n=>fmtMoney(n,PHP);
const pad=n=>String(n).padStart(2,'0'),ds=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const HUES=[68,173,356,262,28,205,100,320,45,140];
const ICONS=['bus','house','bolt','drop','fork','coffee','building','shirt','wifi','bank','cart','tag','heart','phone','gift'];
const uid=()=>Math.random().toString(36).slice(2,9);
const ic=(n,c='')=>`<svg class="i ${String(c).replace(/[^\w -]/g,'')}" aria-hidden="true"><use href="#i-${String(n).replace(/[^a-z0-9-]/gi,'')}"/></svg>`;
export {CURRENCIES,setCurrency,curNow,sym,curCode,php,PHP,$,esc,fmt,peso,pad,ds,MN,MF,HUES,ICONS,uid,ic};
