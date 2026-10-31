import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getDb} from '@/lib/db';
import {hashIdentifier,isAdmin,sameOrigin} from '@/lib/auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
const out=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:noStore});
const validQuestion=z.string().trim().min(2).max(100).regex(/^[\w:.-]+$/);
export const feedbackSchema=z.object({
 questionId:validQuestion,
 prompt:z.string().trim().min(4).max(280),
 answer:z.string().trim().min(1).max(256),
 mode:z.enum(['daily','endless','archive','world','starter']),
 source:z.string().trim().max(70).default(''),
 note:z.string().trim().max(500).default(''),
 website:z.string().max(100).optional().default('')
}).strict();
const moderationSchema=z.object({
 id:z.string().uuid(),status:z.enum(['pending','investigating','valid_unscored','invalid','duplicate']),
 reviewerNote:z.string().trim().max(500).default('')
}).strict();
const invalid=(error:string,status=400)=>out({error},status);

export async function POST(req:Request){
 if(!sameOrigin(req))return invalid('Invalid request origin',403);
 if(Number(req.headers.get('content-length')||0)>4096)return invalid('Feedback is too large',413);
 try{
  const raw=await req.text();
  if(raw.length>4096)return invalid('Feedback is too large',413);
  const data=feedbackSchema.parse(JSON.parse(raw));
  if(data.website)return out({ok:true,queued:true},202);
  const address=req.headers.get('x-real-ip')||
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const identifier=hashIdentifier('deep-dive-feedback:'+address);
  const sql=getDb();
  const attempts=await sql`
   INSERT INTO deep_dive_feedback_rate_limits(identifier_hash,attempts,window_started)
   VALUES (${identifier},1,now())
   ON CONFLICT(identifier_hash) DO UPDATE SET
     attempts=CASE WHEN deep_dive_feedback_rate_limits.window_started<now()-interval '1 hour'
       THEN 1 ELSE deep_dive_feedback_rate_limits.attempts+1 END,
     window_started=CASE WHEN deep_dive_feedback_rate_limits.window_started<now()-interval '1 hour'
       THEN now() ELSE deep_dive_feedback_rate_limits.window_started END
   RETURNING attempts`;
  if(Number(attempts[0]?.attempts)>6)return invalid('Feedback limit reached. Please try later.',429);
  await sql`
    INSERT INTO deep_dive_answer_feedback
      (question_id,prompt,proposed_answer,context_mode,source_label,player_note,identifier_hash)
    VALUES (${data.questionId},${data.prompt},${data.answer},${data.mode},
      ${data.source},${data.note},${identifier})`;
  // No insert or update to any answer bank, tiers or accepted-answer tables.
  return out({ok:true,queued:true},201);
 }catch(error){
  if(error instanceof SyntaxError||error instanceof z.ZodError)
   return invalid('Enter a valid question, answer and optional note');
  return invalid('The feedback queue is temporarily unavailable',503);
 }
}

export async function GET(req:Request){
 if(!(await isAdmin()))return invalid('Unauthorized',401);
 try{
  const url=new URL(req.url);
  const state=url.searchParams.get('status')||'pending';
  if(!['pending','investigating','valid_unscored','invalid','duplicate','all'].includes(state))
   return invalid('Invalid status');
  const sql=getDb();
  const result=state==='all'
   ?await sql`SELECT id,question_id,prompt,proposed_answer,context_mode,source_label,player_note,
     status,reviewer_note,created_at,updated_at FROM deep_dive_answer_feedback
     ORDER BY created_at DESC LIMIT 150`
   :await sql`SELECT id,question_id,prompt,proposed_answer,context_mode,source_label,player_note,
     status,reviewer_note,created_at,updated_at FROM deep_dive_answer_feedback
     WHERE status=${state} ORDER BY created_at DESC LIMIT 150`;
  return out({items:result});
 }catch{return invalid('Unable to load feedback',503)}
}

export async function PATCH(req:Request){
 if(!sameOrigin(req))return invalid('Invalid request origin',403);
 if(!(await isAdmin()))return invalid('Unauthorized',401);
 try{
  const data=moderationSchema.parse(await req.json());
  const sql=getDb();
  const rows=await sql`UPDATE deep_dive_answer_feedback SET status=${data.status},
     reviewer_note=${data.reviewerNote},updated_at=now()
     WHERE id=${data.id} RETURNING id,status`;
  return rows.length?out({ok:true,status:rows[0].status}):invalid('Review item not found',404);
 }catch(error){
  if(error instanceof SyntaxError||error instanceof z.ZodError)return invalid('Invalid review update');
  return invalid('Review update unavailable',503);
 }
}
