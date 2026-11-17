import {respond,emailValid,clean,boundedJSON,sameOrigin,checkTurnstile,newsletterConfigured,fail} from '../_server/utils.js';
export async function onRequestPost({request,env}){
 if (!newsletterConfigured(env))return fail(503);
 if (!sameOrigin(request))return fail(403);
 let data;try{data=await boundedJSON(request,8000);}catch(e){return fail(e.message==='too_large'?413:400);}
 if(data.website)return respond({ok:true});
 const email=clean(data.email,160);
 if(!emailValid(email)||data.consent!=='yes')return fail(400);
 if(!await checkTurnstile(data['cf-turnstile-response'],request,env))return fail(400);
 try{
  const r=await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json','accept':'application/json'},body:JSON.stringify({email,includeListIds:[Number(env.BREVO_LIST_ID)],templateId:Number(env.BREVO_DOI_TEMPLATE_ID),redirectionUrl:env.BREVO_CONFIRM_REDIRECT_URL})});
  if(!r.ok)return fail(503);
  return respond({ok:true});
 }catch(_){return fail(503);}
}
