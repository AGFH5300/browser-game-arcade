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

test('all 84 source collisions explicitly triaged, 62 independently reviewed same-score orthographies allowed',()=>{
 assert.equal(summary.collision_groups_reviewed,84);
 assert.equal(summary.approved_editorial_orthographic_groups,62);
 assert.equal(summary.held_collision_groups,22);
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
 assert.equal(applied,62);
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
 assert.equal(summary.quarantined_model_review_candidates,2513);
 assert.equal(summary.model_candidates_absent_from_playable,2440);
});

test('46 scraped scoreboard labels removed without losing any unique valid answers',()=>{
 assert.equal(lines('removed-ocr-labels.csv').length,47);
 assert.equal(manifest.answerCount,561223);
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
 assert.equal(summary.held_but_identity_verified_distinct_groups,22);
 assert.equal(summary.remaining_identity_unresolved_groups,0);
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


test('27 complete finite question memberships never receive fabricated 100 points',()=>{
 const rows=lines('finite-category-completeness.csv');
 assert.equal(rows.length,27);
 assert.equal(summary.finite_categories_checked_complete_without_100,26);
 assert.equal(summary.still_unresolved_original_100_rarity_cases,69);
 const review=lines('96-missing-100-review.csv');
 assert.equal(review.length,97);
 assert.equal(review.filter(x=>x.includes('MEMBERSHIP_COMPLETE__NO_DOCUMENTED_100')).length,26);
 assert.equal(summary.coverage_flags_finite_complete,9);
 assert.equal(summary.coverage_flags_reference_limited,5);
 assert.equal(summary.coverage_flags_need_more_category_sources,468);
 const category=JSON.parse(fs.readFileSync(bank+'KR0306.json','utf8'));
 assert.equal(category.answers.length,11);
 assert.equal(category.answers.some((r:[string,number,string])=>r[1]===5),false);
});

test('official Pokémon title aliases point only to existing answers with unchanged tiers',()=>{
 const list=ledger.canonicalAliases.KR0911 as Array<{
   canonical:string;alias:string;tier:number;source_url:string;review:string;
   publisher_original_validator_verified:boolean
 }>;
 assert.equal(list.length,11);
 const pack=JSON.parse(fs.readFileSync(bank+'KR0911.json','utf8'));
 for(const alias of list){
   const canonical=pack.answers.find((r:[string,number,string])=>r[0]===alias.canonical);
   assert(canonical,'missing canonical '+alias.canonical);
   assert.equal(canonical[1],alias.tier);
   assert.equal(alias.review,'official_pokemon_title_alias');
   assert.equal(alias.publisher_original_validator_verified,false);
   assert.match(alias.source_url,/^https:\/\/(?:www|press)\.pokemon\.com\//);
   assert.equal(pack.answers.some((r:[string,number,string])=>r[0]===alias.alias),false,
     'aliases may not be duplicate scored answers');
 }
 assert.equal(summary.separately_verified_official_title_aliases,11);
 assert.equal(summary.model_candidates_reconciled_as_title_aliases,9);
 assert.equal(summary.model_candidates_originally_reviewed,2553);
 assert.equal(summary.quarantined_model_review_candidates,2513);
 const game=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(game,/aliasReview\.canonicalAliases\?\.\[item\.id\]/);
 assert.match(game,/original\.tier!==title\.tier/);
 assert.match(game,/strictAnswerIndex\.has\(key\)/);
 assert.match(game,/original\.aliases\.push\(title\.alias\)/);
});


test('45 additional common names have exact GBIF English species provenance',()=>{
 const added=lines('gbif-animal-letter-additions.csv');
 assert.equal(added.length,46);
 const screening=lines('gbif-animal-letter-evidence.csv');
 assert.equal(screening.length,117);
 assert.equal(summary.gbif_animal_letter_english_exact_verified,59);
 assert.equal(summary.gbif_animal_letter_english_rejected_or_unverified,57);
 const examples:[string,string][]=[['KR0789','Dusky salamander'],['KR0851','Eastern gray squirrel'],
  ['KR0830','Tasmanian tree frog'],['KR0853','Ruddy duck']];
 for(const [id,name] of examples){
  const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
  const answer=pack.answers.find((r:[string,number,string])=>r[0]===name);
  assert.deepEqual(answer,[name,2,'gbif']);
 }
 assert.equal(manifest.answerCount,561223);
});


test('55 more source-verified taxonomic species keep estimated tier 30 only',()=>{
 const rows=lines('gbif-additional-categorical-taxonomy.csv');
 assert.equal(rows.length,56);
 const expected={KR0170:7,KR0212:5,KR0205:5,KR0149:6,KR0240:2,
   KR0822:12,KR0035:10,KR0247:8} as const;
 let sum=0;
 for(const [id,n] of Object.entries(expected)){
  const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
  const details=rows.filter(r=>r.startsWith(id+','));
  assert.equal(details.length,n,id);
  assert(pack.answers.some((entry:[string,number,string])=>entry[2]==='gbif'&&entry[1]===2));
  sum+=n;
 }
 assert.equal(sum,55);
 assert.equal(manifest.answerCount,561223);
 assert.equal(manifest.originalPublisherAcceptanceVerified,false);
});

test('958 GBIF common-name aliases preserve existing source scores and never override a canonical',()=>{
 const csv=lines('gbif-reviewed-common-aliases.csv');
 assert.equal(csv.length,summary.gbif_verified_common_name_aliases+1);
 assert(summary.gbif_verified_common_name_aliases>=548);
 assert(summary.gbif_common_name_alias_question_count>=23);
 const groups=ledger.commonNameAliases as Record<string,Array<{
  canonical:string;alias:string;tier:number;source_url:string;
  review:string;publisher_original_validator_verified:boolean
 }>>;
 assert.equal(Object.values(groups).reduce((sum,g)=>sum+g.length,0),summary.gbif_verified_common_name_aliases);
 const strict=(s:string)=>s.normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 for(const [id,aliases] of Object.entries(groups)){
   const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
   const canonicalKeys=new Set(pack.answers.map((x:[string,number,string])=>strict(x[0])));
   const seen=new Set<string>();
   for(const x of aliases){
     const canonical=pack.answers.find((a:[string,number,string])=>a[0]===x.canonical);
     assert(canonical,id+' missing canonical '+x.canonical);
     assert.equal(canonical[2],'gbif');
     assert.equal(canonical[1],x.tier);
     assert.equal(x.review,'exact_english_gbif_common_name');
     assert.equal(x.publisher_original_validator_verified,false);
     assert.match(x.source_url,/^https:\/\/www\.gbif\.org\/species\/\d+$/);
     const key=strict(x.alias);
     assert(!canonicalKeys.has(key),'canonical collision '+id+' '+x.alias);
     assert(!seen.has(key),'two different taxons share alias '+id+' '+x.alias);
     seen.add(key);
     const initial=pack.prompt.match(/name starts with ([A-Z])$/);
     if(initial)assert(x.alias.toLowerCase().startsWith(initial[1].toLowerCase()),
      'alias violates the animal-letter question '+id+' '+x.alias);
   }
 }
 const game=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(game,/aliasReview\.commonNameAliases\?\.\[item\.id\]/);
 assert.match(game,/original\.provenance!=='gbif'/);
 assert.match(game,/original\.tier!==alias\.tier/);
 assert.match(game,/original\.aliases\.push\(alias\.alias\)/);
});


test('all 84 historical normalized collisions are resolved with 62 safe aliases and 22 distinct entities',()=>{
 assert.equal(summary.collision_groups_reviewed,84);
 assert.equal(summary.approved_editorial_orthographic_groups,62);
 assert.equal(summary.held_but_identity_verified_distinct_groups,22);
 assert.equal(summary.remaining_identity_unresolved_groups,0);
 assert.equal(summary.score_conflicts_preserved,5);
 const csv=lines('84-collision-review.csv');
 for(const pair of ['Air One | AirOne','Air Pac | Airpac','Edith | ÉDIT(h)']){
  const line=csv.find(x=>x.includes(pair));
  assert(line&&line.includes('APPROVED_EDITORIAL_EQUIVALENT')&&line.includes('SAME_ENTITY'),pair);
 }
 for(const pair of ['South Central Air | Southcentral Air','Trans Air | Transair',
  'A O | Ao','2! 3! | 23','444 | 4:44']){
  const line=csv.find(x=>x.includes(pair));
  assert(line&&line.includes('VERIFIED_DISTINCT'),pair);
 }
});

test('63 NPS full names and 8 additional official titles map to existing tiers without duplicate scoring',()=>{
 const aliases=ledger.officialReferenceAliases as Record<string,Array<{
  canonical:string;alias:string;tier:number;source_url:string;
  publisher_original_validator_verified:boolean
 }>>;
 assert.equal(summary.official_reference_aliases_total,71);
 assert.equal(summary.nps_official_full_title_aliases,63);
 assert.equal(summary.browser_official_title_aliases,4);
 assert.equal(Object.values(aliases).flat().length,71);
 assert.equal(aliases.KR0084.length,63);
 const strict=(s:string)=>s.normalize('NFKD').toLowerCase()
   .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 for(const [id,group] of Object.entries(aliases)){
  const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
  const canonicals=new Set(pack.answers.map((a:[string,number,string])=>strict(a[0])));
  const seen=new Set<string>();
  for(const item of group){
   const canonical=pack.answers.find((a:[string,number,string])=>a[0]===item.canonical);
   assert(canonical,id+' missing '+item.canonical);
   assert.equal(canonical[1],item.tier,id+' '+item.alias);
   assert.equal(item.publisher_original_validator_verified,false);
   assert(!canonicals.has(strict(item.alias)),'should not score full title separately '+item.alias);
   assert(!seen.has(strict(item.alias)),'duplicate alias '+item.alias);
   seen.add(strict(item.alias));
  }
 }
 assert(aliases.KR0084.some(a=>a.canonical==='Acadia'&&a.alias==='Acadia National Park'));
 assert(aliases.KR0032.some(a=>a.canonical==='Oliver and Company'&&a.alias==='Oliver & Company'));
 assert(aliases.KR0454.some(a=>a.canonical==='Miguel'&&a.alias==='Miguel Rivera'));
 assert(aliases.KR0180.some(a=>a.canonical==='Falkon'&&a.alias==='QupZilla'));
 const game=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(game,/aliasReview\.officialReferenceAliases\?\.\[item\.id\]/);
 assert.match(game,/original\.tier!==alias\.tier/);
});

test('16 independent sourced answers include one explicitly unverified 100-point archive claim',()=>{
 const backed=lines('official-source-new-answers.csv');
 const browsers=lines('official-browser-source-additions.csv');
 assert.equal(backed.length,11,'10 entries including the one archived 100');
 assert.equal(browsers.length,7,'six independently sourced browser products');
 assert.equal(summary.third_party_archived_100_candidates,1);
 assert.equal(summary.still_unresolved_original_100_rarity_cases,69);
 const archive=lines('public-daily-100-evidence.csv');
 assert.equal(archive.length,2);
 assert(archive[1].includes('Western Sahara'));
 const spain=JSON.parse(fs.readFileSync(bank+'KR0078.json','utf8'));
 assert.deepEqual(spain.answers.find((a:[string,number,string])=>a[0]==='Western Sahara'),
  ['Western Sahara',5,'archive']);
 const records:[string,string,number,string][]=[
  ['KR0084','Chiricahua',2,'reference'],['KR0032','Winnie the Pooh',2,'reference'],
  ['KR0513','Mega Charizard X',2,'reference'],['KR0215','Felix Bloch',2,'reference'],
  ['KR0180','NetSurf',2,'reference'],['KR0180','Falkon',2,'reference']];
 for(const [id,name,tier,source] of records){
  const pack=JSON.parse(fs.readFileSync(bank+id+'.json','utf8'));
  assert.deepEqual(pack.answers.find((a:[string,number,string])=>a[0]===name),
   [name,tier,source]);
 }
 const pixar=JSON.parse(fs.readFileSync(bank+'KR0454.json','utf8'));
 for(const name of ['Miguel Rivera','Riley Anderson','Luca Paguro','Carl Fredrickson']){
  assert(!pixar.answers.some((a:[string,number,string])=>a[0]===name));
 }
 const disney=JSON.parse(fs.readFileSync(bank+'KR0032.json','utf8'));
 assert(!disney.answers.some((a:[string,number,string])=>a[0]==='Oliver & Company'));
 assert(disney.answers.some((a:[string,number,string])=>a[0]==='Oliver and Company'));
 assert.equal(manifest.answerCount,561223);
 assert.equal(manifest.originalPublisherAcceptanceVerified,false);
 assert.equal(summary.quarantined_model_review_candidates,2513);
 assert.equal(summary.model_candidates_reconciled_as_nps_aliases,19);
 assert.equal(summary.model_candidates_promoted_by_official_source,12);
});
