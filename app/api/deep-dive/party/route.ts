import {NextRequest,NextResponse} from 'next/server';
import {getDb} from '@/lib/db';
import bank from '../../../../public/play/deep-dive/questions.json';
import {
 makeCode,newRoom,joinRoom,applyAction,expireTurn,publicRoom,
 type PartyQuestion,type PartyRoom,type PartyAction
} from '@/lib/deep-dive-party';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=10;
const questions=new Map<string,PartyQuestion>(
 (bank.questions as PartyQuestion[]).map(q=>[q.id,q])
);
const error=(message:string,status=400)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
const ok=(data:unknown)=>NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
const codePattern=/^[A-HJ-NP-Z2-9]{6}$/;
const validCode=(value:unknown)=>typeof value==='string'&&codePattern.test(value.trim().toUpperCase())?value.trim().toUpperCase():null;
function shuffleQuestionIds(key:string){
 const items=[...questions.keys()];
 let s=2166136261;
 for(const char of key){s=Math.imul(s^char.charCodeAt(0),16777619)}
 for(let i=items.length-1;i>0;i--){
  s=(Math.imul(s,1664525)+1013904223)>>>0;
  const j=s%(i+1);[items[i],items[j]]=[items[j],items[i]];
 }
 return items;
}
type StateRow={room_code:string;state:PartyRoom;revision:number};
async function fetchRoom(code:string){
 const sql=getDb();
 const rows=await sql.query(
  "SELECT room_code,state,revision FROM deep_dive_party_rooms WHERE room_code=$1 AND updated_at>now()-interval '12 hours' LIMIT 1",
  [code]
 );
 return (rows[0] as StateRow|undefined)||null;
}
async function commit(code:string,expected:number,state:PartyRoom):Promise<boolean>{
 const sql=getDb();
 const rows=await sql.query(
  'UPDATE deep_dive_party_rooms SET state=$1::jsonb,revision=revision+1,updated_at=now() WHERE room_code=$2 AND revision=$3 RETURNING revision',
  [JSON.stringify(state),code,expected]
 );
 return rows.length===1;
}
async function getCurrent(code:string):Promise<StateRow|null>{
 for(let n=0;n<5;n++){
  const row=await fetchRoom(code);
  if(!row)return null;
  if(!expireTurn(row.state,Date.now()))return row;
  if(await commit(code,row.revision,row.state))return {...row,revision:row.revision+1};
 }
 return await fetchRoom(code);
}
export async function GET(request:NextRequest){
 try{
  const sql=getDb(),isList=request.nextUrl.searchParams.get('list')==='1';
  if(isList){
   const rows=await sql.query(
    "SELECT room_code,state,updated_at FROM deep_dive_party_rooms WHERE state->>'phase'='lobby' AND state->>'publicRoom'='true' AND updated_at>now()-interval '3 hours' ORDER BY updated_at DESC LIMIT 20"
   );
   return ok({rooms:rows.map(r=>{
    const s=r.state as PartyRoom;
    return {code:String(r.room_code),members:s.members.length,host:s.members.find(x=>x.id===s.hostId)?.name||'Host',created:s.created};
   })});
  }
  const code=validCode(request.nextUrl.searchParams.get('code'));
  if(!code)return error('Invalid room code');
  const row=await getCurrent(code);
  if(!row)return error('Room not found or expired',404);
  return ok({room:publicRoom(row.state,questions)});
 }catch(e){
  console.error('Deep Dive party GET',e instanceof Error?e.message:'unknown');
  return error('Room service temporarily unavailable',503);
 }
}
export async function POST(request:NextRequest){
 try{
  const body=await request.json() as Record<string,unknown>;
  const type=String(body.type||'');
  if(type==='create'){
   if(typeof body.name!=='string'||body.name.length>45)return error('Enter a nickname between 2 and 24 characters.');
   const sql=getDb();
   for(let tryCount=0;tryCount<4;tryCount++){
    const code=makeCode(),now=Date.now();
    const {room,id,secret}=newRoom(code,body.name,body.publicRoom===true,now,shuffleQuestionIds(code+':'+now));
    const rows=await sql.query(
     'INSERT INTO deep_dive_party_rooms (room_code,state,revision) VALUES ($1,$2::jsonb,0) ON CONFLICT (room_code) DO NOTHING RETURNING room_code',
     [code,JSON.stringify(room)]
    );
    if(rows.length)return ok({room:publicRoom(room,questions),playerId:id,secret});
   }
   return error('Please try creating the room again',503);
  }
  const code=validCode(body.code);
  if(!code)return error('Enter a valid six-character party code');
  for(let attempt=0;attempt<7;attempt++){
   const row=await getCurrent(code);
   if(!row)return error('Room expired or not found',404);
   const now=Date.now(),room=row.state;
   if(type==='join'){
    if(typeof body.name!=='string'||body.name.length>45)return error('Enter a nickname between 2 and 24 characters.');
    const {id,secret}=joinRoom(room,body.name,now);
    if(await commit(code,row.revision,room))return ok({room:publicRoom(room,questions),playerId:id,secret});
    continue;
   }
   if(typeof body.playerId!=='string'||typeof body.secret!=='string')return error('You must join the room first',401);
   if(body.secret.length!==48||body.playerId.length!==48)return error('Invalid player credentials',401);
   const action:PartyAction={
    type:type as PartyAction['type'],
    answer:typeof body.answer==='string'?body.answer:undefined,
    text:typeof body.text==='string'?body.text:undefined,
    ready:body.ready===true
   };
   if(!['ready','start','answer','pass','chat','leave'].includes(type))return error('Unsupported action');
   applyAction(room,body.playerId,body.secret,action,now,questions);
   if(await commit(code,row.revision,room))return ok({room:publicRoom(room,questions)});
  }
  return error('Party is busy, retry your action',409);
 }catch(e){
  if(e instanceof SyntaxError)return error('Malformed request');
  if(e instanceof Error){
   if(/^(Unrecognized|That answer|It is not|The party|This room|The room|Nickname|At least|All players|Only the host|Please avoid|You must|Unknown|Enter an answer|Party already|Party question|Room expired|Room not found)/.test(e.message)){
    return error(e.message);
   }
   if(e.message.includes('secret')||e.message.includes('member'))return error('Room authorization failed',401);
  }
  console.error('Deep Dive party POST',e instanceof Error?e.message:'unknown');
  return error('Party service temporarily unavailable',503);
 }
}
