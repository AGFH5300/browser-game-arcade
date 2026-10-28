import {ICE_SERVERS,iceCorsHeaders,privateMpEnabled} from '@/lib/polytrack-mp';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function OPTIONS(request:Request){
 const h=iceCorsHeaders(request.headers.get('origin'));
 return h?new Response(null,{status:204,headers:h}):new Response('Forbidden',{status:403});
}
export function GET(request:Request){
 if(!privateMpEnabled())return new Response('Pilot disabled',{status:503});
 const h=iceCorsHeaders(request.headers.get('origin'));
 return h?Response.json(ICE_SERVERS,{headers:h}):new Response('Forbidden',{status:403});
}
