/* Vallorne forms client. All confirmations depend on a verified server response. */
(function () {
  'use strict';
  const ar = document.documentElement.lang === 'ar';
  const translations = {
    network: ar ? 'تعذّر الاتصال. يرجى المحاولة لاحقاً.' : 'Unable to connect. Please try again later.',
    unavailable: ar ? 'خدمة الإرسال غير مفعلة بعد. يرجى التواصل معنا مباشرة.' : 'Online submissions are not yet enabled. Please contact us directly.',
    sending: ar ? 'جارٍ الإرسال...' : 'Sending...',
    sent: ar ? 'تم إرسال رسالتك بنجاح.' : 'Your enquiry has been sent.',
    applied: ar ? 'تم استلام طلبك بنجاح. شكراً لك.' : 'Your application has been received. Thank you.',
    subscribed: ar ? 'يرجى مراجعة بريدك لتأكيد اشتراكك.' : 'Please check your email to confirm your subscription.',
    whatsapp: ar ? 'لم يُفعّل رقم واتساب الخاص بالمؤسسة بعد.' : 'The business WhatsApp number has not been configured.',
    cv: ar ? 'يرجى إرفاق ملف PDF لا يتجاوز 4 ميغابايت.' : 'Please attach a PDF file no larger than 4 MB.',
    captcha: ar ? 'يرجى إكمال فحص التحقق قبل الإرسال.' : 'Please complete the verification before submitting.'
  };
  let config = {contactReady:false,careersReady:false,newsletterReady:false,whatsappNumber:'',turnstileSiteKey:''};
  const forms = [...document.querySelectorAll('.vallorne-contact-form, .vp-career-form, .v8-newsletter-form')];
  if (!forms.length) return;
  let turnstileLoaded = false;
  let turnstilePromise = null;

  function status(form, text) {
    const el = form.querySelector('.contact-form-status,.vp-career-status,.v8-newsletter-status');
    if (el) { el.textContent=text;el.setAttribute('role','status');el.classList.add('show'); }
  }
  function setBusy(form, busy) {
    const btn=form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (busy) {btn.dataset.oldText=btn.textContent;btn.textContent=translations.sending;}
    else if (btn.dataset.oldText) {btn.textContent=btn.dataset.oldText;delete btn.dataset.oldText;}
    btn.disabled=busy;
  }
  function addTurnstile() {
    if (!config.turnstileSiteKey) return Promise.resolve(false);
    if (turnstileLoaded) return Promise.resolve(true);
    if (!turnstilePromise) {
      turnstilePromise = new Promise((resolve) => {
        const js=document.createElement('script');
        js.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        js.onload=()=>{turnstileLoaded=!!window.turnstile;resolve(turnstileLoaded);};
        js.onerror=()=>resolve(false);
        document.head.appendChild(js);
      });
    }
    return turnstilePromise;
  }
  function initWidgets() {
    addTurnstile().then(ok => {
      if (!ok) return;
      forms.forEach(form => {
        const host=form.querySelector('[data-turnstile-host]');
        if (!host || host.dataset.turnstileReady) return;
        window.turnstile.render(host,{sitekey:config.turnstileSiteKey,language:ar?'ar':'en'});
        host.dataset.turnstileReady='yes';
      });
    });
  }
  function token(form) {
    return form.querySelector('[name="cf-turnstile-response"]')?.value||'';
  }
  async function submit(form, endpoint, data, successText) {
    if (!token(form)) { status(form,translations.captcha);return; }
    setBusy(form,true);status(form,'');
    try {
      const response=await fetch(endpoint,{method:'POST',body:data,headers:(data instanceof FormData?{}:{'Content-Type':'application/json'}),credentials:'same-origin'});
      let result={};try{result=await response.json();}catch(_){}
      if (!response.ok || !result.ok) { status(form,(result.error && String(result.error).slice(0,180)) || translations.network);return; }
      form.reset();status(form,successText);
    } catch (_) {status(form,translations.network);}
    finally {setBusy(form,false);if(window.turnstile){const host=form.querySelector('[data-turnstile-host]');if(host)try{window.turnstile.reset(host);}catch(_){}}}
  }
  fetch('/api/config',{credentials:'same-origin',cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error();return r.json();})
    .then(c=>{config={...config,...c};initWidgets();})
    .catch(()=>{});

  forms.forEach(form => form.addEventListener('submit', function(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const isContact=form.classList.contains('vallorne-contact-form');
    const isCareer=form.classList.contains('vp-career-form');
    if(isContact) {
      if (!config.contactReady) return status(form,translations.unavailable);
      const fields=Object.fromEntries(new FormData(form).entries());
      submit(form,'/api/contact',JSON.stringify(fields),translations.sent);
    } else if(isCareer) {
      if (!config.careersReady) return status(form,translations.unavailable);
      const cv=form.querySelector('[name="cv"]')?.files[0];
      if(!cv||!cv.name.toLowerCase().endsWith('.pdf')||cv.size>4*1024*1024||cv.size<100) return status(form,translations.cv);
      submit(form,'/api/careers',new FormData(form),translations.applied);
    } else {
      if (!config.newsletterReady) return status(form,translations.unavailable);
      const data=Object.fromEntries(new FormData(form).entries());
      data.consent='yes';
      submit(form,'/api/newsletter',JSON.stringify(data),translations.subscribed);
    }
  }));

  document.querySelectorAll('[data-whatsapp-action]').forEach(button=>button.addEventListener('click',()=>{
    const form=button.closest('form');
    if (!config.whatsappNumber) {status(form,translations.whatsapp);return;}
    if (!form.reportValidity()) return;
    const fields=Object.fromEntries(new FormData(form).entries());
    const msg=(ar?'استفسار إلى فالورن':'Enquiry for Vallorne')+'\n'+
      (ar?'الاسم: ':'Name: ')+(fields.name||'')+'\n'+
      (ar?'المدرسة: ':'School: ')+(fields.organisation||'')+'\n'+
      (ar?'البريد: ':'Email: ')+(fields.email||'')+'\n\n'+(fields.message||'');
    const number=config.whatsappNumber.replace(/\D/g,'');
    if(!number) return status(form,translations.whatsapp);
    window.open('https://wa.me/'+encodeURIComponent(number)+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
    status(form,ar?'افتح واتساب واضغط إرسال لإكمال المحادثة.':'WhatsApp opened. Please press Send in WhatsApp to complete the message.');
  }));
})();
