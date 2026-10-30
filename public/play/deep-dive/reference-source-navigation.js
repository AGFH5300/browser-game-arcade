/* Source-observed centered navigation modal. Unavailable account destinations
 * remain visibly disabled while local routes continue to work. */
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
 '<header class="dd-source-menu-head"><div><small>KRILLION</small><strong>MENU</strong></div><button type="button" data-close-menu aria-label="Close menu">×</button></header>',
 '<p class="dd-source-menu-label">DIVE IN</p>',
 '<div class="dd-source-menu-grid">',
 '<button type="button" class="dd-source-menu-link active" data-menu-view="daily"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M9 2h2v10h5v2h-2v2h-2v2H8v-2H6v-2H4v-2h5z" fill-rule="evenodd"></path></svg><span>DAILY DIVE</span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="endless"><span class="menu-symbol">∞</span><span>UNLIMITED</span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="party"><img src="./reference-art/puffer.png" alt=""><span>PUFFER PARTY</span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="archive"><span class="menu-symbol">⟲</span><span>ARCHIVE</span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="worlds"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 2h6v6H2z M12 2h6v6h-6z M2 12h6v6H2z M12 12h6v6h-6z" fill-rule="evenodd"></path></svg><span>THEMED PACKS</span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-view="stats"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M7 2h6v2h2v6h-2v2H7v-2H5V4h2z M5 14h10v2h2v3H3v-3h2z" fill-rule="evenodd"></path></svg><span>MY KRILLION</span></button>',
 '<button type="button" class="dd-source-menu-link unavailable" disabled aria-disabled="true"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M3 3h5v6H3z M12 3h5v6h-5z M1 12h9v6H1z M11 12h8v6h-8z" fill-rule="evenodd"></path></svg><span>FRIENDS<small>UNAVAILABLE</small></span></button>',
 '<button type="button" class="dd-source-menu-link" data-menu-settings><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M6 4H14V6H16V14H14V16H6V14H4V6H6Z M8 1H12V4H8Z M8 16H12V19H8Z M1 8H4V12H1Z M16 8H19V12H16Z M3 3H6V6H3Z M14 3H17V6H14Z M3 14H6V17H3Z M14 14H17V17H14Z M8 8H12V12H8Z" fill-rule="evenodd"></path></svg><span>SETTINGS</span></button>',
 '<details class="dd-source-menu-faq"><summary><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M5 2h10v2h2v6h-2v2h-4v2H8v-4h5V6H7v2H3V4h2z M8 16h3v3H8z" fill-rule="evenodd"></path></svg><span>FAQ</span></summary><p>Seven prompts, 25 seconds each. Deeper answers earn more points. Archive replays published puzzles; a free starter of Unlimited is available. This is an independent public-reference recreation, not the publisher\'s paid service.</p></details>',
 '</div>',
 '<div class="dd-source-menu-links">',
 '<a class="dd-source-menu-promo merch" href="https://shop.krillion.io/?utm_source=krillion&amp;utm_medium=game&amp;utm_campaign=merch_launch&amp;utm_content=menu" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M6 2h2v2h4V2h2v2h2v2h2v4h-4v8H6v-8H2V6h2V4h2z"></path></svg><span><strong>MERCH</strong><small>Tees, sweats &amp; caps</small></span><i aria-hidden="true">↗</i></a>',
 '<a class="dd-source-menu-promo chainle" href="https://chainle.io/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 4h10v2H1z M1 10h10v2H1z M1 6h2v4H1z M9 6h2v2H9z M9 8h10v2H9z M9 14h10v2H9z M9 12h2v2H9z M17 10h2v4h-2z"></path></svg><span><strong>TRY CHAINLE</strong><small>Fun word association game made by my little brother</small></span><i aria-hidden="true">↗</i></a>',
 '</div>',
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
   if(yes){
     overlay.querySelectorAll('[data-menu-view]').forEach(item=>{
       const active=nav.querySelector('.nav-pill[data-view="'+item.dataset.menuView+'"]')?.classList.contains('active');
       item.classList.toggle('active',Boolean(active));
     });
     closer.focus();
   }
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
     window.DeepDiveReference?.openSettings?.();
   }
 });
 document.addEventListener('keydown',e=>{
   if(overlay.dataset.open!=='true')return;
   if(e.key==='Escape'){e.preventDefault();setOpen(false);return}
   if(e.key==='Tab'){
     const items=[...overlay.querySelectorAll('button:not(:disabled),a[href],summary')];
     if(!items.length)return;
     const first=items[0],last=items[items.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
 });
 window.DeepDiveSourceMenu={open:()=>setOpen(true),close:()=>setOpen(false)};
})();
