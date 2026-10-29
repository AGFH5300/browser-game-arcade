// Sidequest-only PolyTrack 0.6.3 multiplayer signaling packet validation.
// Exact client packet vocabulary inspected against the shipped 0.6.3 bundle.
// This module does not modify Kodub's network or its access controls.
export const GAME_VERSION='0.6.3';
export const MP_ORIGIN='https://browser-game-arcade-dxbavg-7923s-projects.vercel.app';
export const MP_BASE='https://browser-game-arcade.vercel.app/api/polytrack-mp/';
export const ICE_SERVERS=[{urls:'stun:stun.l.google.com:19302'}];
export const INVITE_TTL_MS=20*60*1000;
export const MAX_SIGNAL_BYTES=32_768;

export type Role='host'|'join';
export type Packet=Record<string,unknown>&{type:string};
const str=(s:unknown,max=1024)=>typeof s==='string'&&s.length>0&&s.length<=max;
export function parseSignal(raw:unknown,role:Role):Packet|null{
  const input=typeof raw==='string'?raw:String(raw);
  if(input.length>MAX_SIGNAL_BYTES)return null;
  let p:unknown;
  try{p=JSON.parse(input)}catch{return null}
  if(!p||typeof p!=='object'||Array.isArray(p))return null;
  const e=p as Record<string,unknown>;
  if(e.version!==GAME_VERSION)return null;
  if(role==='host'&&e.type==='createInvite')return e.key===undefined||e.key===null||str(e.key,100)?e as Packet:null;
  if(role==='join'&&!('type' in e)){
    // Native 0.6.3 candidates have neither type nor session.
    if('candidate' in e)return e.candidate===null ||
      (typeof e.candidate==='object' && !Array.isArray(e.candidate))
      ?{...e,type:'joinIceCandidate'} as Packet:null;
    return str(e.inviteCode,8)&&str(e.offer,26_000)&&str(e.nickname,48)
      &&str(e.carStyle,4096)?{...e,type:'join'} as Packet:null;
  }
  if(role==='host'&&e.type==='ping')return e as Packet;
  if((e.type==='iceCandidate'||e.type==='acceptJoin'||e.type==='declineJoin')
      &&str(e.session,80)){
    if(e.type==='acceptJoin'&&!str(e.answer,26_000))return null;
    if(e.type==='iceCandidate'&&!(e.candidate===null||typeof e.candidate==='object'))return null;
    return e as Packet;
  }
  return null;
}
export function requestedOrigin(origin:string|null){
  return origin===MP_ORIGIN ||
    (process.env.VERCEL_ENV==='preview' && typeof origin==='string' &&
      /^https:\/\/browser-game-arcade-[a-z0-9]+-dxbavg-7923s-projects\.vercel\.app$/.test(origin));
}
export function privateMpEnabled(){
  return process.env.POLYTRACK_PRIVATE_MP_ENABLED==='true' || process.env.VERCEL_ENV==='preview';
}
export function iceCorsHeaders(origin:string|null){
  return requestedOrigin(origin)?{
    'Access-Control-Allow-Origin':origin!,
    'Access-Control-Allow-Methods':'GET, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  }:null;
}
