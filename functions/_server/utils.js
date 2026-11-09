export function respond(body,status=200) {return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});}
export function emailValid(s) {return typeof s==='string' && s.length<=160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
export function clean(x,n=120) {return (typeof x==='string'?x:'').trim().slice(0,n);}
export function safeURL(s) {return !s || (/^https:\/\/[^\s]+$/i.test(s)&&s.length<310);}
export function sameOrigin(request) {
 const origin=request.headers.get('origin');
 if (!origin) return true; // HTML form submissions may omit Origin. Turnstile protects submission.
 try{return new URL(origin).host===new URL(request.url).host;}catch(_){return false;}
}
export async function checkTurnstile(token,request,env) {
 if (!env.TURNSTILE_SECRET_KEY || !token) return false;
 const data=new FormData();data.append('secret',env.TURNSTILE_SECRET_KEY);data.append('response',token);
 const ip=request.headers.get('CF-Connecting-IP');if(ip)data.append('remoteip',ip);
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:data});
 if (!response.ok) return false;
 const result=await response.json();
 return !!result.success && (!result.hostname||result.hostname===new URL(request.url).hostname);
}
export function readyEmail(env){return !!(env.RESEND_API_KEY&&env.EMAIL_FROM&&env.CONTACT_TO_EMAIL);}
export async function sendEmail(env,{to,subject,text,replyTo}) {
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,text,reply_to:replyTo?[replyTo]:undefined})});
 if(!r.ok)throw Error('Email provider rejected delivery');
 return r.json();
}
export function fail(code=503){return respond({ok:false,error:code===503?'Submissions are not yet available. Please contact us directly.':code===429?'Please try again later.':'Please check your details and try again.'},code);}
