import {randomUUID,randomInt} from 'node:crypto';
import {getDb} from '@/lib/db';
import {
  GAME_VERSION, ICE_SERVERS, INVITE_TTL_MS, parseSignal, type Role, type Packet
} from '@/lib/polytrack-mp';

type Ws={
  readyState:number;
  send:(s:string)=>void;
  close:(code?:number,reason?:string)=>void;
  on:(e:'message'|'close'|'error',listener:(...args:unknown[])=>void)=>unknown;
};
const MAX_FRAMES_PER_SECOND=48;
const RATE_WINDOW_MS=1000;
const POLL_MS=1100;
const INVITE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const inviteCode=()=>Array.from({length:7},()=>INVITE_CHARS[randomInt(INVITE_CHARS.length)]).join('');
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
// PolyTrack 0.6.3 checks .error, not .reason, and closes on missing .error.
const err=(error:string)=>({type:'error',version:GAME_VERSION,error});

export function attachPrivatePolytrackSocket(ws:Ws,role:Role){
  const channel=randomUUID();
  let latest=0,processing=false,closed=false,attempts=0,createdInvites=0;
  let frames=0,frameWindow=Date.now();
  let joiningSession:string|null=null;
  let packetQueue=Promise.resolve();
  const sql=getDb();
  const send=(packet:unknown)=>{
    if(!closed&&ws.readyState===1)ws.send(JSON.stringify(packet));
  };
  async function queue(recipient:string,payload:unknown){
    await sql`INSERT INTO sidequest_polytrack_events(recipient,payload,expires_at)
      VALUES (${recipient},${JSON.stringify(payload)}::jsonb,now()+interval '25 minute')`;
  }
  async function handle(packet:Packet){
    if(packet.type==='ping'&&role==='host'){
      send({type:'pong',version:GAME_VERSION});
      return;
    }
    if(packet.type==='createInvite'&&role==='host'){
      if(++createdInvites>5)return send(err('Room creation limit reached'));
      const supplied=typeof packet.key==='string'&&uuid(packet.key)?packet.key:null;
      if(supplied){
        const existing=await sql`UPDATE sidequest_polytrack_rooms
          SET host_channel=${channel},expires_at=now()+interval '20 minute'
          WHERE invite_key=${supplied} AND expires_at>now()
          RETURNING invite_code,invite_key`;
        if(existing.length){
          send({type:'createInvite',version:GAME_VERSION,inviteCode:existing[0].invite_code,
            key:existing[0].invite_key,timeoutMilliseconds:INVITE_TTL_MS,censoredNickname:null});
          return;
        }
      }
      for(let i=0;i<5;i++){
        const code=inviteCode(),key=randomUUID();
        const result=await sql`INSERT INTO sidequest_polytrack_rooms
          (invite_code,invite_key,host_channel,expires_at)
          VALUES (${code},${key},${channel},now()+interval '20 minute')
          ON CONFLICT DO NOTHING RETURNING invite_code`;
        if(result.length){
          send({type:'createInvite',version:GAME_VERSION,inviteCode:code,key,
            timeoutMilliseconds:INVITE_TTL_MS,censoredNickname:null});
          return;
        }
      }
      return send(err('Could not allocate room'));
    }
    if(packet.type==='join'&&role==='join'){
      if(++attempts>8)return send(err('Too many invite attempts'));
      const code=String(packet.inviteCode).toUpperCase();
      const rooms=await sql`SELECT host_channel FROM sidequest_polytrack_rooms
        WHERE invite_code=${code} AND expires_at>now() LIMIT 1`;
      if(!rooms.length)return send(err('Invite not found or expired'));
      const active=await sql`SELECT count(*) AS count FROM sidequest_polytrack_sessions
        WHERE invite_code=${code} AND expires_at>now()`;
      if(Number(active[0].count)>=8)return send(err('Room full'));
      const session=randomUUID(),host=String(rooms[0].host_channel);
      await sql`INSERT INTO sidequest_polytrack_sessions
        (session_id,invite_code,host_channel,join_channel,expires_at)
        VALUES (${session},${code},${host},${channel},now()+interval '20 minute')`;
      joiningSession=session;
      await queue(host,{
        type:'joinInvite',version:GAME_VERSION,session,
        offer:packet.offer,nickname:packet.nickname,
        countryCode:packet.countryCode??null,carStyle:packet.carStyle,
        mods:Array.isArray(packet.mods)?packet.mods:[],
        isModsVanillaCompatible:true,
        iceServers:ICE_SERVERS
      });
      return;
    }
    if(packet.type==='joinIceCandidate'&&role==='join'){
      // FIFO processing ensures the join session exists before ICE arrives.
      if(!joiningSession)return send(err('No active join session'));
      const sessions=await sql`SELECT host_channel FROM sidequest_polytrack_sessions
        WHERE session_id=${joiningSession} AND join_channel=${channel}
          AND expires_at>now() LIMIT 1`;
      if(!sessions.length)return send(err('Join session expired'));
      await queue(String(sessions[0].host_channel),{
        type:'iceCandidate',version:GAME_VERSION,
        session:joiningSession,candidate:packet.candidate
      });
      return;
    }
    if(['iceCandidate','acceptJoin','declineJoin'].includes(packet.type)&&typeof packet.session==='string'&&uuid(packet.session)){
      const sessions=await sql`SELECT host_channel,join_channel FROM sidequest_polytrack_sessions
        WHERE session_id=${packet.session} AND expires_at>now() LIMIT 1`;
      if(!sessions.length)return send(err('Session expired'));
      const s=sessions[0];
      const host=String(s.host_channel)===channel,joining=String(s.join_channel)===channel;
      if(!host&&!joining)return send(err('Not a participant in this session'));
      if(!host&&packet.type!=='iceCandidate')return send(err('Only the host may answer'));
      const to=host?String(s.join_channel):String(s.host_channel);
      await queue(to,{...packet,version:GAME_VERSION});
      return;
    }
    send(err('Unsupported signaling packet'));
  }

  // Attach listeners before awaiting any DB operations: the game sends its
  // first packet immediately after the WebSocket open event.
  ws.on('message',(...args)=>{
    if(closed)return;
    const now=Date.now();
    if(now-frameWindow>RATE_WINDOW_MS){frameWindow=now;frames=0}
    if(++frames>MAX_FRAMES_PER_SECOND){ws.close(1008,'Rate limit');return}
    const packet=parseSignal(args[0],role);
    if(!packet){send(err('Invalid or unsupported packet'));return}
    // Native joiners send offer and candidate messages rapidly in one tick.
    packetQueue=packetQueue.then(()=>handle(packet)).catch(error=>{
      console.error('[polytrack-private-mp] signaling packet failed',error instanceof Error?error.name:'unknown');
      send(err('Signaling service temporarily unavailable'));
    });
  });
  const interval=setInterval(()=>{
    if(closed||processing||ws.readyState!==1)return;
    processing=true;
    void sql`SELECT id,payload FROM sidequest_polytrack_events
      WHERE recipient=${channel} AND id>${latest} AND expires_at>now()
      ORDER BY id ASC LIMIT 40`.then(rows=>{
      for(const row of rows){
        latest=Number(row.id);
        const p=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;
        send(p);
      }
    }).catch(()=>{}).finally(()=>{processing=false});
  },POLL_MS);
  const close=()=>{closed=true;clearInterval(interval)};
  ws.on('close',close);ws.on('error',close);
  return {channel,close};
}
