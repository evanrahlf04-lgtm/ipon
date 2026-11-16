// Live exchange rates from ExchangeRate-API's free open-access endpoint (no key, updated daily).
// Only a currency code is sent. Rates are checked, limited to the currencies Ipon offers, and cached
// for 12 hours in memory and on this device, so the app keeps working offline with the last rates.
import {S,save} from './state.js';
import {CURRENCIES,MN} from './util.js';

const API='https://open.er-api.com/v6/latest/',TTL=12*36e5,KEY='ipon-fx:';
const CODES=new Set(CURRENCIES.map(c=>c[0]));
const ATTR='<a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a>';
const mem={},pending={};

function load(base){try{const v=JSON.parse(localStorage.getItem(KEY+base)||'null');return v&&v.rates&&v.time?v:null}catch(e){return null}}

// All rates for one base currency. Uses the cache while fresh; if the network fails, falls back to an older copy.
async function table(base,force){
 if(!CODES.has(base))throw new Error('Unsupported currency');
 const c=mem[base]||load(base);
 if(c&&!force&&Date.now()-c.time<TTL)return mem[base]=c;
 // A forced refresh never hits the service more than once every 5 minutes.
 if(c&&force&&Date.now()-c.time<3e5)return mem[base]=c;
 if(pending[base])return pending[base];
 pending[base]=(async()=>{
  try{
   const r=await fetch(API+base);if(!r.ok)throw 0;
   const j=await r.json();
   if(!j||j.result!=='success'||j.base_code!==base||typeof j.rates!=='object')throw 0;
   const rates={};CODES.forEach(k=>{const v=Number(j.rates[k]);if(Number.isFinite(v)&&v>0&&v<1e7)rates[k]=v});
   const t={rates,time:Date.now(),updated:Number(j.time_last_update_unix)*1000||Date.now()};
   mem[base]=t;try{localStorage.setItem(KEY+base,JSON.stringify(t))}catch(e){}
   return t;
  }catch(e){if(c)return mem[base]=c;throw new Error('Could not get exchange rates. Check your connection.')}
  finally{delete pending[base]}
 })();
 return pending[base];
}

// How many `to` one `from` buys, with the date the rate was published.
async function rate(from,to){
 if(from===to)return{rate:1,updated:Date.now()};
 const t=await table(from),v=t.rates[to];
 if(!(v>0))throw new Error('No rate for '+to);
 return{rate:v,updated:t.updated}}
// Same, but only from what is already cached (for use while saving a form).
function cached(from,to){if(from===to)return 1;const t=mem[from]||load(from);return t&&t.rates[to]>0?t.rates[to]:null}

// ----- live value of money received in other currencies, against the budget currency -----
const baseTable=()=>{const b=S.currency;return mem[b]||load(b)};
// What 1 unit of `code` is worth in the budget currency right now, from cached rates (null if not known yet).
function liveRate(code){if(code===S.currency)return 1;const t=baseTable(),v=t&&t.rates[code];return v>0?1/v:null}
const liveInfo=()=>{const t=baseTable();return t?{updated:t.updated,fetched:t.time}:null};
const liveStale=()=>{const t=baseTable();return !t||Date.now()-t.time>36e5};
// Fetch the budget currency's table (all rates at once). force=true asks for new numbers.
async function refreshLive(force){const t=await table(S.currency,force);return{updated:t.updated,fetched:t.time}}

const when=ms=>{const d=new Date(ms);return`${d.getDate()} ${MN[d.getMonth()]} ${d.getFullYear()}`};
const fmtRate=v=>v>=100?v.toLocaleString('en-US',{maximumFractionDigits:2}):v>=1?v.toLocaleString('en-US',{maximumFractionDigits:4}):v.toLocaleString('en-US',{maximumSignificantDigits:4});
const rateText=(from,to,r)=>`1 ${from} = ${fmtRate(r.rate)} ${to} · updated ${when(r.updated)}`;

// Multiply every stored amount by r, used when switching the budget to a new currency.
// Philippine tax inputs stay in pesos and are not touched.
function convertAll(r){
 const R=v=>typeof v==='number'&&Number.isFinite(v)?Math.round(v*r*100)/100:v;
 S.income=R(S.income);['gross','dm','abs','ob'].forEach(k=>{if(typeof S.tax[k]==='number')S.tax[k]=R(S.tax[k])});
 S.cats.forEach(c=>{c.budget=R(c.budget);if(c.mb)Object.keys(c.mb).forEach(k=>{c.mb[k]=R(c.mb[k])})});
 S.tx.forEach(t=>{t.amount=R(t.amount)});
 S.goals.forEach(g=>{g.target=R(g.target);g.auto=R(g.auto);if(typeof g.base==='number')g.base=R(g.base)});
 S.bills.forEach(b=>{b.amount=R(b.amount)});
 S.debts.forEach(d=>{d.bal0=R(d.bal0);d.min=R(d.min);d.orig=R(d.orig)});
 S.pay.forEach(p=>{p.net=R(p.net);p.gross=R(p.gross)});
 S.debtPlan.extra=R(S.debtPlan.extra);
}

// The peso rate for the budget currency, used to convert take-home pay and freelancer tax.
const phpRate=()=>S.currency==='PHP'?1:(S.fxPHP&&S.fxPHP.rate>0?S.fxPHP.rate:null);
let refreshing=false;
async function refreshPHP(after){
 if(S.currency==='PHP'){delete S.fxPHP;return}
 if(refreshing)return;refreshing=true;
 try{const r=await rate('PHP',S.currency);S.fxPHP={rate:r.rate,updated:r.updated,time:Date.now()};save();if(after)after()}catch(e){}
 finally{refreshing=false}
}
const phpStale=()=>S.currency!=='PHP'&&(!S.fxPHP||!(S.fxPHP.time>0)||Date.now()-S.fxPHP.time>TTL);

export{rate,cached,rateText,convertAll,phpRate,refreshPHP,phpStale,ATTR,liveRate,liveInfo,liveStale,refreshLive,when};
