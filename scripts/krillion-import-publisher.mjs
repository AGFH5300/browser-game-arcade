#!/usr/bin/env node
// Stage only publisher-scored Krillion prompts from the independently recovered master.
// Usage: node scripts/krillion-import-publisher.mjs /absolute/path/to/QUESTIONS_AND_ALL_ANSWERS.json
// Refuses candidate statuses and never rewrites the site's default question bank.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const destination=path.join(root,'public/play/deep-dive/recovered/publisher-verified');
const input=process.argv[2];
if(!input||!fs.existsSync(input))throw Error('Provide existing recovered 952-question master file');
const records=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(records)||records.length!==952)throw Error('Unexpected question bank size');
const TIERS={10:0,15:1,30:2,60:3,85:4,100:5};
const norm=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const manifest={version:1,source:'krillion-public-publisher-reveal',importPolicy:'publisher_status_only',
  provisionalAnswersIncluded:false,questions:[]};
const conflicts=[];
fs.mkdirSync(destination,{recursive:true});
const expected=new Set();
for(const question of records){
 const official=question.scoredAnswers.filter(a=>a.status==='publisher');
 if(official.length<10)continue;
 if(!/^KR\d{4}$/.test(question.id)||typeof question.question!=='string')throw Error('Bad question identity');
 const byAnswer=new Map();const disputed=new Set();
 for(const a of official){
  if(typeof a.answer!=='string'||!(a.score in TIERS))throw Error('Invalid publisher answer');
  if(a.answer.trim().length<2){conflicts.push({id:question.id,answer:a.answer,reason:'single-character source entry omitted pending review'});continue;}
  const key=norm(a.answer);
  if(!key||disputed.has(key))continue;
  if(byAnswer.has(key)){
   const previous=byAnswer.get(key);
   if(previous.tier!==TIERS[a.score]){conflicts.push({id:question.id,answer:a.answer,oldTier:previous.tier,newTier:TIERS[a.score],reason:'Source score conflict: withheld pending review'});disputed.add(key);byAnswer.delete(key);}
   continue;
  }
  byAnswer.set(key,{value:a.answer,tier:TIERS[a.score],aliases:[],source:'krillion-public-publisher-reveal'});
 }
 const answers=[...byAnswer.values()];
 if(answers.length<10)continue;
 const entry={id:question.id,question:question.question,answerCount:answers.length,
  file:question.id+'.json',status:'publisher',source:'krillion-public-publisher-reveal'};
 fs.writeFileSync(path.join(destination,entry.file),JSON.stringify({id:question.id,prompt:question.question,answers}));
 manifest.questions.push(entry);expected.add(entry.file);
}
if(manifest.questions.length!==14)throw Error('Expected 14 source-backed publisher lists, found '+manifest.questions.length);
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(destination,'source-score-conflicts.json'),JSON.stringify(conflicts,null,2)+'\n');
const stats={questions:manifest.questions.length,answers:manifest.questions.reduce((s,q)=>s+q.answerCount,0),conflicts:conflicts.length};
console.log('KRILLION_PUBLISHER_IMPORT',JSON.stringify(stats));
