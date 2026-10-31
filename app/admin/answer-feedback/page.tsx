'use client';
import {useCallback,useEffect,useState} from 'react';

type Status='pending'|'investigating'|'valid_unscored'|'invalid'|'duplicate';
type Item={
 id:string;question_id:string;prompt:string;proposed_answer:string;
 context_mode:string;source_label:string;player_note:string;status:Status;
 reviewer_note:string;created_at:string;updated_at:string
};
const statuses:Status[]=['pending','investigating','valid_unscored','invalid','duplicate'];
export default function AnswerFeedbackInbox(){
 const [items,setItems]=useState<Item[]>([]);
 const [filter,setFilter]=useState('pending');
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [loading,setLoading]=useState(true),[signedOut,setSignedOut]=useState(false);
 const [message,setMessage]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const response=await fetch('/api/deep-dive/answer-feedback?status='+encodeURIComponent(filter),{cache:'no-store'});
   if(response.status===401){setSignedOut(true);return;}
   const json=await response.json();
   if(!response.ok)throw Error(json.error||'Unable to load queue');
   const entries=(json.items||[]) as Item[];
   setItems(entries);
   setNotes(Object.fromEntries(entries.map(x=>[x.id,x.reviewer_note||''])));
   setMessage('');
  }catch(error){setMessage(error instanceof Error?error.message:'Queue unavailable')}
  finally{setLoading(false)}
 },[filter]);
 useEffect(()=>{const task=setTimeout(()=>{void load()},0);return()=>clearTimeout(task)},[load]);
 async function changeStatus(item:Item,status:Status){
  setMessage('');
  try{
   const response=await fetch('/api/deep-dive/answer-feedback',{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:item.id,status,reviewerNote:notes[item.id]||''})
   });
   const json=await response.json();
   if(!response.ok)throw Error(json.error||'Could not change status');
   await load();
  }catch(error){setMessage(error instanceof Error?error.message:'Update unavailable')}
 }
 if(signedOut)return <main className="admin-shell">
  <h1>Answer review inbox</h1><p>Admin sign-in required.</p><a href="/admin">Sign in to arcade admin</a>
 </main>;
 return <main className="admin-shell">
  <header><div><p>ARCADE / DEEP DIVE</p><h1>Answer review inbox</h1>
   <p>Suggestions do not change scores or accepted-answer lists. All review decisions are manual.</p>
   </div><a href="/admin">Back to games</a>
  </header>
  <section className="admin-list">
   <label>Queue status <select value={filter} onChange={e=>setFilter(e.target.value)}>
    <option value="all">All</option>
    {statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}
   </select></label>
   <button type="button" onClick={()=>void load()} disabled={loading}>Refresh</button>
   {message&&<p role="status">{message}</p>}
   {loading?<p>Loading review requests…</p>:items.length===0?<p>No requests in this queue.</p>:
    items.map(item=><article key={item.id} className="contact-message">
     <div style={{minWidth:0,overflowWrap:'anywhere'}}>
      <strong>{item.question_id} — {item.proposed_answer}</strong>
      <p>{item.prompt}</p>
      <p>{item.context_mode} · {item.source_label||'unattributed'} · {new Date(item.created_at).toLocaleString()}</p>
      {item.player_note&&<p>Player explanation: {item.player_note}</p>}
      <p>Review state: {item.status.replaceAll('_',' ')}</p>
      <label>Reviewer notes (private)
       <textarea rows={2} maxLength={500} value={notes[item.id]??''}
        onChange={e=>setNotes(previous=>({...previous,[item.id]:e.target.value}))}/>
      </label>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
       {statuses.filter(s=>s!==item.status).map(status=>
        <button key={status} type="button" onClick={()=>void changeStatus(item,status)}>
         {status.replaceAll('_',' ')}
        </button>)}
      </div>
     </div>
    </article>)}
  </section>
 </main>;
}
