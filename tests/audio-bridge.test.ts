import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('hosted game sound bridge mutes and restores media plus Web Audio independently',async()=>{
  const handlers=new Map<string,(event?:unknown)=>void>();
  const sent:Array<{type:string;muted?:boolean}>=[];
  const parent={postMessage:(value:{type:string;muted?:boolean})=>sent.push(value)};
  class AudioElement {
    muted=false;
    play(){return Promise.resolve();}
  }
  class Context {
    state='running';
    suspend(){this.state='suspended';return Promise.resolve();}
    resume(){this.state='running';return Promise.resolve();}
  }
  const win:{AudioContext:typeof Context;addEventListener:(name:string,callback:(event?:unknown)=>void)=>void}={
    AudioContext:Context,
    addEventListener:(name:string,callback:(event?:unknown)=>void)=>handlers.set(name,callback),
  };
  const document={
    getElementById:()=>null,
    querySelectorAll:()=>[],
  };
  const code=readFileSync('public/play/arcade-bridge.js','utf8');
  runInNewContext(code,{window:win,document,parent,HTMLMediaElement:AudioElement,setTimeout:()=>0});
  handlers.get('load')?.();
  assert(sent.some(e=>e.type==='sidequest:audio-ready'));
  const audio=new AudioElement();
  await audio.play();
  const context=new win.AudioContext() as Context;
  handlers.get('message')?.({source:parent,data:{type:'sidequest:audio-set',muted:true}});
  assert.equal(audio.muted,true);
  assert.equal(context.state,'suspended');
  await context.resume();
  assert.equal(context.state,'suspended');
  handlers.get('message')?.({source:parent,data:{type:'sidequest:audio-set',muted:false}});
  assert.equal(audio.muted,false);
  assert.equal(context.state,'running');
  assert(sent.some(e=>e.type==='sidequest:audio-state'&&e.muted===false));
});
