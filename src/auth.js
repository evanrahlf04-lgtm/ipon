import {$,esc,ic} from './util.js';
import {sb} from './sync.js';

const back=()=>location.origin+location.pathname;
const TITLES={
 signin:['Welcome back','Sign in to see your budget.'],
 signup:['Create your account','Your budget is private to your account.'],
 forgot:['Reset password','We will email you a link to choose a new one.'],
 recover:['Choose a new password','Use at least 8 characters.'],
 setup:['Setup needed','This copy of Ipon is not connected to a server yet.']
};

export function hideAuth(){const a=$('#auth');a.hidden=true;a.innerHTML=''}

export function showAuth(mode,opts={},msg=''){
 const a=$('#auth');a.hidden=false;
 const [h,sub]=TITLES[mode];
 const pw=mode==='signin'||mode==='signup'||mode==='recover';
 const email=mode!=='recover'&&mode!=='setup';
 const body=mode==='setup'
  ?`<p class="note">Set <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> in a <b>.env.local</b> file (see <b>.env.example</b>), then restart the dev server.</p>`
  :`<form id="af" class="authform" novalidate>
   ${email?`<label class="fld">Email<input name="e" type="email" autocomplete="email" required autofocus></label>`:''}
   ${pw?`<label class="fld">${mode==='recover'?'New password':'Password'}<input name="p" type="password" minlength="8" autocomplete="${mode==='signin'?'current-password':'new-password'}" required ${mode==='recover'?'autofocus':''}></label>`:''}
   <p class="amsg" id="am" role="alert">${esc(msg)}</p>
   <button class="btn" id="ab">${{signin:'Sign in',signup:'Create account',forgot:'Send reset link',recover:'Save password'}[mode]}</button>
  </form>
  <div class="alinks">${mode==='signin'?`<button type="button" data-go="forgot">Forgot password?</button><button type="button" data-go="signup">Create an account</button>`:mode==='signup'?`<button type="button" data-go="signin">I already have an account</button>`:mode==='forgot'?`<button type="button" data-go="signin">Back to sign in</button>`:''}</div>`;
 a.innerHTML=`<div class="authcard"><div class="logorow">${ic('logo','lg').replace('class="i lg"','class="logo"')}<span class="brand" style="display:block"><b>ipon</b><small>Mag-ipon tayo.</small></span></div><h1 class="serif">${h}</h1><p class="sub">${sub}</p>${body}</div>`;
 a.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showAuth(b.dataset.go));
 const f=$('#af');if(!f)return;
 f.onsubmit=async ev=>{
  ev.preventDefault();
  const say=(t,ok)=>{const m=$('#am');m.textContent=t;m.className='amsg'+(ok?' ok':'')},btn=$('#ab');
  const e=(f.e&&f.e.value||'').trim(),p=f.p?f.p.value:'';
  if(email&&!/^\S+@\S+\.\S+$/.test(e))return say('Enter a valid email address.');
  if(pw&&mode!=='signin'&&p.length<8)return say('Password must be at least 8 characters.');
  if(pw&&!p)return say('Enter your password.');
  btn.disabled=true;say('');
  try{
   if(mode==='signin'){
    const {error}=await sb.auth.signInWithPassword({email:e,password:p});
    if(error)throw error;
   }else if(mode==='signup'){
    const {data,error}=await sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:back()}});
    if(error)throw error;
    // Email confirmation is on, so there is no session until the link is opened.
    if(!data.session)return showAuth('signin',{},'Check your email to confirm your account, then sign in.'),$('#am').classList.add('ok');
   }else if(mode==='forgot'){
    const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:back()});
    if(error)throw error;
    return showAuth('signin',{},'If that email has an account, a reset link is on its way.'),$('#am').classList.add('ok');
   }else if(mode==='recover'){
    const {error}=await sb.auth.updateUser({password:p});
    if(error)throw error;
    const {data}=await sb.auth.getSession();
    opts.done&&opts.done(data.session);
   }
  }catch(err){
   const t=String(err&&err.message||err);
   say(/invalid login/i.test(t)?'Wrong email or password.':/not confirmed/i.test(t)?'Confirm your email first. Check your inbox.':t);
  }
  btn.disabled=false;
 };
}
