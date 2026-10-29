import {NextResponse} from 'next/server';
import {validatePublicDaily} from '@/lib/deep-dive-public-daily';

export const runtime='nodejs';
const CACHE_SECONDS=900;
const ORIGIN='https://krillion.io';
const requestJson=async(path:string)=>{
 const result=await fetch(ORIGIN+path,{next:{revalidate:CACHE_SECONDS},signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(!result.ok)throw Error('Public source unavailable: HTTP '+result.status);
 const max=3_500_000;
 const declared=Number(result.headers.get('content-length')||0);
 if(declared>max)throw Error('Source response exceeds size limit');
 const body=await result.text();
 if(body.length>max)throw Error('Source response exceeds size limit');
 return JSON.parse(body) as unknown;
};
/** Fixed upstream paths, validated response shapes, cached at the Next/Vercel
 * layer. No caller-provided URLs or date parameters are forwarded upstream.
 * Browser clients never submit player answers to the publisher's server.
 */
export async function GET(){
 try{
  const today=await requestJson('/api/today') as {date?:string};
  if(!today||typeof today.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(today.date))throw Error('Invalid source date');
  const reveal=await requestJson('/api/reveal?date='+encodeURIComponent(today.date));
  const sheet=validatePublicDaily(today,reveal);
  return NextResponse.json(sheet,{headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=1200'}});
 }catch{
  return NextResponse.json({error:'Daily source temporarily unavailable. No invented scoring will be substituted.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
