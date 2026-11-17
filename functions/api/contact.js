import {respond,clean,boundedJSON,emailValid,sameOrigin,checkTurnstile,contactConfigured,sendEmail,fail} from '../_server/utils.js';
export async function onRequestPost({request,env}){
 if (!contactConfigured(env)) return fail(503);
 if (!sameOrigin(request)) return fail(403);
 let d;try{d=await boundedJSON(request,16000);}catch(e){return fail(e.message==='too_large'?413:400);}
 if (d.website) return respond({ok:true}); // silent honeypot
 const name=clean(d.name,100), email=clean(d.email,160), message=clean(d.message,3800), org=clean(d.organisation,130), phone=clean(d.phone,50);
 if(name.length<2||!emailValid(email)||message.length<10) return fail(400);
 if(!await checkTurnstile(d['cf-turnstile-response'],request,env))return fail(400);
 try {
  await sendEmail(env,{to:env.CONTACT_TO_EMAIL,subject:'Vallorne website enquiry: '+(org||'General'),text:`Name: ${name}\nEmail: ${email}\nOrganisation: ${org}\nPhone: ${phone}\n\n${message}`,replyTo:email});
  return respond({ok:true});
 } catch(_){return fail(503);}
}
