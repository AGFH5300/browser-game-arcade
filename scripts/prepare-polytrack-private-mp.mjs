// Separate pilot HTML + bundle, never overwrite the working PolyTrack game.
import {readFile,writeFile} from 'node:fs/promises';
const root='public/play/archives/polytrack/';
const source=await readFile(root+'main.bundle.js','utf8');
let copy=source;
const hosts=['multiplayer/host','multiplayer/join','iceServers?version=0.6.3'];
for(const endpoint of hosts){
 const marker=endpoint==='iceServers?version=0.6.3'?'iceServers?version=0.6.3':endpoint;
 const index=copy.indexOf('"'+marker+'"');
 if(index<0)throw Error('Missing multiplayer client endpoint '+endpoint);
 const before=copy.lastIndexOf('"https://vps.kodub.com/"',index);
 if(before<0||index-before>340)throw Error('Unexpected PolyTrack multiplayer endpoint layout '+endpoint);
 copy=copy.slice(0,before)+'(window.location.origin + "/api/polytrack-mp/")'+copy.slice(before+'"https://vps.kodub.com/"'.length);
}
if(copy===source)throw Error('Missing replacements');
const html=await readFile(root+'index.html','utf8');
if(!html.includes('main.bundle.js'))throw Error('Missing base bundle script');
const preview=html.replace('main.bundle.js','private-main.bundle.js')
  .replace('<title>','<title>Sidequest Private Multiplayer Pilot – ')
  .replace('</head>',`<style>
.sidequest-polytrack-info{position:fixed;bottom:12px;right:12px;z-index:20000;color:#f1f5ff;font:12px system-ui,sans-serif;max-width:min(520px,90vw);background:#172749ee;border:1px solid #718ad0;border-radius:9px;box-shadow:0 4px 14px #0007;padding:5px 9px}
.sidequest-polytrack-info summary{cursor:pointer;padding:3px 5px}
.sidequest-polytrack-info[open]{background:#112143fa;max-height:65vh;overflow:auto}
.sidequest-polytrack-info-content{display:flex;flex-direction:column;gap:8px;padding:8px}
.sidequest-polytrack-info-content a{color:#c9dbff}
.sidequest-polytrack-info-content [data-kind]{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sidequest-polytrack-info-content img{max-height:32px}
</style><script defer src="./private-mp-layout.js"></script></head>`);
await writeFile(root+'private-mp.html',preview);
await writeFile(root+'private-main.bundle.js',copy);
console.log('[private-mp] Created isolated, opt-in PolyTrack client from original 0.6.3 bundle. Official game entry remains unchanged.');
