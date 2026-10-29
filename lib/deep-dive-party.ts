import {randomBytes} from 'node:crypto';

export type PartyMember={id:string;secret:string;name:string;hearts:number;energy:number;score:number;ready:boolean;joined:number;lastMessage:number};
export type PartyMessage={name:string;text:string;time:number};
export type PartyEvent={message:string;time:number;kind:'turn'|'answer'|'system'|'timeout'|'winner'};
export type PartyRoom={
 code:string;hostId:string;publicRoom:boolean;phase:'lobby'|'playing'|'finished';
 members:PartyMember[];messages:PartyMessage[];events:PartyEvent[];
 questionIds:string[];questionIndex:number;turnId:string|null;turns:number;
 used:string[];deadline:number|null;winnerId:string|null;created:number;
};
export type PartyQuestion={id:string;prompt:string;theme:string;answers:{value:string;tier:number;aliases?:string[]}[]};
export type PartyAction={type:'ready'|'start'|'answer'|'pass'|'chat'|'leave';name?:string;answer?:string;text?:string;ready?:boolean};
export const PARTY_TURN_MS=18000;
export const PARTY_MAX_MEMBERS=8;
export const PARTY_HEART_GOAL=120;
export const PARTY_MAX_HEARTS=5;
export const PARTY_TURNS_CAP=90;
const TIER_POINTS=[10,15,30,60,85,100] as const;
export const normalizePartyAnswer=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
type PartyAnswer=PartyQuestion['answers'][number];
function editDistance(a:string,b:string,max:number):number{
 if(Math.abs(a.length-b.length)>max)return max+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const next=[i];let minimum=next[0];
  for(let j=1;j<=b.length;j++){
   next[j]=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   minimum=Math.min(minimum,next[j]);
  }
  if(minimum>max)return max+1;
  prev=next;
 }
 return prev[b.length];
}
/** Canonicalizes exact aliases and uniquely resolvable short typos. Never guesses
 * between multiple valid answers at the same edit distance. */
