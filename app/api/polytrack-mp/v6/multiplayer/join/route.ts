import {experimental_upgradeWebSocket} from '@vercel/functions';
import {attachPrivatePolytrackSocket} from '@/lib/polytrack-mp-server';
import {privateMpEnabled,requestedOrigin} from '@/lib/polytrack-mp';
export const runtime='nodejs';
export function GET(request:Request){
 if(!privateMpEnabled())return new Response('Sidequest private multiplayer pilot not enabled',{status:503});
 if(!requestedOrigin(request.headers.get('origin')))return new Response('Forbidden',{status:403});
 return experimental_upgradeWebSocket(ws=>{attachPrivatePolytrackSocket(ws as unknown as Parameters<typeof attachPrivatePolytrackSocket>[0],'join')});
}
