import "./styles.css";
import './events.js';
import {$} from './util.js';
import {TK} from './state.js';
import {start} from './session.js';
try{const t=localStorage.getItem(TK);if(t)document.documentElement.dataset.theme=t}catch(e){}
(function(){let v=null;try{v=localStorage.getItem('ipon-side')}catch(x){}const open=v===null?innerWidth>=1100:v==='1',ap=$('#app'),b=$('#collapse');ap.classList.toggle('open',open);b.setAttribute('aria-expanded',open);b.querySelector('.lbl').textContent=open?'Collapse':'Expand'})();
start();
