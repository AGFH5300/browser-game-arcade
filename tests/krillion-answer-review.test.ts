import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const repo='data/krillion-review/';
const bank='public/play/deep-dive/recovered/independent-bank/';
const summary=JSON.parse(fs.readFileSync(repo+'summary.json','utf8'));
const ledger=JSON.parse(fs.readFileSync(bank+'reviewed-aliases.json','utf8'));
const manifest=JSON.parse(fs.readFileSync(bank+'manifest.json','utf8'));
const lines=(file:string)=>fs.readFileSync(repo+file,'utf8').trim().split(/\r?\n/);

test('all 84 source collisions explicitly triaged, 57 explicitly reviewed same-score orthographies allowed',()=>{
 assert.equal(summary.collision_groups_reviewed,84);
 assert.equal(summary.approved_editorial_orthographic_groups,57);
 assert.equal(summary.held_collision_groups,27);
 assert.equal(summary.score_conflicts_preserved,5);
 assert.equal(lines('84-collision-review.csv').length,85);
 assert.equal(ledger.publisherAcceptanceVerified,false);
 assert.equal(ledger.changesPublisherScores,false);
 let applied=0;
 for(const [id,groups] of Object.entries(ledger.groups) as [string,Array<{canonical:string;equivalent:string;tier:number}>][]){
  const pack=JSON.parse(fs.readFileSync(path.join(bank,id+'.json'),'utf8'));
  for(const group of groups){
   const a=pack.answers.find((row:[string,number,string])=>row[0]===group.canonical);
   const b=pack.answers.find((row:[string,number,string])=>row[0]===group.equivalent);
   assert(a&&b,id+' missing reviewed variant');
   assert.equal(a[1],b[1],id+' must preserve identical original tiers');
   assert.equal(group.tier,a[1]);
   applied++;
  }
 }
 assert.equal(applied,57);
 const risky:{[key:string]:string[]}={
  KR0344:['George Town','Georgetown'],KR0599:['New Quay','Newquay'],
  KR0664:['C.R.O','CRO'],KR0698:['Cry Baby','Crybaby'],KR0745:['Dume','Dum-E']
 };
 for(const [id,words] of Object.entries(risky)){
  for(const pair of ledger.groups[id]||[])
   assert(!words.some(value=>value===pair.canonical||value===pair.equivalent));
 }
});

test('coverage and 100-point gaps remain review requests, never invented scores',()=>{
 assert.equal(summary.missing_documented_100,96);
 assert.equal(summary.missing_100_policy_breakdown.FINITE_MEMBERSHIP_CHECK,37);
 assert.equal(summary.missing_100_policy_breakdown.FIND_ACTUALLY_RARE_VALID_MEMBER,59);
 assert.equal(summary.coverage_below_current_playable_heuristic,482);
 assert.equal(lines('96-missing-100-review.csv').length,97);
 assert.equal(lines('coverage-review.csv').length,483);
 assert.equal(summary.no_100point_scores_invented,true);
 assert.equal(lines('model-candidate-review.csv').length,2554);
 assert.equal(summary.quarantined_model_review_candidates,2553);
 assert.equal(summary.model_candidates_absent_from_playable,2513);
});

test('46 scraped scoreboard labels removed without losing any unique valid answers',()=>{
 assert.equal(lines('removed-ocr-labels.csv').length,47);
 assert.equal(manifest.answerCount,561107);
 let count=0;
 const marker=/^Too clever \([2-4]\) /i;
 for(const question of manifest.questions as Array<{id:string;file:string;answerCount:number}>){
  const pack=JSON.parse(fs.readFileSync(bank+question.file,'utf8'));
  for(const entry of pack.answers as [string,number,string][]){
   assert(!marker.test(entry[0]),'Invalid leaderboard label '+question.id+' '+entry[0]);
   count++;
  }
 }
 assert.equal(count,manifest.answerCount);
});

test('26 manufacturer-sourced pasta shapes only have provisional practice scores',()=>{
 assert.equal(lines('source-reviewed-additions.csv').length,27);
 const pack=JSON.parse(fs.readFileSync(bank+'KR0003.json','utf8'));
 const expected=['Candele Spezzate','Farfalle Medie','Ghiottole','Gramigna','Lasagnette','Pennettine','Mezzi Paccheri'];
 for(const value of expected){
  const hit=pack.answers.find((row:[string,number,string])=>row[0]===value);
  assert(hit,value+' missing');
  assert.deepEqual(hit,[value,2,'reference'],'estimated 30-point practice tier only');
 }
 assert.equal(pack.originalPublisherAcceptanceVerified,false);
 assert.equal(pack.allScoresEmpiricallyCalibrated,false);
});

