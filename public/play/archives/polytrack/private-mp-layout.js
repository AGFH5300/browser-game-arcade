// Pilot-only display repair. Relocate the game's informational/footer links
// into an accessible disclosure so they cannot overlap the game menu.
(()=>{
 const create=()=>{
  const details=document.createElement('details');
  details.id='sidequest-polytrack-info';
  details.className='sidequest-polytrack-info';
  const summary=document.createElement('summary');summary.textContent='Game information';
  const content=document.createElement('div');content.className='sidequest-polytrack-info-content';
  details.append(summary,content);document.body.append(details);
  let scheduled=false;
  const normalize=()=>{
   scheduled=false;
   const ui=document.getElementById('ui');if(!ui)return;
   // Base game credits are kept verbatim: no loss of author/license attribution.
   const credits=ui.querySelector('a[href="https://www.kodub.com"]');
   if(credits && credits.parentElement){
    const container=credits.parentElement;
    const pane=content.querySelector('[data-kind="credits"]')||document.createElement('div');
    pane.dataset.kind='credits';
    if(!pane.parentElement)content.append(pane);
    for(const n of [...container.children])pane.append(n);
   }
   // The mod warning is an original in-game informational element. Move it
   // instead of modifying its meaning, hiding it or covering buttons.
   const all=[...ui.querySelectorAll('div,p,span')];
   const label=all.find(el=>el.children.length===0&&el.textContent?.includes('Unofficial PolyModLoader mod by'));
   if(label&&label.parentElement){
    const group=label.parentElement;
    const pane=content.querySelector('[data-kind="mod-info"]')||document.createElement('div');
    pane.dataset.kind='mod-info';
    if(!pane.parentElement)content.prepend(pane);
    for(const n of [...group.children])pane.append(n);
   }
  };
  const observer=new MutationObserver(()=>{
   if(!scheduled){scheduled=true;requestAnimationFrame(normalize)}
  });
  observer.observe(document.getElementById('ui')||document.body,{subtree:true,childList:true});
  normalize();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});else create();
})();
