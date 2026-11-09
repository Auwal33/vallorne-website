import {respond,readyEmail} from '../_server/utils.js';
export async function onRequestGet({env}){
 const email=readyEmail(env);const turnstile=!!(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET_KEY);
 return respond({
  contactReady:email&&turnstile,
  careersReady:email&&turnstile&&!!(env.CAREERS_TO_EMAIL&&env.CV_BUCKET),
  newsletterReady:turnstile&&!!(env.BREVO_API_KEY&&env.BREVO_LIST_ID&&env.BREVO_DOI_TEMPLATE_ID&&env.BREVO_CONFIRM_REDIRECT_URL),
  whatsappNumber:String(env.WHATSAPP_NUMBER||'').replace(/\D/g,''),
  turnstileSiteKey:turnstile?String(env.TURNSTILE_SITE_KEY):''
 });
}
