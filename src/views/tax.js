import {$,esc,ic,php,PHP,curCode,peso,sym} from '../util.js';
import {phpRate,phpStale,refreshPHP} from '../fx.js';
import {T,cur,S} from '../state.js';
import {money,topbar,fold} from '../ui.js';
const BR=[[0,0,0],[250000,0,.15],[400000,22500,.20],[800000,102500,.25],[2000000,402500,.30],[8000000,2202500,.35]];
const bracketTax=a=>{let r=BR[0];for(const b of BR)if(a>b[0])r=b;return a<=250000?0:r[1]+(a-r[0])*r[2]};
const bracketIdx=a=>{let i=0;BR.forEach((b,k)=>{if(a>b[0])i=k});return i};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
// Salary figures are entered in your budget currency. Philippine tax is worked out in pesos, so they are converted at today's rate
// and the results are shown back in your currency. With a peso budget nothing is converted.
const pk=()=>phpRate()||1;
const toP=v=>v/pk();
const pd=n=>peso(Math.round(n*pk()*100)/100);
function empCalc(total,th,dm){total=toP(total);dm=clamp(toP(dm||0),0,total);const g=total-dm,msc=clamp(Math.round(g/500)*500,5000,35000),sss=msc*.05,ph=clamp(g,10000,100000)*.025,pi=g>1500?Math.min(g,10000)*.02:g*.01;
 const contrib=sss+ph+pi,taxM=g-contrib,mw=clamp(parseInt(S.tax.mw)||12,1,12),ab=Math.max(0,toP(S.tax.abs||0)),ob=Math.max(0,toP(S.tax.ob||0)),thirteenth=th?Math.max(0,g*mw-ab)/12:0,annualTaxable=taxM*12,annualTax=bracketTax(annualTaxable),tax=annualTax/12,net=g-contrib-tax+dm,excess=Math.max(0,thirteenth+ob-90000),extraTax=bracketTax(annualTaxable+excess)-annualTax,net13=thirteenth-extraTax;
 return{basic:g,dm,total,msc,sss,ph,pi,contrib,taxM,annualTaxable,annualTax,tax,net,thirteenth,mw,ab,ob,excess,extraTax,net13,idx:bracketIdx(annualTaxable)}}
