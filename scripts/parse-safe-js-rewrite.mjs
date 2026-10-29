import {Script} from 'node:vm';
// Parser-only check; do not execute untrusted game source.
// Preserve source content if a URL replacement breaks syntactically valid JS.
export function parseSafeRewrite(original, rewritten) {
  if(original===rewritten || original.length>4_000_000 || rewritten.length>4_000_000)
    return {text:rewritten,restored:false};
  try{new Script(original,{filename:'pinned-game-source.js'})}
  catch{return {text:rewritten,restored:false}}
  try{new Script(rewritten,{filename:'rewritten-game-source.js'})}
  catch{return {text:original,restored:true}}
  return {text:rewritten,restored:false};
}