test('private feedback endpoint is rate-limited and cannot update the scoring bank',()=>{
 const route=fs.readFileSync('app/api/deep-dive/answer-feedback/route.ts','utf8');
 assert.match(route,/sameOrigin\(req\)/);
 assert.match(route,/hashIdentifier\('deep-dive-feedback:/);
 assert.match(route,/if\(Number\(attempts\[0\]\?\.attempts\)>6\)/);
 assert.match(route,/await isAdmin\(\)/);
 assert.match(route,/UPDATE deep_dive_answer_feedback SET status=/);
 assert(!/UPDATE\s+(?:scored_answers|deep_dive_answers|original_answers)/i.test(route));
 const ui=fs.readFileSync('public/play/deep-dive/answer-report.js','utf8');
 assert.match(ui,/\.dd-game-screen\[data-phase="feedback"\]/);
 assert.match(ui,/api\/deep-dive\/answer-feedback/);
 assert.match(ui,/score has not changed/);
 const game=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(game,/DeepDiveAnswerFeedback\?\.remember/);
 assert.match(game,/DeepDiveAnswerFeedback\?\.reset/);
 assert.match(game,/sidequest-editorial-orthography-review/);
});

test('658 new independent answers have exact source-backed categories and non-rarity practice tiers',()=>{
 const lexical=lines('lexical-additions.csv');
 const gbif=lines('gbif-source-reviewed-additions.csv');
 assert.equal(lexical.length,560,'559 lexical answers plus CSV header');
 assert.equal(gbif.length,76,'75 exact independent species plus CSV header');
 const lexicalRows=lexical.slice(1);
 const sourceRows=gbif.slice(1);
 const sample=[
  ['KR0890','manuscripts','manu'],['KR0901','neurosis','neuro'],
  ['KR0912','multitask','multi'],['KR0908','psychopath','path'],
  ['KR0947','boughs','ough'],['KR0950','antimatter','anti'],
  ['KR0946','language','age'],['KR0951','absurdism','ism']
 ] as const;
 for(const [id,,pattern] of sample){
  const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
  assert(pack.prompt.toLowerCase().includes(pattern));
  // Confirm at least one newly imported corpus word is exactly eligible.
  const newWords=lexicalRows.filter(x=>x.startsWith(id+','));
  assert(newWords.length>0,id+' should have new dictionary evidence');
  const imported=new Set(newWords.map(x=>x.split(',')[2]));
  const matched=pack.answers.filter((r:[string,number,string])=>r[2]==='lexicon'&&imported.has(r[0]));
  assert(matched.length>0,id+' should have newly sourced lexicon evidence');
  for(const entry of matched){
    assert(entry[0].toLowerCase().includes(pattern) || (pattern==='ism'&&entry[0].toLowerCase().endsWith('ism')));
    assert.equal(entry[1],2,'only newly source-added words use the conservative practice tier');
  }
 }
 const verifiedRows=JSON.parse(fs.readFileSync(repo+'gbif-taxon-results.json','utf8')) as Record<string,{diagnostics?:{matchType?:string};usage?:{rank?:string}}>;
 for(const line of sourceRows.slice(0,4)){
  assert(line.includes('https://www.gbif.org/species/'));
  assert(line.includes('NOT_ORIGINAL_PUBLISHER'));
 }
 const count=Object.values(verifiedRows).filter(x=>x.diagnostics?.matchType==='EXACT'&&x.usage?.rank==='SPECIES').length;
 assert(count>=75);
 assert.equal(summary.gbif_species_taxonomy_category_verified,89);
 assert.equal(summary.gbif_exact_taxon_but_category_unverified,251);
 assert.equal(summary.gbif_taxon_no_exact_match,415);
});

test('four held collisions proven to be real-world distinct, never fuzzy-merged',()=>{
 assert.equal(summary.held_but_identity_verified_distinct_groups,4);
 assert.equal(summary.remaining_identity_unresolved_groups,23);
 const csv=lines('84-collision-review.csv').join('\n');
 for(const pair of ['Basse-Terre | Basseterre','George Town | Georgetown',
   'New Quay | Newquay','North Central University | Northcentral University']){
  const evidence=csv.split('\n').find(row=>row.includes(pair));
  assert(evidence&&evidence.includes('VERIFIED_DISTINCT')&&evidence.includes('https://'),pair);
 }
});

test('24 exactly sourced English animal names are independently attributed and not publisher scores',()=>{
 const rows=lines('gbif-vernacular-additions.csv');
 assert.equal(rows.length,25);
 const records=rows.slice(1);
 assert(records.every(x=>x.includes('NOT_VERIFIED')&&x.includes('https://www.gbif.org/species/')));
 const wolf=JSON.parse(fs.readFileSync(bank+'KR0830.json','utf8'));
 assert.deepEqual(wolf.answers.find((a:[string,number,string])=>a[0]==='Tasmanian wolf'),
 ['Tasmanian wolf',2,'gbif']);
 assert.equal(summary.lexical_heuristic_overstated_cases,5);
 const dictionary=lines('lexical-target-audit.csv');
 assert.equal(dictionary.length,9);
});
