import {$} from './util.js';
import {user,setUser,setSaveHook,setView,setCur,now,loadLocal,clearLocal,adopt} from './state.js';
import {configured,sb,pull,push,flush,setErrorHandler} from './sync.js';
import {showAuth,hideAuth} from './auth.js';
import {render} from './render.js';
import {toast} from './ui.js';

const app=()=>$('#app');
setErrorHandler(()=>toast('Could not sync. Changes are kept on this device.'));

async function load(u){
 const local=loadLocal();let remote=null,failed=false;
 try{remote=await pull(u.id)}catch(e){failed=true}
 const rts=remote?Date.parse(remote.updated_at)||0:0;
 if(remote&&(!local||rts>=local.ts))adopt(remote.data,rts);
 else if(local){adopt(local.data,local.ts);if(!failed)push(u.id,local.data,local.ts)}
 else adopt(null,0);
 if(failed)toast('Offline. Showing the copy saved on this device.');
}

let recovering=false;
async function handleSession(session){
 if(recovering)return;
 if(!session){
  setUser(null);setSaveHook(null);adopt(null,0);
  app().hidden=true;showAuth('signin');return;
 }
 const u={id:session.user.id,email:session.user.email};
 if(user&&user.id===u.id){hideAuth();app().hidden=false;return}
 setUser(u);
 $('#main').innerHTML='<div class="empty">Loading your budget…</div>';
 hideAuth();app().hidden=false;
 await load(u);
 setSaveHook((data,ts)=>push(u.id,data,ts));
 setView('home');setCur({y:now.getFullYear(),m:now.getMonth()});
 render();
}

export async function signOut(){
 const ok=await flush();
 if(ok)clearLocal();
 await sb.auth.signOut();
}

async function demo(){
 const {demoState}=await import('./demo.js');
 setUser({id:'demo',email:'demo@local'});adopt(demoState(),Date.now());hideAuth();app().hidden=false;render();
}

export function start(){
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('demo'))return demo();
 if(!configured){app().hidden=true;showAuth('setup');return}
 sb.auth.onAuthStateChange((ev,session)=>{
  // Supabase asks that callbacks do not await its own calls, so defer the work.
  setTimeout(()=>{
   if(ev==='PASSWORD_RECOVERY'){recovering=true;app().hidden=true;showAuth('recover',{done:s=>{recovering=false;handleSession(s)}});return}
   handleSession(session);
  },0);
 });
}