function taxRes(){const T=S.tax,g=T.gross;
 if(!(g>0))return `<div class="empty">${ic('tax','lg')}Enter a monthly amount to see the breakdown.</div>`;
 if(T.mode==='freelance'){const G=toP(g)*12,o8=G<=3000000?Math.max(0,G-250000)*.08:null,pt=G*.03,osd=bracketTax(G*.6)+pt,full=bracketTax(G)+pt;
  const opts=[['8% flat on gross',`Gross receipts over ${pd(250000)} taxed at 8%. No percentage tax. Only if yearly receipts are ${pd(3000000)} or less.`,o8],['Graduated + 40% standard deduction','40% of receipts deducted, graduated rates on the rest, plus 3% percentage tax.',osd],['Graduated, no deductions','Rates on full receipts, plus 3% percentage tax. Shown for reference; expenses you can prove would lower it.',full]];
  const valid=opts.filter(o=>o[2]!=null),best=Math.min(...valid.map(o=>o[2]));
  return `<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${opts.map(o=>`<div class="opt ${o[2]===best?'best':''}"><small>${o[2]===best?'Lowest tax':'Option'}</small><b>${esc(o[0])}</b><b class="n serif">${o[2]==null?'Not eligible':pd(o[2])}</b>${o[2]==null?'':`<small>per year · set aside ${pd(o[2]/12)} a month · ${(o[2]/G*100).toFixed(1)}% of receipts</small>`}<small style="margin-top:6px">${o[1]}</small></div>`).join('')}</div>
  <p class="note" style="margin-top:14px">Freelancer mode covers income tax only. SSS, PhilHealth and Pag-IBIG are not included because self-employed members choose their own contribution level. Quarterly filing (1701Q) and the option chosen in your first quarterly return apply for the whole year.</p>`}
 const r=empCalc(g,T.th,T.dm),parts=[['Take-home',r.net,'var(--lime)'],['SSS',r.sss,'var(--mint)'],['PhilHealth',r.ph,'var(--pink)'],['Pag-IBIG',r.pi,'hsl(262 75% 80%)'],['Withholding tax',r.tax,'var(--ink)']];
 const eff=(r.annualTax+r.extraTax)/(r.basic*12+r.thirteenth+r.ob)*100,next=BR[r.idx+1],cut=r.net/2;
 return `<div class="tg"><section class="panel" data-sec="Payslip"><div class="sec"><h2>Monthly payslip</h2><span class="mute">Estimate</span></div>
 <div class="lab">Take-home pay</div><div class="bal serif" style="font-size:44px">${money(Math.round(r.net*pk()*100)/100)}</div><div class="sub">About <b>${pd(cut)}</b> per semi-monthly payday · ${(r.net/toP(g)*100).toFixed(1)}% of gross</div>
 <div class="stack" role="img" aria-label="Where your gross salary goes">${parts.map(p=>`<i style="width:${p[1]/g*100}%;background:${p[2]}"></i>`).join('')}</div>
 <div class="pr"><span class="l"><span class="dot" style="background:var(--ink);opacity:.25"></span><span><b>Monthly gross compensation</b><small>Taxed and used for contributions</small></span></span><b>${pd(r.basic)}</b></div>${r.dm?`<div class="pr"><span class="l"><span class="dot" style="background:var(--ink);opacity:.25"></span><span><b>De minimis</b><small>Not taxed, added back to take-home</small></span></span><b>+${pd(r.dm)}</b></div>`:''}
 <div class="pr"><span class="l"><span class="dot" style="background:var(--mint)"></span><span><b>SSS</b><small>5% of salary credit ${pd(r.msc)}</small></span></span><b>−${pd(r.sss)}</b></div>
 <div class="pr"><span class="l"><span class="dot" style="background:var(--pink)"></span><span><b>PhilHealth</b><small>2.5% of salary, your half of 5%</small></span></span><b>−${pd(r.ph)}</b></div>
 <div class="pr"><span class="l"><span class="dot" style="background:hsl(262 75% 80%)"></span><span><b>Pag-IBIG</b><small>2%, capped at ${pd(200)}</small></span></span><b>−${pd(r.pi)}</b></div>
 <div class="pr"><span class="l"><span class="dot" style="background:var(--ink)"></span><span><b>Withholding tax</b><small>Averaged over 12 months</small></span></span><b>−${pd(r.tax)}</b></div>
 <div class="pr"><span class="l"><span class="dot" style="background:var(--lime);box-shadow:inset 0 0 0 1px rgba(15,27,31,.3)"></span><span><b>Take-home</b></span></span><b>${pd(r.net)}</b></div>
 <div class="tiles"><div class="tile t-lime"><small>Tax per year</small><div><b class="serif">${pd(r.annualTax+r.extraTax)}</b><em>on ${pd(r.annualTaxable+r.excess)} taxable${r.extraTax?`, incl. ${pd(r.extraTax)} from 13th month`:''}</em></div></div><div class="tile t-mint"><small>Effective tax rate</small><div><b class="serif">${eff.toFixed(1)}%</b><em>of yearly gross</em></div></div><div class="tile t-pink"><small>Contributions / year</small><div><b class="serif">${pd(r.contrib*12)}</b><em>SSS, PhilHealth, Pag-IBIG</em></div></div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:18px">${T.link?`<span class="note">Your Overview income is <b style="color:var(--ink)">${pd(r.net)}</b>, this take-home pay.</span>`:`<button class="btn a" style="background:var(--lime);color:#0f1b1f" data-act="useNet">Use ${pd(r.net)} as my monthly income</button><span class="note">Your Overview income is currently ${pd(S.income)}.</span>`}</div></section>
 <aside class="panel"><div class="sec"><h2>Tax brackets</h2><span class="mute">Per year</span></div><div style="display:flex;flex-direction:column;gap:4px">${BR.map((b,i)=>{const hi=BR[i+1]?BR[i+1][0]:null;return `<div class="brk ${i===r.idx?'on':''}"><span>${hi?`${pd(b[0])} – ${pd(hi)}`:`Over ${pd(b[0])}`}</span><span>${i===0?'No tax':Math.round(b[2]*100)+'%'}</span>${i===r.idx?`<small>${next?`You are here. ${pd(next[0]-r.annualTaxable)} more taxable income reaches ${Math.round(next[2]*100)}%.`:'You are in the top bracket.'}</small>`:''}</div>`}).join('')}</div>
 </aside></div>${thirteenthHtml(r)}${cutHtml(r)}`}
