import {respond,clean,emailValid,safeURL,sameOrigin,checkTurnstile,careersConfigured,sendEmail,fail} from '../_server/utils.js';

const MAX_PDF_BYTES = 4 * 1024 * 1024; // 4 MiB (4,194,304 bytes)
const MAX_MULTIPART_BYTES = MAX_PDF_BYTES + 128 * 1024; // allow only modest form overhead

// Bound request body *before* calling formData(), including when Content-Length is omitted.
async function boundedMultipart(request) {
  const ct = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;\s*boundary=/i.test(ct)) throw new Error('invalid_form');
  const length = request.headers.get('content-length');
  if (length && Number(length) > MAX_MULTIPART_BYTES) throw new Error('too_large');
  if (!request.body) throw new Error('invalid_form');
  const reader = request.body.getReader();
  const chunks = []; let total = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > MAX_MULTIPART_BYTES) {await reader.cancel(); throw new Error('too_large');}
      chunks.push(value);
    }
  } finally {try {reader.releaseLock();} catch {}}
  const bytes = new Uint8Array(total); let i = 0;
  for (const chunk of chunks) {bytes.set(chunk,i);i += chunk.byteLength;}
  const safe = new Request(request.url,{method:'POST',headers:{'content-type':ct},body:bytes});
  return safe.formData();
}

async function isPDF(file) {
  if (!(file instanceof File) || file.size < 100 || file.size > MAX_PDF_BYTES || !/\.pdf$/i.test(file.name)) return false;
  if (file.type && !['application/pdf','application/octet-stream'].includes(file.type.toLowerCase())) return false;
  const header = new Uint8Array(await file.slice(0,8).arrayBuffer());
  if (String.fromCharCode(...header.slice(0,5)) !== '%PDF-') return false;
  // Do not rely solely on a .pdf extension or browser-provided MIME type.
  const trailer = new TextDecoder('latin1').decode(await file.slice(Math.max(0,file.size-2048)).arrayBuffer());
  return trailer.includes('%%EOF');
}

export async function onRequestPost({request,env}) {
  if (!careersConfigured(env)) return fail(503);
  if (!sameOrigin(request)) return fail(403);
  let form;
  try {form = await boundedMultipart(request);} catch (e) {return fail(e.message === 'too_large' ? 413 : 400);}
  if (form.get('website')) return respond({ok:true}); // honeypot. No storage/email.
  const name=clean(form.get('name'),90), email=clean(form.get('email'),160),
    area=clean(form.get('area'),120), country=clean(form.get('country'),120),
    portfolio=clean(form.get('portfolio'),310), details=clean(form.get('details'),2200);
  if (name.length<2 || !emailValid(email) || !area || details.length<5 || !safeURL(portfolio) || form.get('consent')!=='yes') return fail(400);
  const language=form.get('lang')==='ar'?'ar':'en';
  const cv=form.get('cv');
  if (cv instanceof File && cv.size > MAX_PDF_BYTES) return fail(413);
  if (!await isPDF(cv)) return fail(400);
  if (!await checkTurnstile(form.get('cf-turnstile-response'),request,env)) return fail(403);
  const allowedAreas=new Set([
    'School leadership & consulting', 'Curriculum, authorship & publishing', 'Book design, illustration & production',
    'القيادة المدرسية والاستشارات', 'المناهج والتأليف والنشر', 'تصميم الكتب والرسوم والإنتاج'
  ]);
  if (!allowedAreas.has(area)) return fail(400);
  const id=crypto.randomUUID();
  const key='private-applications/quarantine/'+new Date().toISOString().slice(0,10)+'/'+id+'.pdf';
  try {
    // The R2 bucket must remain private (no r2.dev or public custom domain).
    await env.CV_BUCKET.put(key,await cv.arrayBuffer(),{
      httpMetadata:{contentType:'application/pdf',contentDisposition:'attachment'},
      customMetadata:{received:new Date().toISOString(),applicantRef:id,retention:'90d',review:'unscanned'}
    });
    try {
      await sendEmail(env,{
        to:env.CAREERS_TO_EMAIL,
        subject:'Vallorne expression of interest: '+area,
        text:`Application reference: ${id}\nName: ${name}\nEmail: ${email}\nCountry / time zone: ${country}\nArea: ${area}\nPortfolio: ${portfolio}\nExperience: ${details}\n\nPRIVATE QUARANTINED PDF OBJECT KEY: ${key}\nRetrieve it only through authorised Cloudflare R2 access and scan it before opening. No public download link is issued.`,
        replyTo:email
      });
    } catch (err) {
      // If notification fails, do not keep an untracked CV or tell the applicant it succeeded.
      await env.CV_BUCKET.delete(key); throw err;
    }
    // Acknowledgment is a separate best-effort message; a failure cannot undo a received application.
    let acknowledgementSent=false;
    try {
      await sendEmail(env,{
        to:email,
        subject:language==='ar'?'فالورن | تأكيد استلام طلب الاهتمام':'Vallorne | Expression of interest received',
        text:language==='ar'
          ? `مرحباً ${name}،\n\nنشكرك على اهتمامك بالتعاون مع فالورن. لقد استلمنا طلبك.\n\nالرقم المرجعي: ${id}\n\nسنتواصل مع المتقدمين عند توفّر فرص مناسبة. لا تعني هذه الرسالة تقديم عرض عمل أو ضمان الرد.\n\nمع التحية،\nVallorne Educational Services UK`
          : `Dear ${name},\n\nThank you for your expression of interest in working with Vallorne. We received your submission.\n\nReference: ${id}\n\nOur team will contact applicants if a relevant opportunity arises. This acknowledgment does not constitute an offer or promise of a response.\n\nKind regards,\nVallorne Educational Services UK`
      });
      acknowledgementSent=true;
    } catch {console.warn('Vallorne acknowledgment not sent, reference:',id);}
    return respond({ok:true,reference:id,acknowledgementSent});
  } catch {return fail(503);}
}
