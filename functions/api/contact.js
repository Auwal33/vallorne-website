import {respond,clean,emailValid,sameOrigin,checkTurnstile,readyEmail,sendEmail,fail} from '../_server/utils.js';
export async function onRequestPost({request,env}){
 if (!readyEmail(env)||!env.TURNSTILE_SECRET_KEY) return fail(503);
 if (!sameOrigin(request)) return fail(403);
 if (Number(request.headers.get('content-length')||0)>16000) return fail(413);
 let d;try{d=await request.json();}catch(_){return fail(400);}
 if (d.website) return respond({ok:true}); // silent honeypot
 const name=clean(d.name,100), email=clean(d.email,160), message=clean(d.message,3800), org=clean(d.organisation,130), phone=clean(d.phone,50);
 if(name.length<2||!emailValid(email)||message.length<10) return fail(400);
 if(!await checkTurnstile(d['cf-turnstile-response'],request,env))return fail(400);
 try {
  await sendEmail(env,{to:env.CONTACT_TO_EMAIL,subject:'Vallorne website enquiry: '+(org||'General'),text:`Name: ${name}\nEmail: ${email}\nOrganisation: ${org}\nPhone: ${phone}\n\n${message}`,replyTo:email});
  return respond({ok:true});
 } catch(_){return fail(503);}
}