function thirteenthHtml(r){const T=S.tax;if(!T.th)return `<section class="panel fade"><div class="sec"><h2>13th month pay</h2><span class="mute">Switched off</span></div><p class="note">Tick "Include 13th month pay" above to see it.</p></section>`;
 const free=Math.min(90000,r.thirteenth+r.ob),room=Math.max(0,90000-r.thirteenth-r.ob);
 return fold('th','13th month pay','Paid on or before Dec 24',`
 <p class="note" style="margin-bottom:14px">(${pd(r.basic)} × ${r.mw} months ${r.ab?`− ${pd(r.ab)} absences `:''}) ÷ 12 = <b style="color:var(--ink)">${pd(Math.round(r.thirteenth*100)/100)}</b>. Only basic pay counts. De minimis, allowances and overtime do not.</p>
 <div class="tiles" style="margin-top:0"><div class="tile t-lime"><small>13th month pay</small><div><b class="serif">${pd(r.thirteenth)}</b><em>${pd(r.thirteenth/12)} builds up each month</em></div></div><div class="tile t-mint"><small>Tax-free room left</small><div><b class="serif">${pd(room)}</b><em>of ${pd(90000)} with other bonuses</em></div></div><div class="tile t-pink"><small>You receive</small><div><b class="serif">${pd(r.net13)}</b><em>${r.extraTax?`after ${pd(r.extraTax)} tax on ${pd(r.excess)} over the limit`:'no tax, no contributions'}</em></div></div></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px"><button class="btn g" data-act="add13">Add ${pd(r.net13)} to my budget as December income</button><span class="note">Creates an income entry dated Dec 24, ${cur.y}.</span></div>`)}
function cutHtml(r){const C=S.tax.cut,items=[['sss','SSS',r.sss],['ph','PhilHealth',r.ph],['pi','Pag-IBIG',r.pi],['tax','Withholding tax',r.tax]];
 const part=(k,v,i)=>C[k]==='split'?v/2:(C[k]==='15'?(i===0?v:0):(i===1?v:0));
 const cuts=[0,1].map(i=>{const ded=items.map(it=>[it[1],part(it[0],it[2],i)]).filter(d=>d[1]>0),pay=r.basic/2,dm=r.dm/2,net=pay+dm-ded.reduce((s,d)=>s+d[1],0);return{pay,dm,ded,net}});
 const opt=(k,v,l)=>`<option value="${v}" ${C[k]===v?'selected':''}>${l}</option>`;
 return fold('cut','Per payday','15th and 30th cutoffs',`
 <p class="note" style="margin:-4px 0 14px">Pick the payday each deduction comes out on. Match this to your payslip.</p>
 <div class="cuts">${items.map(it=>`<label class="pill p"><span style="font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap">${it[1]}</span><select data-cut="${it[0]}" style="text-align:right">${opt(it[0],'split','Split in two')}${opt(it[0],'15','15th only')}${opt(it[0],'30','30th only')}</select><span class="ch">${ic('sel','sm')}</span></label>`).join('')}</div>
 <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${cuts.map((c,i)=>`<div class="opt"><small>${i===0?'15th payday':'30th payday (end of month)'}</small><b class="n serif">${pd(Math.round(c.net*100)/100)}</b><small>take-home</small>
 <div class="pr" style="margin-top:8px"><span>Half of monthly compensation</span><b>${pd(c.pay)}</b></div>${c.dm?`<div class="pr"><span>De minimis share</span><b>+${pd(c.dm)}</b></div>`:''}${c.ded.map(d=>`<div class="pr"><span>${d[0]}</span><b>−${pd(Math.round(d[1]*100)/100)}</b></div>`).join('')||'<div class="pr"><span class="mute">No deductions on this payday</span></div>'}</div>`).join('')}</div>
 <p class="note" style="margin-top:12px">Both paydays add up to ${pd(Math.round((cuts[0].net+cuts[1].net)*100)/100)} a month.</p>`)}
