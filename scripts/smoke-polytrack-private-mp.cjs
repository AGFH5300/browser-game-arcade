// Live two-socket signaling smoke test. Does not touch Kodub's server.
const WS=require('ws');
const origin=process.argv[2];
if(!origin?.startsWith('https://browser-game-arcade-'))throw Error('Missing Sidequest preview origin');
const base=origin.replace('https:','wss:')+'/api/polytrack-mp/v6/multiplayer/';
const clients=[];let host,join,code,sess,phases=[],done=false;
const send=(ws,o)=>ws.send(JSON.stringify({version:'0.6.3',...o}));
const finish=(error)=>{
 if(done)return;done=true;
 for(const ws of clients)try{ws.close()}catch{}
 console.log(JSON.stringify({success:!error,phases,error:error?.message||null,inviteCode:code}));
 process.exit(error?1:0);
};
setTimeout(()=>finish(Error('30s signaling timeout')),30_000);
function newSocket(path){
 const ws=new WS(base+path,{headers:{Origin:origin},handshakeTimeout:9000});
 clients.push(ws);
 ws.on('unexpected-response',(_,res)=>finish(Error('WS HTTP '+res.statusCode+' '+path)));
 ws.on('error',err=>finish(err));
 return ws;
}
host=newSocket('host');
host.on('open',()=>{phases.push('host-connected');send(host,{type:'createInvite',key:null})});
host.on('message',raw=>{
 const msg=JSON.parse(raw.toString());
 if(msg.type==='createInvite'){
  code=msg.inviteCode;phases.push('invite-created');
  join=newSocket('join');
  join.on('open',()=>{
   phases.push('join-connected');
   send(join,{inviteCode:code,offer:'v=0\\r\\na=ice-ufrag:test',nickname:'Pilot Tester',countryCode:'AE',carStyle:'demo-style',mods:[]});
  });
  join.on('message',raw=>{
   const m=JSON.parse(raw.toString());
   if(m.type==='acceptJoin'){
    phases.push('answer-delivered');
    send(join,{type:'iceCandidate',session:sess,candidate:{candidate:'candidate:fake',sdpMid:'0',sdpMLineIndex:0}});
   }else if(m.type==='iceCandidate'){
    phases.push('host-ice-delivered');finish();
   }else if(m.type==='error')finish(Error('Join error '+JSON.stringify(m)));
  });
 }else if(msg.type==='joinInvite'){
   sess=msg.session;phases.push('offer-delivered');
   send(host,{type:'acceptJoin',session:sess,answer:'v=0\\r\\na=ice-ufrag:answer',mods:[],isModsVanillaCompatible:true,clientId:2});
 }else if(msg.type==='iceCandidate'){
   phases.push('join-ice-delivered');
   send(host,{type:'iceCandidate',session:sess,candidate:{candidate:'candidate:host-fake',sdpMid:'0',sdpMLineIndex:0}});
 }else if(msg.type==='error')finish(Error('Host error '+JSON.stringify(msg)));
});