export function findPartyAnswer(question:PartyQuestion,raw:string):PartyAnswer|null{
 const key=normalizePartyAnswer(raw);
 if(!key)return null;
 for(const answer of question.answers)
  if([answer.value,...(answer.aliases||[])].some(v=>normalizePartyAnswer(v)===key))return answer;
 if(key.length<5)return null;
 const limit=key.length>=10?2:1;
 let match:PartyAnswer|null=null,best=limit+1,ambiguous=false;
 for(const answer of question.answers)
  for(const value of [answer.value,...(answer.aliases||[])]){
   const dist=editDistance(key,normalizePartyAnswer(value),limit);
   if(dist<best){best=dist;match=answer;ambiguous=false}
   else if(dist===best&&match!==answer){ambiguous=true}
  }
 return best<=limit&&!ambiguous?match:null;
}
const message=(room:PartyRoom,kind:PartyEvent['kind'],text:string,now:number)=>{
 room.events=[...room.events,{kind,message:text,time:now}].slice(-36);
};
const alive=(r:PartyRoom)=>r.members.filter(p=>p.hearts>0);
const player=(r:PartyRoom,id:string)=>r.members.find(p=>p.id===id);
const escapeName=(s:unknown)=>String(s||'').trim().replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,24);
export function validNickname(name:unknown):string{
 const cleaned=escapeName(name);
 if(cleaned.length<2)throw new Error('Nickname must contain at least 2 characters.');
 return cleaned;
}
export function makeToken():string{return randomBytes(24).toString('hex')}
export function makeCode():string{
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const b=randomBytes(6);
 return Array.from(b,v=>alphabet[v%alphabet.length]).join('');
}
export function newRoom(code:string,nickname:string,publicRoom:boolean,now:number,questionIds:string[]):{room:PartyRoom;secret:string;id:string}{
 const secret=makeToken(),id=makeToken();
 const host:PartyMember={id,secret,name:validNickname(nickname),hearts:3,energy:0,score:0,ready:true,joined:now,lastMessage:0};
 return {secret,id,room:{code,hostId:id,publicRoom,phase:'lobby',members:[host],messages:[],events:[],questionIds,questionIndex:0,turnId:null,turns:0,used:[],deadline:null,winnerId:null,created:now}};
}
export function joinRoom(room:PartyRoom,nickname:string,now:number):{secret:string;id:string}{
 if(room.phase!=='lobby')throw Error('This room has already started.');
 if(room.members.length>=PARTY_MAX_MEMBERS)throw Error('The room is full.');
 const name=validNickname(nickname);
 if(room.members.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That nickname is already in this room.');
 const secret=makeToken(),id=makeToken();
 room.members.push({id,secret,name,hearts:3,energy:0,score:0,ready:false,joined:now,lastMessage:0});
 message(room,'system',name+' joined the room',now);
 return {id,secret};
}
function finish(room:PartyRoom,now:number){
 if(room.phase==='finished')return;
 room.phase='finished';room.deadline=null;
 const standings=[...room.members].sort((a,b)=>b.hearts-a.hearts||b.score-a.score||a.joined-b.joined);
 room.winnerId=standings[0]?.id||null;
 room.turnId=null;
 message(room,'winner',room.winnerId?(standings[0].name+' wins the expedition!'):'Room ended',now);
}
function selectNext(room:PartyRoom,previousId:string,now:number){
 const survivors=alive(room);
 if(survivors.length<=1||room.turns>=PARTY_TURNS_CAP||room.questionIndex>=room.questionIds.length-1){finish(room,now);return}
 const from=room.members.findIndex(p=>p.id===previousId);
 let next=room.members.find((p,i)=>i>from&&p.hearts>0);
 if(!next)next=room.members.find(p=>p.hearts>0);
 if(!next){finish(room,now);return}
 // A full trip around the still-alive roster selects a new question and
 // allows each answer to be reused only in a later question, never this one.
 const index=room.members.findIndex(p=>p.id===next?.id);
 if(index<=from){
   room.questionIndex++;
   room.used=[];
 }
 if(room.questionIndex>=room.questionIds.length){finish(room,now);return}
 room.turnId=next.id;room.deadline=now+PARTY_TURN_MS;
 message(room,'turn','The puffer goes to '+next.name,now);
}
function loseHeart(room:PartyRoom,now:number,kind:'timeout'|'system'){
 const p=player(room,room.turnId||'');
 if(!p)return;
 p.hearts=Math.max(0,p.hearts-1);
 message(room,kind,p.name+' lost a heart'+(p.hearts?'':' and is out'),now);
 room.turns++;
 selectNext(room,p.id,now);
}
export function expireTurn(room:PartyRoom,now:number):boolean{
 if(room.phase!=='playing'||room.deadline===null||room.deadline>now)return false;
 loseHeart(room,now,'timeout');
 return true;
}
export function applyAction(room:PartyRoom,id:string,secret:string,action:PartyAction,now:number,questions:Map<string,PartyQuestion>):void{
 const p=room.members.find(m=>m.id===id&&m.secret===secret);
 if(!p)throw Error('You are not a member of this room. Rejoin with a new invite.');
 if(action.type==='leave'){
  if(room.phase==='playing'&&room.turnId===id){
    p.hearts=0;room.turns++;selectNext(room,id,now);
  }
  room.members=room.members.filter(x=>x.id!==id);
  if(room.hostId===id&&room.members.length)room.hostId=room.members[0].id;
  if(!room.members.length)finish(room,now);
  if(room.phase==='playing'&&alive(room).length<=1)finish(room,now);
  message(room,'system',p.name+' left the party',now);
  return;
 }
 if(action.type==='chat'){
  const text=String(action.text||'').trim().replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,180);
  if(!text)return;
  if(now-p.lastMessage<1500)throw Error('Please avoid sending messages too quickly.');
  p.lastMessage=now;room.messages=[...room.messages,{name:p.name,text,time:now}].slice(-30);return;
 }
 if(action.type==='ready'){
  if(room.phase!=='lobby')throw Error('The party is already underway.');
  p.ready=Boolean(action.ready);return;
 }
 if(action.type==='start'){
  if(room.phase!=='lobby')throw Error('Party already started.');
  if(room.hostId!==id)throw Error('Only the host can start the party.');
  if(room.members.length<2)throw Error('At least two players are needed.');
  if(room.members.some(x=>!x.ready))throw Error('All players must ready up first.');
  room.phase='playing';room.questionIndex=0;room.turnId=room.members[0].id;room.turns=0;room.used=[];room.deadline=now+PARTY_TURN_MS;
  message(room,'system','The party begins! You each have three hearts.',now);
  message(room,'turn','The puffer starts with '+room.members[0].name,now);
  return;
 }
 if(room.phase!=='playing')throw Error('The party has not started.');
 if(room.turnId!==id)throw Error('It is not your turn. Watch the puffer!');
 if(room.deadline===null||now>=room.deadline){expireTurn(room,now);throw Error('The puffer burst before your answer arrived.');}
 if(action.type==='pass'){loseHeart(room,now,'system');return}
 if(action.type==='answer'){
  const raw=String(action.answer||'').trim().slice(0,90),normalized=normalizePartyAnswer(raw);
  if(!normalized)throw Error('Enter an answer before passing the puffer.');
  const question=questions.get(room.questionIds[room.questionIndex]);
  if(!question)throw Error('Party question unavailable.');
  const valid=findPartyAnswer(question,normalized);
  if(!valid)throw Error('Unrecognized answer. Try another before the puffer bursts.');
  const canonical=normalizePartyAnswer(valid.value);
  if(room.used.includes(canonical))throw Error('That answer has already been used for this question!');
  room.used.push(canonical);
  const pts=TIER_POINTS[Math.max(0,Math.min(5,valid.tier))]||10;
  p.score+=pts;p.energy+=pts;
  let bonus=false;
  if(p.energy>=PARTY_HEART_GOAL&&p.hearts<PARTY_MAX_HEARTS){
   p.energy-=PARTY_HEART_GOAL;p.hearts++;bonus=true;
  }
  message(room,'answer',p.name+' answered '+valid.value+' (+'+pts+' rarity)'+(bonus?' and earned a heart!':''),now);
  room.turns++;selectNext(room,id,now);
  return;
 }
 throw Error('Unknown party action');
}
export function publicRoom(room:PartyRoom,questions:Map<string,PartyQuestion>){
 const current=room.phase==='playing'?questions.get(room.questionIds[room.questionIndex]):null;
 return {
  code:room.code,publicRoom:room.publicRoom,phase:room.phase,hostId:room.hostId,
  members:room.members.map(({id,name,hearts,energy,score,ready})=>({id,name,hearts,energy,score,ready})),
  messages:room.messages,events:room.events,turnId:room.turnId,deadline:room.deadline,
  question:current?{id:current.id,prompt:current.prompt,theme:current.theme}:null,
  questionIndex:room.questionIndex,turns:room.turns,usedCount:room.used.length,
  winnerId:room.winnerId,created:room.created,serverNow:Date.now()
 };
}
