import {respond,clean,emailValid,safeURL,sameOrigin,checkTurnstile,readyEmail,sendEmail,fail} from '../_server/utils.js';
const LIMIT=4*1024*1024;
export async function onRequestPost({request,env}){
 if (!readyEmail(env)||!env.CAREERS_TO_EMAIL||!env.CV_BUCKET||!env.TURNSTILE_SECRET_KEY) return fail(503);
 if (!sameOrigin(request)) return fail(403);
 if (Number(request.headers.get('content-length')||0)>LIMIT+40000) return fail(413);
 let form;try{form=await request.formData();}catch(_){return fail(400);}
 if(form.get('website'))return respond({ok:true});
 const name=clean(form.get('name'),90),email=clean(form.get('email'),160),area=clean(form.get('area'),120),country=clean(form.get('country'),120),portfolio=clean(form.get('portfolio'),310),details=clean(form.get('details'),2200),consent=form.get('consent');
 if(name.length<2||!emailValid(email)||!area||!details||!safeURL(portfolio)||consent!=='yes')return fail(400);
 const cv=form.get('cv');
 if(!(cv instanceof File)||!cv.name.toLowerCase().endsWith('.pdf')||cv.size>LIMIT||cv.size<100)return fail(400);
 const buffer=await cv.arrayBuffer();
 if(new TextDecoder().decode(buffer.slice(0,5))!=='%PDF-')return fail(400);
 if(!await checkTurnstile(form.get('cf-turnstile-response'),request,env))return fail(400);
 const id=crypto.randomUUID(), key='private-applications/'+new Date().toISOString().slice(0,10)+'/'+id+'.pdf';
 try {
  await env.CV_BUCKET.put(key,buffer,{httpMetadata:{contentType:'application/pdf'},customMetadata:{received:new Date().toISOString(),applicantRef:id,retention:'90d'}});
  try{
    await sendEmail(env,{to:env.CAREERS_TO_EMAIL,subject:'Vallorne expression of interest: '+area,text:`Application reference: ${id}\nName: ${name}\nEmail: ${email}\nCountry/time zone: ${country}\nArea: ${area}\nPortfolio: ${portfolio}\nExperience: ${details}\n\nPrivate CV file: ${key}\nOpen CV securely in your private Cloudflare R2 bucket. Do not expose it through the public site.`,replyTo:email});
  }catch(err){await env.CV_BUCKET.delete(key);throw err;}
  return respond({ok:true,reference:id});
 }catch(_){return fail(503);}
}
