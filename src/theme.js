import {TK} from './state.js';

const mq=matchMedia('(prefers-color-scheme:dark)');
const root=document.documentElement;
export const isDark=()=>root.dataset.theme?root.dataset.theme==='dark':mq.matches;

// Keeps the toggle icon and the browser/status-bar colour in step with the active theme.
function paint(){
 const dk=isDark(),meta=document.querySelector('meta[name=theme-color]'),use=document.querySelector('#theme use');
 if(meta)meta.setAttribute('content',dk?'#12141a':'#f3eeea');
 if(use)use.setAttribute('href',dk?'#i-sun':'#i-moon');
 const b=document.querySelector('#theme');if(b){b.title=dk?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-label',b.title)}
}

export function toggleTheme(){
 root.classList.add('tt');
 root.dataset.theme=isDark()?'light':'dark';
 try{localStorage.setItem(TK,root.dataset.theme)}catch(e){}
 paint();
 setTimeout(()=>root.classList.remove('tt'),400);
}

export function initTheme(){
 try{const t=localStorage.getItem(TK);if(t)root.dataset.theme=t}catch(e){}
 paint();
 mq.addEventListener('change',paint);
}
