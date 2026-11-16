import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=!!(url&&key);
export const sb=configured?createClient(url,key):null;
let timer=null,pending=null,onError=()=>{};
export const setErrorHandler=f=>{onError=f};
export async function pull(uid){
 const {data,error}=await sb.from('user_data').select('data,updated_at').eq('user_id',uid).maybeSingle();
 if(error)throw error;
 return data;
}
async function send(){
 const p=pending;if(!p)return true;pending=null;
 // Refuse to upload an oversized document (the server may reject it too). It stays saved on this device.
 if(JSON.stringify(p.data).length>2e6){onError(new Error('Data too large to sync'));return false}
 const {error}=await sb.from('user_data').upsert({user_id:p.uid,data:p.data,updated_at:new Date(p.ts).toISOString()});
 if(error){pending=pending||p;onError(error);return false}
 return true;
}
// Debounced upload of the whole budget document; last write wins.
export function push(uid,data,ts){pending={uid,data,ts};clearTimeout(timer);timer=setTimeout(send,800)}
export function flush(){clearTimeout(timer);return send()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