function tax(){
 // Older data kept these figures in pesos. Move them into the budget currency once the rate is known.
 if(S.currency!=='PHP'&&S.tax.cur===undefined&&phpRate()){const r=phpRate();['gross','dm','abs','ob'].forEach(k=>{S.tax[k]=Math.round((S.tax[k]||0)*r*100)/100});S.tax.cur=S.currency;syncIncome();save()}
const T=S.tax,g=T.gross,emp=T.mode==='employee';
 if(phpStale())refreshPHP(()=>{syncIncome();import('../render.js').then(m=>m.render())});
 return (curCode()!=='PHP'?`<section class="panel fade" data-nojump><p class="note" style="margin:0">Philippine tax is worked out in pesos. ${phpRate()?`Your figures are in ${curCode()} and are converted at 1 PHP = ${phpRate().toLocaleString('en-US',{maximumSignificantDigits:4})} ${curCode()}, so everything below is shown in ${curCode()}.`:`Today's exchange rate is not available yet, so amounts are shown as entered.`}</p></section>`:'')+`<section class="panel fade" data-sec="Inputs"><div class="hrow" style="align-items:center"><div class="seg" id="tm"><button data-tm="employee" class="${emp?'on':''}">Employee</button><button data-tm="freelance" class="${!emp?'on':''}">Freelancer</button></div>
 <div class="checks"><label class="chk"><input type="checkbox" id="tlink" ${T.link?'checked':''}>Use my take-home pay as my monthly income (${peso(S.income)})</label>${emp?`<label class="chk"><input type="checkbox" id="tth" ${T.th?'checked':''}>Include 13th month pay</label>`:''}</div></div>
 <div class="cgrid"><label class="fld">${emp?`Total gross pay (${sym()}/month)`:`Gross receipts (${sym()}/month)`}<input id="tg" type="number" inputmode="decimal" min="0" step="any" value="${g||''}"></label>
 ${emp?`<label class="fld">De minimis (${sym()}/month)<input id="tdm" type="number" inputmode="decimal" min="0" step="any" value="${T.dm||0}"></label>`:''}
 ${emp&&T.th?`<label class="fld">Months worked<select id="t13m">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${(T.mw||12)===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label><label class="fld">Unpaid absences (${sym()})<input id="t13a" type="number" inputmode="decimal" min="0" step="any" value="${T.abs||0}"></label><label class="fld">Other bonuses (${sym()})<input id="t13o" type="number" inputmode="decimal" min="0" step="any" value="${T.ob||0}"></label>`:''}</div>
 <p class="note" style="margin-top:14px">${T.link?'Your Overview and budgets use the take-home pay calculated below, so editing your pay here updates them everywhere.':`Your Overview income is set separately (${peso(S.income)}). Tick the box above to follow your take-home pay instead.`}${emp?' Enter your total gross pay before deductions. Basic compensation is that amount minus de minimis.':''}</p></section>
 <div id="taxres" class="fade">${taxRes()}</div>
 <section class="panel fade" data-sec="Sources"><details class="src"><summary>Sources and assumptions</summary><ul>
 <li>SSS: RA 11199, 15% of monthly salary credit, employee pays 5%, credit from ₱5,000 to ₱35,000 in ₱500 steps. Source: SweldoPH SSS guide (sweldoph.com/guides/sss-contribution).</li>
 <li>PhilHealth: 5% premium split equally, income floor ₱10,000, ceiling ₱100,000. Source: SweldoPH PhilHealth guide (sweldoph.com/guides/philhealth-contribution).</li>
 <li>Pag-IBIG: 2% of monthly pay, maximum fund salary ₱10,000, so ₱200 at most. Source: SweldoPH Pag-IBIG guide (sweldoph.com/guides/pagibig-contribution).</li>
 <li>Income tax brackets, 2023 onwards (15% to 35%): BIR / Philippine Information Agency release on lower rates in 2023, under TRAIN (RR 11-2018). Fixed amounts in the table follow from those rates.</li>
 <li>Freelancer options (8% on receipts over ₱250,000 up to ₱3M, 3% percentage tax under graduated rates, 40% optional standard deduction): TFA.ph, citing NIRC Sec. 24 as amended.</li>
 <li>De minimis benefits (rice, uniform, medical and similar allowances) are exempt only up to BIR limits per item, and any excess is taxable. I did not check those limits here, so confirm your ₱3,000 is fully within them.</li>
 <li>13th month pay: total basic salary earned in the year divided by 12 (PD 851), paid by December 24, reduced by unpaid absences. The first ₱90,000 of 13th month pay and other bonuses is tax-exempt. Source: TotalCalcHub 13th month guide; ₱90,000 ceiling also in the Filepino de minimis guide.</li>
 <li>Your employer's payroll may withhold differently month to month. Treat this as a planning estimate, and confirm with your payroll or an accountant before filing.</li></ul></details></section>`}
// Take-home pay per month, used as the budget income while the Salary page is linked.
function takeHome(T){
 if(!(T.gross>0))return 0;
 if(T.mode==='employee')return Math.round(empCalc(T.gross,T.th,T.dm).net*100)/100;
 const G=toP(T.gross)*12,o8=G<=3000000?Math.max(0,G-250000)*.08:Infinity,pt=G*.03,best=Math.min(o8,bracketTax(G*.6)+pt,bracketTax(G)+pt);
 return Math.round((toP(T.gross)-best/12)*100)/100;
}
function syncIncome(){if(S.tax.link){const r=phpRate();S.income=Math.round(takeHome(S.tax)*(r||1)*100)/100}}
export {tax,taxRes,empCalc,takeHome,syncIncome,bracketTax,pk,pd};
