#!/usr/bin/env node
/* Reproducible strict comparator for same-viewport PNG snapshots.
 * Do not certify exact parity on a normalized or masked comparison:
 * every pixel of every channel in the full images must match.
 * E.g. node scripts/krillion-compare-frames.mjs original.png local.png --report-only
 */
import sharp from 'sharp';
const [left,right]=process.argv.slice(2).filter(x=>!x.startsWith('--'));
if(!left||!right){
 console.error('Usage: node scripts/krillion-compare-frames.mjs ORIGINAL.png CANDIDATE.png [--report-only]');
 process.exit(64);
}
const read=async p=>sharp(p).removeAlpha().raw().toBuffer({resolveWithObject:true});
const [a,b]=await Promise.all([read(left),read(right)]);
if(a.info.width!==b.info.width||a.info.height!==b.info.height){
 console.error(JSON.stringify({verdict:'FAIL',reason:'VIEWPORT_MISMATCH',
  original:[a.info.width,a.info.height],candidate:[b.info.width,b.info.height]}));
 process.exit(2);
}
let sum=0,different=0,max=0,exactPixels=0;
const histogram=Array(16).fill(0);
for(let i=0;i<a.data.length;i+=3){
 let distance=0;
 for(let c=0;c<3;c++){
  let d=Math.abs(a.data[i+c]-b.data[i+c]);
  sum+=d;distance+=d;max=Math.max(max,d);
  if(d!==0)different++;
 }
 exactPixels+=distance===0;
 histogram[Math.min(15,Math.floor(distance/48))]++;
}
const total=a.info.width*a.info.height;
const result={
 verdict:different===0?'PASS':'FAIL',strictPixelPerfect:different===0,
 original:left,candidate:right,
 width:a.info.width,height:a.info.height,totalPixels:total,
 exactPixels,exactPixelPercent:+(100*exactPixels/total).toFixed(4),
 changedChannels:different,meanAbsoluteChannelError:+(sum/(total*3)).toFixed(5),
 maxAbsoluteChannelError:max,distanceHistogram:histogram,
 caveat:'Unsynchronized animations and publisher data can change between captures. This comparator never asserts 1:1 from a masked or approximate image.'
};
console.log(JSON.stringify(result,null,2));
if(different!==0&&!process.argv.includes('--report-only'))process.exitCode=2;
