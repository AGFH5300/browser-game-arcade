/* Sidequest-only answer feedback: independent of the game timer, scoring,
 * question selection and publisher API. Appears AFTER a timed round ends.
 * A submission enters a private moderation queue, never the playable bank. */
(()=>{
 'use strict';
 let rejected=null,root=null;
 const add=(parent,tag,props={},text)=>{
   const el=document.createElement(tag);
   for(const [key,value] of Object.entries(props)){
     if(key==='className')el.className=value;
     else if(key==='type')el.type=value;
     else el.setAttribute(key,value);
   }
   if(text!==undefined)el.textContent=text;
   parent.append(el);return el;
 };
 function createReviewUI(){
   if(!rejected||!root)return;
   const phase=root.querySelector('.dd-game-screen[data-phase="feedback"]');
   if(!phase||phase.querySelector('.dd-answer-report-open'))return;
   const trigger=add(phase,'button',{type:'button',className:'dd-answer-report-open'},
       'REPORT A MISSING ANSWER');
   const overlay=add(phase,'div',{className:'dd-answer-report-dialog',role:'dialog',
       'aria-modal':'true','aria-labelledby':'dd-answer-report-title'});
   overlay.hidden=true;
   const form=add(overlay,'form',{id:'dd-answer-report-form',className:'dd-answer-report-card'});
   add(form,'h2',{id:'dd-answer-report-title'},'Report an answer');
   add(form,'p',{},'Question: '+rejected.prompt);
   const answer=add(form,'p',{},'Rejected answer: ');
   add(answer,'strong',{},rejected.answer);
   add(form,'p',{},'This is a review request only. It never awards points or changes the answer bank.');
   const label=add(form,'label',{},'Why should it count? (optional)');
   add(label,'textarea',{name:'note',maxlength:'500',rows:'3',
     placeholder:'Short explanation or source'});
   const honeypot=add(form,'label',{className:'dd-answer-honeypot','aria-hidden':'true'},'Website');
   add(honeypot,'input',{name:'website',tabindex:'-1',autocomplete:'off'});
   const actions=add(form,'div',{className:'dd-answer-report-actions'});
   const cancel=add(actions,'button',{type:'button'},'Cancel');
   const send=add(actions,'button',{type:'submit'},'Send for review');
   const status=add(form,'p',{role:'status','aria-live':'polite'});
   trigger.addEventListener('click',()=>{overlay.hidden=false;label.querySelector('textarea').focus()});
   cancel.addEventListener('click',()=>{overlay.hidden=true;trigger.focus()});
   overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true});
   form.addEventListener('submit',async e=>{
     e.preventDefault();
     if(send.disabled||!rejected)return;
     send.disabled=true;status.textContent='Submitting for review…';
     const data={...rejected,note:label.querySelector('textarea').value,
        website:honeypot.querySelector('input').value};
     try{
       const response=await fetch('/api/deep-dive/answer-feedback',{
         method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
         body:JSON.stringify(data)
       });
       const result=await response.json();
       if(!response.ok)throw Error(result.error||'Unable to send feedback');
       status.textContent='Review request received. Your score has not changed.';
       trigger.disabled=true;trigger.textContent='REVIEW REQUEST SENT';
     }catch(error){
       send.disabled=false;
       status.textContent=error instanceof Error?error.message:'Feedback temporarily unavailable.';
     }
   });
 }
 window.DeepDiveAnswerFeedback={
   remember(value){
     if(!value||typeof value.answer!=='string'||typeof value.questionId!=='string')return;
     rejected={questionId:value.questionId,prompt:String(value.prompt||''),
       answer:value.answer,mode:String(value.mode||'daily'),source:String(value.source||'')};
   },
   reset(){rejected=null;document.querySelector('.dd-answer-report-dialog')?.remove();}
 };
 function begin(){
   root=document.querySelector('#app');
   if(!root)return;
   const observer=new MutationObserver(()=>createReviewUI());
   observer.observe(root,{childList:true,subtree:true});
   createReviewUI();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});
 else begin();
})();
