import {$,ic} from './util.js';
import {T,S,save,cat} from './state.js';
import {toast} from './ui.js';
async function saveFile(name,data,mime){
 try{const dl=window.claude&&await claude.use('downloads');if(dl){await dl.save({filename:name,data});toast('Saved '+name);return}}catch(e){if(e&&e.code==='declined')return}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Downloaded '+name);return}catch(e){}
 try{await navigator.clipboard.writeText(data);toast('Copied to clipboard')}catch(e){toast('Export unavailable here')}}
function csv(){const r=[['Date','Type','Category','Note','Amount (PHP)']];S.tx.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>r.push([t.date,t.type,t.type==='income'?'':cat(t.catId).name,t.note,t.amount]));return r.map(x=>x.map(v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`).join(',')).join('\n')}
export {saveFile,csv};
