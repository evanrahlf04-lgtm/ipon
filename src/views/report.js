import {$,esc,peso,MN,MF,ic} from '../util.js';
import {now,cur,ft,S,mk,cat,monthSum,calc} from '../state.js';
import {tone,topbar} from '../ui.js';
function trendHtml(){
 const nowI=now.getFullYear()*12+now.getMonth(),curI=cur.y*12+cur.m;let end=Math.max(nowI,curI),start=end-5;if(curI<start){start=curI;end=start+5}
 const ms=[];for(let i=start;i<=end;i++){const y=Math.floor(i/12),m=i%12,s=monthSum(y,m);ms.push({i,y,m,e:s.e,inc:s.i,has:S.tx.some(t=>t.date.startsWith(mk(y,m))),cur:i===curI})}
 const top=Math.max(S.income,...ms.map(x=>x.e)),max=Math.ceil(top/10000)*10000||10000;
 const K=v=>v>=1000?'₱'+String(Math.round(v/100)/10).replace(/\.0$/,'')+'K':'₱'+Math.round(v);
 const withData=ms.filter(x=>x.has&&x.e>0),avg=withData.length?withData.reduce((s,x)=>s+x.e,0)/withData.length:0,hi=withData.slice().sort((a,b)=>b.e-a.e)[0];
 const c=ms.find(x=>x.cur),p=ms.find(x=>x.i===curI-1),delta=c&&p&&p.has&&c.has?c.e-p.e:null;
 const grid=[0,1,2,3,4].map(k=>`<div class="gl" style="bottom:${k*25}%"><span>${K(max/4*k)}</span></div>`).join('');
 const cols=ms.map(x=>{const h=x.e/max*100,left=x.inc-x.e,pct=x.inc?Math.round(x.e/x.inc*100):0;
  return `<button class="tcol ${x.cur?'cur':''} ${x.has?'':'nodata'}" data-mo="${x.y}-${x.m}" style="--h:${h}%" aria-label="${MN[x.m]} ${x.y}: spent ${peso(x.e)}"><span class="tv">${x.has?K(x.e):''}</span><span class="tb ${x.e>x.inc?'over':''}"></span><span class="tl">${MN[x.m]}</span>${x.has?`<span class="tip"><b>${MN[x.m]} ${x.y}</b><span>Spent ${peso(x.e)}</span><span>${left>=0?'Left '+peso(left):'Over by '+peso(-left)}</span><span>${pct}% of income</span></span>`:''}</button>`}).join('');
 return `<div class="panel fade" data-sec="Trend"><div class="sec"><h2>Spending, last 6 months</h2><div class="lg"><span><i class="sw"></i>Spent</span><span><i class="sw dash"></i>Income</span></div></div>
 <div class="tsum"><div><small>Average a month</small><b>${peso(Math.round(avg))}</b></div><div><small>Highest month</small><b>${hi?peso(hi.e):'–'}</b><em>${hi?MN[hi.m]+' '+hi.y:''}</em></div><div><small>${MN[cur.m]} vs last month</small><b class="${delta==null?'':delta>0?'dn':'up'}">${delta==null?'–':(delta>0?'+':'−')+peso(Math.abs(delta))}</b><em>${delta==null?'no earlier data':delta>0?'more spent':'less spent'}</em></div></div>
 <div class="tplot"><div class="pa">${grid}<div class="il" style="bottom:${S.income/max*100}%"><span>Income ${peso(S.income)}</span></div><div class="tcols">${cols}</div></div></div></div>`}
function report(){const s=calc(),months=[];for(let i=5;i>=0;i--){const d=new Date(cur.y,cur.m-i,1);months.push({y:d.getFullYear(),m:d.getMonth(),...monthSum(d.getFullYear(),d.getMonth())})}
 const mx=Math.max(1,...months.map(x=>x.e),S.income);const debt=S.cats.find(c=>/debt|loan/i.test(c.name));
 const cats=S.cats.filter(c=>s.by[c.id]).sort((a,b)=>s.by[b.id]-s.by[a.id]);
 return topbar('Report',`${MF[cur.m]} ${cur.y}`)+`<section class="full fade" style="display:flex;flex-direction:column;gap:26px"><div class="stats" data-sec="Totals" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><div class="stat"><small>Income</small><b class="serif">${peso(s.income)}</b></div><div class="stat"><small>Spent</small><b class="serif">${peso(s.spent)}</b></div><div class="stat"><small>Left</small><b class="serif">${peso(s.left)}</b></div><div class="stat"><small>Debt share of plan</small><b class="serif">${debt&&s.budget?Math.round(debt.budget/s.budget*100):0}%</b></div></div>
 ${trendHtml()}
 <div class="panel"><div class="sec"><h2>Where it went</h2></div><div class="hl">${cats.length?cats.map(c=>`<div class="hr">${tone(c.hue,c.icon)}<div><div class="t"><span>${esc(c.name)}</span><span>${peso(s.by[c.id])} · ${Math.round(s.by[c.id]/s.spent*100)}%</span></div><div class="bar"><i style="width:${s.by[c.id]/s.spent*100}%;background:hsl(${c.hue} 75% 48%)"></i></div></div></div>`).join(''):'<div class="mute">No spending this month.</div>'}</div></div>
 <div class="panel"><div class="sec"><h2>Your data</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn g" data-act="csv">${ic('down','sm')}Export CSV</button><button class="btn g" data-act="backup">${ic('down','sm')}Backup (JSON)</button><button class="btn g" data-act="restore">${ic('up','sm')}Restore backup</button><button class="btn r" data-act="wipe">Delete all my data</button></div><p class="mute" style="margin-top:10px;font-size:12px">Your data is saved to your account and cached on this device.</p></div></section>`}
export {report};
