/* Cloudflare Pages Functions run on the Cloudflare Workers runtime.
   Server-side checks are mandatory; client validations are advisory only. */
export function respond(body, status = 200) {
  return new Response(JSON.stringify(body), {status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }});
}
export function emailValid(s) {return typeof s === 'string' && s.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
export function clean(x, n = 120) {return (typeof x === 'string' ? x : '').trim().slice(0, n);}
// Enforce the byte limit while reading, even when Content-Length is absent.
export async function boundedJSON(request, maxBytes) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw new Error('invalid_json');
  if (Number(request.headers.get('content-length') || 0) > maxBytes) throw new Error('too_large');
  if (!request.body) throw new Error('invalid_json');
  const reader = request.body.getReader();
  const chunks = []; let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {await reader.cancel(); throw new Error('too_large');}
      chunks.push(value);
    }
  } finally {try {reader.releaseLock();} catch {}}
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
  const data = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_json');
  return data;
}
export function safeURL(s) {return !s || (/^https:\/\/[^\s]+$/i.test(s) && s.length < 310);}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Privacy-safe server validation also requires Turnstile.
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
export async function checkTurnstile(token, request, env) {
  if (typeof token !== 'string' || !token || token.length > 2048 || !env.TURNSTILE_SECRET_KEY) return false;
  try {
    const data = new FormData();
    data.append('secret', env.TURNSTILE_SECRET_KEY);
    data.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP'); if (ip) data.append('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method:'POST', body:data});
    if (!response.ok) return false;
    const result = await response.json();
    const host = new URL(request.url).hostname;
    return result.success === true && result.hostname === host;
  } catch { return false; } // fail-closed on challenge validation failure
}
export function readyEmail(env) {return !!(env.RESEND_API_KEY && env.EMAIL_FROM);}
export function featureEnabled(env, name) {return env[name] === 'true';}
export function contactConfigured(env) {return featureEnabled(env,'CONTACT_FORM_ENABLED') && readyEmail(env) && !!(env.CONTACT_TO_EMAIL && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);}
export function careersConfigured(env) {return featureEnabled(env,'CAREERS_FORM_ENABLED') && readyEmail(env) && !!(env.CAREERS_TO_EMAIL && env.CV_BUCKET && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);}
export function newsletterConfigured(env) {return featureEnabled(env,'NEWSLETTER_FORM_ENABLED') && !!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.BREVO_API_KEY && env.BREVO_LIST_ID && env.BREVO_DOI_TEMPLATE_ID && env.BREVO_CONFIRM_REDIRECT_URL);}
export async function sendEmail(env,{to,subject,text,replyTo}) {
  const payload = {from: env.EMAIL_FROM, to: [to], subject, text};
  if (replyTo) payload.reply_to = replyTo; // Resend accepts string or string[]
  const r = await fetch('https://api.resend.com/emails', {
    method:'POST', headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Resend did not accept the email');
  return r.json();
}
export function fail(code = 503) {
  const messages = {
    400:'Please check your details and try again.',
    403:'The submission could not be verified.',
    413:'The file or request is too large. The PDF limit is 4 MB.',
    429:'Please try again later.',
    503:'Submissions are not yet available. Please contact us directly.'
  };
  return respond({ok:false,error:messages[code]||messages[400]},code);
}
