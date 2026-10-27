import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashIdentifier, sameOrigin } from '@/lib/auth';
import { z } from 'zod';

const contactSchema=z.object({name:z.string().trim().max(100).optional().default(''),email:z.string().trim().max(254).email().optional().or(z.literal('')).default(''),message:z.string().trim().min(20).max(4000),website:z.string().max(200).optional().default('')});
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const length=Number(req.headers.get('content-length')||0);if(length>20000)return NextResponse.json({error:'Message is too large'},{status:413});
 try{
  const input=contactSchema.parse(await req.json());
  if(input.website)return NextResponse.json({ok:true});
  const address=req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const identifier=hashIdentifier(`contact:${address}`);const sql=getDb();
  const rate=await sql`INSERT INTO contact_rate_limits(identifier_hash,attempts,window_started) VALUES(${identifier},1,now()) ON CONFLICT(identifier_hash) DO UPDATE SET attempts=CASE WHEN contact_rate_limits.window_started < now()-interval '1 hour' THEN 1 ELSE contact_rate_limits.attempts+1 END,window_started=CASE WHEN contact_rate_limits.window_started < now()-interval '1 hour' THEN now() ELSE contact_rate_limits.window_started END RETURNING attempts`;
  if(Number(rate[0]?.attempts)>5)return NextResponse.json({error:'Message limit reached. Please try again later.'},{status:429});
  await sql`INSERT INTO contact_messages(name,email,message,identifier_hash) VALUES(${input.name},${input.email},${input.message},${identifier})`;
  return NextResponse.json({ok:true},{status:201});
 }catch(error){if(error instanceof SyntaxError)return NextResponse.json({error:'Invalid message data'},{status:400});if(error instanceof z.ZodError)return NextResponse.json({error:'Enter a valid email and a message between 20 and 4000 characters.'},{status:400});return NextResponse.json({error:'Unable to submit your message right now.'},{status:503});}
}
