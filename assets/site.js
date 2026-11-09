(function(){
  function initHeritageCarousel(root){
    const track=root.querySelector('.heritage-track'),slides=[...root.querySelectorAll('.heritage-slide')],dots=[...root.querySelectorAll('.heritage-dot')],toggle=root.querySelector('.p5-carousel-toggle');
    if(!track||slides.length<2)return;let index=0,timer=null,paused=false,userPaused=false;
    const ar=(root.closest('[data-lang-shell]')||{}).dataset?.langShell==='ar';
    function show(i){index=(i+slides.length)%slides.length;track.style.transform='translateX('+(-index*100)+'%)';slides.forEach((s,n)=>{const active=n===index;s.classList.toggle('is-active',active);s.setAttribute('aria-hidden',active?'false':'true');});dots.forEach((d,n)=>{const active=n===index;d.classList.toggle('is-active',active);d.setAttribute('aria-pressed',active?'true':'false');});}
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    function start(){stop();if(userPaused||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;timer=setInterval(()=>{if(!paused)show(index+1);},5200);}
    function updateToggle(){if(!toggle)return;toggle.setAttribute('aria-pressed',userPaused?'true':'false');toggle.setAttribute('aria-label',userPaused?(ar?'تشغيل عرض الشرائح':'Play slideshow'):(ar?'إيقاف عرض الشرائح':'Pause slideshow'));toggle.textContent=userPaused?(ar?'تشغيل':'Play'):(ar?'إيقاف':'Pause');}
    dots.forEach((dot,n)=>dot.addEventListener('click',()=>{show(n);start();}));
    if(toggle)toggle.addEventListener('click',()=>{userPaused=!userPaused;updateToggle();if(userPaused)stop();else start();});
    root.addEventListener('mouseenter',()=>paused=true);root.addEventListener('mouseleave',()=>paused=false);root.addEventListener('focusin',()=>paused=true);root.addEventListener('focusout',()=>paused=false);
    show(0);updateToggle();start();
  }
  document.querySelectorAll('[data-heritage-carousel],.heritage-carousel').forEach(initHeritageCarousel);
})();
(function(){
  'use strict';let lastCoverOpener=null;
  function langOf(el){const shell=el&&el.closest('[data-lang-shell]');return shell?shell.dataset.langShell:(document.documentElement.lang==='ar'?'ar':'en');}
  function openShowroom(key,lang){const id=lang+'-showroom-'+key,target=document.getElementById(id);if(!target)return;const shell=target.closest('[data-lang-shell]');if(shell)shell.querySelectorAll('.p3-showroom[open]').forEach(d=>{if(d!==target)d.open=false;});if(target.matches('details'))target.open=true;const gradePanel=target.querySelector('details.v5-grade-disclosure');if(gradePanel)gradePanel.open=true;setTimeout(()=>target.scrollIntoView({behavior:(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth',block:'start'}),110);}
  window.vallorneOpenShowroom=openShowroom;
  document.addEventListener('click',function(e){
    const button=e.target.closest('[data-showroom-open]');if(button){e.preventDefault();openShowroom(button.dataset.showroomOpen,langOf(button));return;}
    const nav=e.target.closest('[data-product-open]');if(nav){const lang=nav.dataset.langTarget||langOf(nav),key=nav.dataset.productOpen;setTimeout(()=>openShowroom(key,lang),170);return;}
    const book=e.target.closest('[data-cover-grade]');if(book){const lang=langOf(book),modal=document.querySelector('[data-lang-shell="'+lang+'"] [data-cover-modal="'+lang+'"]');if(!modal)return;lastCoverOpener=book;const img=book.querySelector('img'),preview=modal.querySelector('[data-cover-image]'),title=modal.querySelector('[data-cover-title]');if(preview&&img){preview.src=img.src;preview.alt=img.alt||'Global Pathways book cover preview';}const grade=book.dataset.coverGrade;if(title)title.textContent=(lang==='ar'?'الصف ':'Grade ')+grade;modal.hidden=false;document.body.style.overflow='hidden';const close=modal.querySelector('.p3-cover-close');if(close)setTimeout(()=>close.focus(),0);return;}
    const close=e.target.closest('[data-cover-close]');if(close){const modal=close.closest('[data-cover-modal]');if(modal){modal.hidden=true;document.body.style.overflow='';if(lastCoverOpener)setTimeout(()=>lastCoverOpener.focus(),0);}return;}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){let closed=false;document.querySelectorAll('[data-cover-modal]:not([hidden])').forEach(m=>{m.hidden=true;closed=true;});document.body.style.overflow='';if(closed&&lastCoverOpener)setTimeout(()=>lastCoverOpener.focus(),0);}});
})();
(function(){
 'use strict';
 const root=new URL('https://www.vallorne-edu.com/');
 const old=(location.hash||'').match(/^#(en|ar)\/(home|about|services|products|insights|contact|privacy|terms)$/);
 if(old){const path=old[1]==='en'&&old[2]==='home'?'':old[1]+'/'+(old[2]==='home'?'':old[2]+'/');location.replace(new URL(path,root).href);return;}
 const nav=document.querySelector('.navlinks'),toggle=document.querySelector('.nav-toggle');
 function closeNav(){if(nav)nav.classList.remove('open');if(toggle){toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';}}
 function closeDrops(except){document.querySelectorAll('.nav-menu-item.open').forEach(item=>{if(item!==except){item.classList.remove('open');item.querySelector('.nav-menu-trigger')?.setAttribute('aria-expanded','false');}});}
 toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'×':'☰';toggle.setAttribute('aria-label',document.documentElement.lang==='ar'?(open?'إغلاق القائمة':'فتح القائمة'):(open?'Close navigation menu':'Open navigation menu'));});
 document.querySelectorAll('.nav-menu-trigger').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.nav-menu-item');const open=!item.classList.contains('open');closeDrops(item);item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));}));
 document.addEventListener('click',event=>{if(!event.target.closest('.site-header')){closeNav();closeDrops();}});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){const drop=document.querySelector('.nav-menu-item.open .nav-menu-trigger');if(drop){closeDrops();drop.focus();}else if(nav?.classList.contains('open')){closeNav();toggle?.focus();}}
  if(event.key!=='Tab')return;
  const modal=document.querySelector('[data-cover-modal]:not([hidden])');if(!modal)return;
  const els=[...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.hidden&&!el.disabled);
  if(!els.length)return;const first=els[0],last=els[els.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 function revealAnchor(){if(!location.hash||location.hash.length<2)return;let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}const target=document.getElementById(id);if(!target)return;const details=target.closest('details');if(details)details.open=true;if(target.matches('details'))target.open=true;const gradePanel=target.querySelector('details.v5-grade-disclosure');if(gradePanel)gradePanel.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
 revealAnchor();addEventListener('hashchange',revealAnchor);

})();


/* v5: specific textbook-presentation enquiry, using the existing email-draft workflow. */
(function(){
 try {
  const u=new URL(window.location.href);
  if(u.searchParams.get('enquiry')!=='textbooks')return;
  const form=document.querySelector('[data-vallorne-contact-form]');if(!form)return;
  const field=form.elements.namedItem('message');
  if(field&&!field.value.trim())field.value=document.documentElement.lang==='ar'?
  'أرغب في ترتيب عرض تقديمي لبرنامجَي Global Pathways وMoney Lab لمدرستنا. يرجى التواصل لمناقشة الصفوف المناسبة ومواعيد العرض.':
  'I would like to arrange a presentation of the Global Pathways and/or Money Lab textbook programmes for our school. Please contact me to discuss suitable grades and presentation arrangements.';
 } catch (_){}
})();


/* V8: client-only newsletter request and accessible floating contact choices. */
document.addEventListener('click',function(e){
 const toggle=e.target.closest('.v8-chat-toggle');
 if(toggle){
  const box=toggle.closest('.v8-chat'),panel=box.querySelector('.v8-chat-panel'),isOpen=!panel.hidden;
  panel.hidden=isOpen;toggle.setAttribute('aria-expanded',String(!isOpen));return;
 }
 const ai=e.target.closest('.v8-chat-ai');
 if(ai){
  const box=ai.closest('.v8-chat');
  const ar=box?.getAttribute('data-lang')==='ar';
  box.querySelector('.v8-ai-status').textContent=ar?'المساعد الذكي غير متصل بعد. يرجى التواصل مع فريقنا عبر صفحة الاتصال.':'The AI assistant is not connected yet. Please use the contact page to reach our team.';
  return;
 }
 if(!e.target.closest('.v8-chat')){
  document.querySelectorAll('.v8-chat').forEach(box=>{
   const panel=box.querySelector('.v8-chat-panel'); if(panel&&!panel.hidden){panel.hidden=true;box.querySelector('.v8-chat-toggle').setAttribute('aria-expanded','false');}
  });
 }
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.v8-chat').forEach(box=>{const panel=box.querySelector('.v8-chat-panel');if(panel&&!panel.hidden){panel.hidden=true;box.querySelector('.v8-chat-toggle').setAttribute('aria-expanded','false');box.querySelector('.v8-chat-toggle').focus();}});});

