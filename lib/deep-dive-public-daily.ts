/** Publicly exposed Krillion daily answer-sheet adapter.
 * The Sidequest owner reports authorization to reproduce public game data.
 * This is a normal, read-only public source; it does not access accounts,
 * authentication tokens, paywalled games, or private endpoints.
 */
export const SOURCE_TIERS = ['plankton','tooclever','schooler','rare','deepcut','krillion'] as const;
export const SOURCE_TIER_POINTS: Record<(typeof SOURCE_TIERS)[number],number> = {
  plankton:10,tooclever:15,schooler:30,rare:60,deepcut:85,krillion:100
};
type PublicAnswer={answer:string;tier:(typeof SOURCE_TIERS)[number];score:number;quip?:string};
type PublicPrompt={id:string;text:string;answers:PublicAnswer[]};
type SourceToday={date:string;dayNumber:number;resetsAt:string;prompts:{id:string;text:string}[]};
type SourceReveal={date:string;prompts:PublicPrompt[]};
const safeDate=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date);

export function validatePublicDaily(today:unknown,reveal:unknown){
 if(!today||typeof today!=='object'||!reveal||typeof reveal!=='object')throw Error('Source records missing');
 const t=today as SourceToday,r=reveal as SourceReveal;
 if(!safeDate(t.date)||r.date!==t.date||!Number.isInteger(t.dayNumber)||t.dayNumber<1||!Number.isFinite(Date.parse(t.resetsAt)))throw Error('Source date mismatch');
 if(!Array.isArray(t.prompts)||t.prompts.length!==7||!Array.isArray(r.prompts)||r.prompts.length!==7)throw Error('Expected seven prompts');
 for(let i=0;i<7;i++){
  const p=r.prompts[i],meta=t.prompts[i];
  if(!p||typeof p.id!=='string'||p.id!==meta?.id||p.text!==meta?.text||typeof p.text!=='string'||!Array.isArray(p.answers)||p.answers.length<10||p.answers.length>100_000)throw Error('Malformed source prompt');
  for(const a of p.answers){
   if(typeof a.answer!=='string'||a.answer.length<1||a.answer.length>256||!SOURCE_TIERS.includes(a.tier)||a.score!==SOURCE_TIER_POINTS[a.tier]||a.quip!=null&&typeof a.quip!=='string')throw Error('Malformed scored answer');
  }
 }
 return {source:'krillion-public-reveal' as const,date:t.date,dayNumber:t.dayNumber,resetsAt:t.resetsAt,prompts:r.prompts};
}
