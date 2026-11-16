import "./styles.css";
import './events.js';
import {$} from './util.js';
import {initTheme} from './theme.js';
import {start} from './session.js';
// This page should only run as itself, never inside another site's frame (clickjacking).
if(__FRAME_GUARD__&&self!==top){document.body.textContent='This page cannot be shown inside another site.';throw new Error('framed')}
initTheme();
(function(){let v=null;try{v=localStorage.getItem('ipon-side')}catch(x){}const open=v===null?innerWidth>=1100:v==='1',ap=$('#app'),b=$('#collapse');ap.classList.toggle('open',open);b.setAttribute('aria-expanded',open);b.querySelector('.lbl').textContent=open?'Collapse':'Expand'})();
start();
