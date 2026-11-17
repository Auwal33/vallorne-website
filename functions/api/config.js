import {respond,contactConfigured,careersConfigured,newsletterConfigured} from '../_server/utils.js';
export async function onRequestGet({env}){
 const turnstile=!!(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET_KEY);
 return respond({
  contactReady:contactConfigured(env),
  careersReady:careersConfigured(env),
  newsletterReady:newsletterConfigured(env),
  whatsappNumber:String(env.WHATSAPP_NUMBER||'').replace(/\D/g,''),
  turnstileSiteKey:turnstile?String(env.TURNSTILE_SITE_KEY):''
 });
}
