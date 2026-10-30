/* Source-observed public navigation: slide-out menu from Krillion's 2026-10-29
 * free homepage. Intentionally excludes auth/Friends/purchases. */
(() => {
 'use strict';
 const nav=document.querySelector('.dd-nav-toggle');
 const trigger=nav?.querySelector('summary');
 const app=document.getElementById('app');
 if(!nav||!trigger||!app)return;
 const overlay=document.createElement('div');
 overlay.className='dd-source-menu-backdrop';
 overlay.dataset.open='false';
 overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML=[
 '<nav class="dd-source-menu-panel" role="dialog" aria-modal="true" aria-label="Krillion navigation">',
 '<div class="dd-source-menu-head"><div><strong>KRILLION</strong><span> MENU</span></div><button type="button" data-close-menu aria-label="Close menu">×</button></div>',
 '<p class="dd-source-menu-label">DIVE IN</p>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="daily">DAILY DIVE</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="endless"><span class="menu-symbol">∞</span> UNLIMITED</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="party">PUFFER PARTY</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="archive"><span class="menu-symbol">⟲</span> ARCHIVE</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="worlds">THEMED PACKS</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="stats">MY DIVE LOG</button>',
 '<button type="button" class="dd-source-menu-link" data-menu-settings>SETTINGS</button>',
 '<details><summary>FAQ</summary><p>Seven prompts, 25 seconds each. Deeper answers earn more points. Archive replays published puzzles; a free starter of Unlimited is available. This is an independent public-reference recreation, not the publisher\'s paid service.</p></details>',
 '<div class="dd-source-menu-footer"><p>one in a krillion.</p></div>',
 '</nav>'
 ].join('');
 document.body.append(overlay);
 const closer=overlay.querySelector('[data-close-menu]');
 const setOpen=(yes)=>{
   nav.removeAttribute('open');
   overlay.dataset.open=yes?'true':'false';
   overlay.setAttribute('aria-hidden',String(!yes));
   trigger.setAttribute('aria-expanded',String(yes));
   if(yes)closer.focus();
   else trigger.focus({preventScroll:true});
 };
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.setAttribute('aria-expanded','false');
 trigger.addEventListener('click',e=>{
   e.preventDefault();
   e.stopPropagation();
   setOpen(overlay.dataset.open!=='true');
 },true);
 overlay.addEventListener('click',e=>{
   if(e.target===overlay||e.target.closest('[data-close-menu]')){setOpen(false);return}
   const destination=e.target.closest('[data-menu-view]');
   if(destination){
     const view=destination.dataset.menuView;
     setOpen(false);
     nav.querySelector('.nav-pill[data-view="'+view+'"]')?.click();
     window.DeepDiveSfx?.event('category');
     return;
   }
   if(e.target.closest('[data-menu-settings]')){
     setOpen(false);
     const s=app.querySelector('.dd-reference-preferences>summary');
     s?.click();
   }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.dataset.open==='true'){e.preventDefault();setOpen(false)}});
 window.DeepDiveSourceMenu={open:()=>setOpen(true),close:()=>setOpen(false)};
})();
