#!/usr/bin/env python3
"""Reproducible, NON-publisher-verified review queues from local research exports.

Run:
 python3 scripts/krillion-build-review-ledgers.py /path/to/KRILLION_COMPLETION_AUDIT_2026-10-31

Only explicitly examined orthographic equivalents are enabled as Sidequest
practice aliases. No missing 100-point score is manufactured, and model-only
suggestions never automatically enter playable packs.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
audit = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else None
if audit is None or not audit.is_dir():
    raise SystemExit('Supply a local research-audit directory; no network sources are fetched')
out = root / 'data/krillion-review'
out.mkdir(parents=True,exist_ok=True)
bank = root / 'public/play/deep-dive/recovered/independent-bank'
manifest = json.loads((bank/'manifest.json').read_text())
packs = {q['id']:json.loads((bank/q['file']).read_text()) for q in manifest['questions']}
tiers=[10,15,30,60,85,100]
def rows(name):
    with (audit/name).open(encoding='utf8',newline='') as f:
        return list(csv.DictReader(f))
def write(name,fields,items):
    with (out/name).open('w',encoding='utf8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");w.writeheader();w.writerows(items)
def simple(s):
    s=unicodedata.normalize('NFKD',s.casefold())
    return re.sub(r'[^a-z0-9]','',s)
# By order in the 84-row collisions report, hand-reviewed spelling/spacing
# variants within the SAME prompt/tier. Not claims of original accepted aliases.
# Excludes different cities, people, songs, performers and score conflicts.
APPROVE={
  1,2,3,4,5,6,7,8,9,10,12,13,14,16,17,18,19,21,23,24,25,
  28,29,30,31,32,33,34,35,38,39,43,45,46,47,48,49,
  51,52,53,55,57,59,60,61,62,66,67,68,69,70,71,72,73,74,
  77,78,79,80,81,82,84
}
assert len(APPROVE)==62
collision_rows=rows('NORMALIZED_DUPLICATES_AND_CONFLICTS.csv')
assert len(collision_rows)==84
# Original publisher acceptance is unverified; these sources prove real-world
# identity or disambiguation only. Never merge independently distinct entities.
IDENTITIES={
  4: ('SAME_ENTITY','https://www.grassley.senate.gov/news/news-releases/grassley-seeks-prompt-action-accurate-posting-access-air'),
  26:('VERIFIED_DISTINCT','https://www.insee.fr/fr/metadonnees/geographie/arrondissement/9711-basse-terre | https://www.gov.kn/'),
  27:('VERIFIED_DISTINCT','https://otp.gov.ky/web/govky/ourislands | https://factpage.glsc.gov.gy/basics/capital-city/'),
  44:('VERIFIED_DISTINCT','https://www.ceredigion.gov.uk/media/dripe2fr/2024-new-quay-place-plan.pdf | https://www.newquay.gov.uk/'),
  56:('VERIFIED_DISTINCT','https://www.northcentral.edu/ | https://www.nu.edu/national-and-northcentral-have-merged/'),
  57:('SAME_ENTITY','https://up.net/upnet-news-alerts'),
  # Additional original-source/third-party identity evidence.
  9:('SAME_ENTITY','https://www.albanyairport.com/application/files/4417/4310/0062/Board_Meeting_12092024.pdf'),
  11:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/List_of_defunct_airlines_of_the_United_States_(D%E2%80%93I)'),
  15:('VERIFIED_DISTINCT','https://faculty.haas.berkeley.edu/borenste/download/JEP92AirEvol.pdf | https://en.wikipedia.org/wiki/JetAmerica'),
  36:('VERIFIED_DISTINCT','https://www.staroil.com.gh/who_we_are | https://en.staroilcyprus.com/'),
  41:('VERIFIED_DISTINCT','https://music.apple.com/us/artist/j-ax/189265036 | https://music.apple.com/us/artist/jax/983830871'),
  42:('VERIFIED_DISTINCT','https://www.allmusic.com/artist/m-clan-mn0000503021 | https://dicionariompb.com.br/artista/mc-lan/'),
  50:('VERIFIED_DISTINCT','https://academic.oup.com/pasj/article/73/4/837/6296434'),
  54:('VERIFIED_DISTINCT','https://es.wikipedia.org/wiki/C.R.O_(m%C3%BAsico) | https://www.munzinger.de/register/portrait/biographien/cro/02/1769'),
  65:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/Crybaby'),
  76:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/St._Anton_am_Arlberg | https://en.wikipedia.org/wiki/Stanton,_California'),
  83:('VERIFIED_DISTINCT','https://www.starwars.com/series/star-wars-rebels/dume-episode-guide | https://d23.com/mcu-robot-roundup/'),
  32:('SAME_ENTITY','https://www.howe.com/us/products/chairs/404/ | https://www.designcraft.net.au/products/howe-404-chair'),
  75:('VERIFIED_DISTINCT','https://www.imdb.com/title/tt5763098/ | https://www.imdb.com/title/tt2141913'),
  37:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/Au/Ra | https://www.globalmusicsong.com/artists-au.html'),
  40:('VERIFIED_DISTINCT','https://streamclout.io/artist/h-dn/4gD6ddSF1KwHyvk34XykYH | https://streamclout.io/artist/hdn/2VeycUHUfDjoYqpkOSllnn'),
  5:('SAME_ENTITY','https://www.planespotters.net/airline/Air-1 | https://airlinehistory.co.uk/airline/air-1-air-one/'),
  6:('SAME_ENTITY','https://www.govinfo.gov/content/pkg/GOVPUB-I-7c572f02b65ffc91d311b34930a91087/pdf/GOVPUB-I-7c572f02b65ffc91d311b34930a91087.pdf | https://www.flickr.com/photos/157839500@N04/40808901175/'),
  20:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/List_of_defunct_airlines_of_the_United_States_(Q%E2%80%93Z)'),
  22:('VERIFIED_DISTINCT','https://en.wikipedia.org/wiki/List_of_defunct_airlines_of_the_United_States_(Q%E2%80%93Z) | https://www.planespotters.net/aircraft/operators/boeing-737-200'),
  53:('SAME_ENTITY','https://global.hankyu-hanshin-dept.co.jp/store/mensosaka/recommend/12663257_3144.html | https://lechercheurdeparfum.com/en/edith-fragrances/'),
  58:('VERIFIED_DISTINCT','https://onepiece.fandom.com/id/wiki/A_O | https://naruto.fandom.com/wiki/Ao'),
  63:('VERIFIED_DISTINCT','https://open.spotify.com/track/0ma7lbs8BsVIv2kSaqOsDI | https://music.apple.com/us/album/23/687300642'),
  64:('VERIFIED_DISTINCT','https://www.mystreamcount.com/track/1o4xkdBe0RjSf2u6VXi4OI | https://musicbrainz.org/release/7e016939-03a4-4b96-9118-7b470f15bdb8')
}
statuses=[]
allowed={}
for i,r in enumerate(collision_rows,1):
    names=r['variants'].split(' | ')
    existing={v[0]:v[1] for v in packs[r['id']]['answers']}
    scores={existing[n] for n in names if n in existing}
    complete=all(n in existing for n in names)
    checked=r['score_conflict']=='True'
    state=('HOLD_SCORE_CONFLICT' if checked else
           'APPROVED_EDITORIAL_EQUIVALENT' if i in APPROVE and complete and len(scores)==1 else
           'HOLD_MISSING_PLAYABLE_VARIANT' if i in APPROVE else
           'HOLD_DIFFERENT_ENTITIES_OR_UNVERIFIED')
    if state=='APPROVED_EDITORIAL_EQUIVALENT':
        assert len(names)==2 and all(simple(n)==simple(names[0]) for n in names)
        assert tiers[existing[names[0]]]==int(json.loads(r['scores'])[0])
        allowed.setdefault(r['id'],[]).append({
            'canonical': names[0], 'equivalent':names[1], 'tier':existing[names[0]],
            'review':'sidequest_editorial_orthography_only'
        })
    statuses.append({
        'id':r['id'],'question':r['question'],'variants':r['variants'],
        'scores':r['scores'],'source':r['sources'],'review_state':state,
        'applies_to':'independent_practice_only',
        'publisher_acceptance_verified':'NO',
        'identity_verification':IDENTITIES.get(i,('NOT_ESTABLISHED',''))[0],
        'independent_reference':IDENTITIES.get(i,('',''))[1],
        'notes':('Different original tiers: preserve both names and scores' if checked
                 else 'Both variants present in practice bank; identical tier; reviewed orthography' if state=='APPROVED_EDITORIAL_EQUIVALENT'
                 else 'Not safe to merge without independent identity proof')
    })
write('84-collision-review.csv',list(statuses[0]),statuses)
assert sum(s['review_state']=='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses)==62
# Publisher-official full-title variants of *already playable games*.
# These are aliases, not additional scored answers. Exclude compound
# multiple-game model suggestions and titles not used by the publisher.
title_sources={
 'Pokémon Ruby':'https://www.pokemon.com/us/pokemon-video-games/pokemon-ruby-version-and-pokemon-sapphire-version/',
 'Pokémon Sapphire':'https://www.pokemon.com/us/pokemon-video-games/pokemon-ruby-version-and-pokemon-sapphire-version/',
 'Pokémon FireRed':'https://www.pokemon.com/us/pokemon-video-games/pokemon-firered-version-and-pokemon-leafgreen-version',
 'Pokémon LeafGreen':'https://www.pokemon.com/us/pokemon-video-games/pokemon-firered-version-and-pokemon-leafgreen-version',
 'Pokémon HeartGold':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-johto-region',
 'Pokémon SoulSilver':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-johto-region',
 'Pokémon Black':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-unova-region',
 'Pokémon White':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-unova-region',
 'Pokémon Black 2':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-unova-region',
 'Pokémon White 2':'https://www.pokemon.com/us/news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-unova-region',
 'Pokémon Café ReMix':'https://press.pokemon.com/en/products/Pokemon-Cafe-ReMix'
}
title_aliases=[]
for canonical,source_url in title_sources.items():
    if canonical=='Pokémon Café ReMix':alias='Pokémon Café Mix'
    elif canonical.endswith(' 2'):alias=canonical[:-2]+' Version 2'
    elif canonical in ('Pokémon HeartGold','Pokémon SoulSilver'):
        alias=canonical+' Version'
    else:alias=canonical+' Version'
    pack=packs['KR0911']
    found=[row for row in pack['answers'] if row[0]==canonical]
    assert len(found)==1,canonical
    assert not any(simple(row[0])==simple(alias) for row in pack['answers']),alias
    title_aliases.append({
      'canonical':canonical,'alias':alias,'tier':found[0][1],
      'source_url':source_url,'review':'official_pokemon_title_alias',
      'publisher_original_validator_verified':False
    })
# Exact English common names for previously verified GBIF species.
common_name_aliases={}
common_file=out/'gbif-reviewed-common-aliases.csv'
if common_file.exists():
    with common_file.open(encoding='utf8',newline='') as f:
        for x in csv.DictReader(f):
            id,canonical,alias=x['id'],x['canonical'],x['alias']
            originals=[a for a in packs[id]['answers'] if a[0]==canonical]
            assert len(originals)==1 and originals[0][2]=='gbif'
            assert int(x['tier'])==originals[0][1]
            assert x['review']=='exact_english_gbif_common_name'
            assert x['source_url'].startswith('https://www.gbif.org/species/')
            assert not any(simple(a[0])==simple(alias) for a in packs[id]['answers'])
            common_name_aliases.setdefault(id,[]).append({
                'canonical':canonical,'alias':alias,'tier':int(x['tier']),
                'source_url':x['source_url'],'review':'exact_english_gbif_common_name',
                'publisher_original_validator_verified':False
            })
# Official US National Park Service full names are aliases of preexisting
# historically scored short names. Do not assign a second score to the full title.
official_reference_aliases={}
official_file=out/'official-source-title-aliases.csv'
official_browser_aliases=out/'official-browser-source-aliases.csv'
if official_file.exists():
    with official_file.open(encoding='utf8',newline='') as f:
        for item in csv.DictReader(f):
            assert item['id'] in {'KR0084','KR0032','KR0454'}
            assert item['review']=='independent_official_full_title'
            assert item['kind'] in {'official_nps_full_title',
                  'official_studio_punctuation_variant','studio_canonical_full_character_name'}
            assert item['source_url'].startswith(('https://www.nps.gov/',
                  'https://www.disneyanimation.com/','https://movies.disney.com/'))
            target=[a for a in packs[item['id']]['answers'] if a[0]==item['canonical']]
            assert len(target)==1 and target[0][1]==int(item['tier'])
            assert not any(simple(a[0])==simple(item['alias']) for a in packs[item['id']]['answers'])
            official_reference_aliases.setdefault(item['id'],[]).append({
                'canonical':item['canonical'],'alias':item['alias'],
                'tier':int(item['tier']),'source_url':item['source_url'],
                'review':'independent_official_full_title',
                'publisher_original_validator_verified':False
            })
if official_browser_aliases.exists():
    with official_browser_aliases.open(encoding='utf8',newline='') as f:
        for item in csv.DictReader(f):
            assert item['id']=='KR0180'
            assert item['review']=='independent_official_full_title'
            assert item['kind']=='official_browser_name_or_renamed_brand'
            assert item['source_url'].startswith(('https://www.falkon.org/',
             'https://apps.gnome.org/','https://www.maxthon.com/','https://brave.com/'))
            target=[a for a in packs[item['id']]['answers'] if a[0]==item['canonical']]
            assert len(target)==1 and target[0][1]==int(item['tier'])
            assert not any(simple(a[0])==simple(item['alias']) for a in packs[item['id']]['answers'])
            official_reference_aliases.setdefault(item['id'],[]).append({
                'canonical':item['canonical'],'alias':item['alias'],
                'tier':int(item['tier']),'source_url':item['source_url'],
                'review':'independent_official_full_title',
                'publisher_original_validator_verified':False
            })
assert len(title_aliases)==11
with (out/'official-game-title-aliases.csv').open('w',encoding='utf8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(title_aliases[0]),lineterminator='\n')
    w.writeheader();w.writerows(title_aliases)
# Local runtime reads only these explicitly reviewed sets.
path=bank/'reviewed-aliases.json'
path.write_text(json.dumps({
    'source':'sidequest-editorial-orthography-review',
    'publisherAcceptanceVerified':False,
    'changesPublisherScores':False,
    'groups':allowed,
    'canonicalAliases':{'KR0911':title_aliases},
    'commonNameAliases':common_name_aliases,
    'officialReferenceAliases':official_reference_aliases
},ensure_ascii=False,separators=(',',':'))+'\n')
missing=rows('MISSING_96_100POINT_POLICY.csv')
assert len(missing)==96
complete={}
finite_file=out/'finite-category-completeness.csv'
if finite_file.exists():
    with finite_file.open(encoding='utf8',newline='') as f:
        complete={r['id']:r for r in csv.DictReader(f)}
for r in missing:
    if r['id']=='KR0078' and any(a[0]=='Western Sahara' and a[1]==5 and a[2]=='archive' for a in packs['KR0078']['answers']):
        r['review_state']='THIRD_PARTY_ARCHIVED_100__ORIGINAL_UNVERIFIED'
        r['decision']='ARCHIVE_SOURCE_RECORDED__NOT_DIRECT_PUBLISHER_CONFIRMED'
        r['needs_empirical_guess_frequency']='YES_FOR_ORIGINAL_CONFIRMATION'
    elif r['id'] in complete:
        r['review_state']='MEMBERSHIP_COMPLETE__NO_DOCUMENTED_100'
        r['decision']='DO_NOT_INVENT_RARITY_FOR_FINITE_COMPLETE_CATEGORY'
        r['needs_empirical_guess_frequency']='YES_TO_CLAIM_NEW_100'
    else:
        r['review_state']='REQUIRES_SOURCE_AND_PLAYER_RARITY_EVIDENCE'
        r['decision']='NO_AUTOMATIC_100_POINT_AWARD'
write('96-missing-100-review.csv',list(missing[0]),missing)
targets={'Finite tiny':5,'Finite small':15,'Finite medium':40,
         'Moderately broad':75,'Broad category':150,'Very broad':400,
         'Open-ended / lexical':1000}
low=[]
for r in rows('ALL_952_RARITY_SCORE_AUDIT.csv'):
    target=targets[r['category']]
    n=len(packs[r['id']]['answers'])
    if n>=target:continue
    gap=target-n
    low.append({'id':r['id'],'question':r['question'],'category':r['category'],
                'present':n,'heuristic_target':target,'numerical_gap':gap,
                'priority': 'P1' if n<target/4 else 'P2' if n<target*0.6 else 'P3',
                'state':'REVIEW_REQUIRED__NOT_PUBLISHER_VERIFIED',
                'note':'Heuristic screening target, not verified category universe size'})
low.sort(key=lambda x:({'P1':0,'P2':1,'P3':2}[x['priority']],-x['numerical_gap'],x['id']))
write('coverage-review.csv',list(low[0]),low)
# The old 150/400/1000 quotas are screening rules, not certified universe
# sizes; distinguish complete finite categories and literal reference limits.
coverage_status=[]
lexical_screen={}
lexical_file=out/'lexical-target-audit.csv'
if lexical_file.exists():
    with lexical_file.open(encoding='utf8',newline='') as f:
        lexical_screen={r['id']:r for r in csv.DictReader(f)}
for r in low:
    if r['id'] in complete:
        state='FINITE_MEMBERSHIP_COMPLETE__HEURISTIC_TARGET_NOT_APPLICABLE'
        source='data/krillion-review/finite-category-completeness.csv'
    elif r['id'] in lexical_screen and lexical_screen[r['id']]['screening_result']=='TARGET_NOT_SUPPORTED_BY_LOCAL_REFERENCE':
        state='REFERENCE_LIMITED__TARGET_NOT_A_VALID_REQUIREMENT'
        source='data/krillion-review/lexical-target-audit.csv'
    else:
        state='OPEN_CATEGORY__SOURCE_SPECIFIC_PROOF_REQUIRED'
        source=''
    coverage_status.append({**r,'evidence_state':state,'evidence_file':source,
      'is_this_a_proven_missing_valid_answer':'NO',
      'certification':'Original acceptance and rarity NOT proven by size-only targets'})
write('coverage-evidence-status.csv',list(coverage_status[0]),coverage_status)
models=rows('AI_ALL_BROAD_VERY_BROAD_MODEL_ACCEPTED.csv')
assert len(models)==2553
name_path=out/'gbif-animal-letter-evidence.csv'
english_evidence={}
if name_path.exists():
    with name_path.open(encoding='utf8',newline='') as f:
        english_evidence={int(r['candidate_index']):r for r in csv.DictReader(f)}
evidence_path=out/'gbif-candidate-verification.csv'
gbif_evidence={}
if evidence_path.exists():
    with evidence_path.open(encoding='utf8',newline='') as f:
        gbif_evidence={int(r['candidate_index']):r for r in csv.DictReader(f)}
title_alias_lookup={(qid,x['alias']):x['canonical']
    for qid,group in {'KR0911':title_aliases}.items() for x in group}
park_alias_lookup={(qid,x['alias']):x
    for qid,group in official_reference_aliases.items() for x in group}
common_alias_lookup={(qid,x['alias']):x
    for qid,group in common_name_aliases.items() for x in group}
source_additions={}
source_add_path=out/'official-source-new-answers.csv'
if source_add_path.exists():
    with source_add_path.open(encoding='utf8',newline='') as f:
        source_additions={(r['id'],r['answer']):r for r in csv.DictReader(f)}
browser_source_add=out/'official-browser-source-additions.csv'
if browser_source_add.exists():
    with browser_source_add.open(encoding='utf8',newline='') as f:
        source_additions.update({(r['id'],r['answer']):r for r in csv.DictReader(f)})
candidate=[]
for ix,r in enumerate(models):
    present={simple(x[0]) for x in packs[r['id']]['answers']}
    game_title_canonical=title_alias_lookup.get((r['id'],r['answer']))
    park_title=park_alias_lookup.get((r['id'],r['answer']))
    common_title=common_alias_lookup.get((r['id'],r['answer']))
    source_exact=source_additions.get((r['id'],r['answer']))
    if game_title_canonical:source_status='VERIFIED_OFFICIAL_POKEMON_ALIAS__SAME_SCORE'
    elif park_title:source_status='VERIFIED_NPS_FULL_TITLE_ALIAS__SAME_SCORE'
    elif common_title:source_status='VERIFIED_GBIF_ENGLISH_ALIAS__SAME_SCORE'
    elif source_exact:source_status=('THIRD_PARTY_ARCHIVED_100__NOT_ORIGINAL_CONFIRMED' if
       source_exact['rarity_method']=='THIRD_PARTY_ARCHIVED_TIER' else
       'VERIFIED_INDEPENDENT_SOURCE__ESTIMATED_PRACTICE_SCORE')
    else:source_status='QUARANTINED__PRIMARY_SOURCE_AND_RARITY_EVIDENCE_REQUIRED'
    source_link=(source_exact or park_title or common_title or {}).get('source_url','')
    candidate.append({
      'id':r['id'],'question':r['question'],'suggestion':r['answer'],
      'tier_estimate':r['tier'],'generator':r['generators'],'checker':r['checker'],
      'already_playable_estimate': 'YES' if simple(r['answer']) in present else 'NO',
      'review_state':source_status,
      'reviewed_title_canonical':game_title_canonical or
        ((park_title or common_title or {}).get('canonical','')),
      'external_source_url':source_link,
      'gbif_evidence_state':gbif_evidence.get(ix,{}).get('verification_state','NOT_CHECKED_BY_GBIF'),
      'gbif_english_name_state':english_evidence.get(ix,{}).get('verified','NOT_CHECKED'),
      'gbif_taxon_url':gbif_evidence.get(ix,{}).get('source_url',''),
      'publisher_accepted':'NO','rationale_unverified':r['rationale']
    })
write('model-candidate-review.csv',list(candidate[0]),candidate)
summary={
 'questions':len(packs),
 'independent_playable_answers_from_manifest':manifest['answerCount'],
 'collision_groups_reviewed':len(statuses),
 'approved_editorial_orthographic_groups':sum(s['review_state']=='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses),
 'separately_verified_official_title_aliases':len(title_aliases),
 'gbif_verified_common_name_aliases':sum(len(v) for v in common_name_aliases.values()),
 'nps_official_full_title_aliases':len(official_reference_aliases.get('KR0084',[])),
 'browser_official_title_aliases':len(official_reference_aliases.get('KR0180',[])),
 'official_reference_aliases_total':sum(len(v) for v in official_reference_aliases.values()),
 'gbif_common_name_alias_question_count':len(common_name_aliases),
 'held_collision_groups':sum(s['review_state']!='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses),
 'held_but_identity_verified_distinct_groups':sum(s['identity_verification']=='VERIFIED_DISTINCT' for s in statuses),
 'remaining_identity_unresolved_groups':sum(s['review_state']!='APPROVED_EDITORIAL_EQUIVALENT' and s['identity_verification']=='NOT_ESTABLISHED' for s in statuses),
 'score_conflicts_preserved':sum(s['review_state']=='HOLD_SCORE_CONFLICT' for s in statuses),
 'missing_documented_100':len(missing),
 'third_party_archived_100_candidates':sum(1 for r in missing if r['id']=='KR0078' and
       any(a[0]=='Western Sahara' and a[1]==5 and a[2]=='archive' for a in packs['KR0078']['answers'])),
 'original_100_cases_without_source_archive_or_finite_resolution':len(missing)-len(complete)-1,
 'finite_categories_checked_complete_without_100':len(complete),
 'still_unresolved_original_100_rarity_cases':len(missing)-len(complete)-
   sum(1 for r in missing if r['id']=='KR0078' and any(a[0]=='Western Sahara' and a[1]==5 and a[2]=='archive' for a in packs['KR0078']['answers'])),
 'coverage_flags_finite_complete':sum(r['evidence_state'].startswith('FINITE_MEMBERSHIP_COMPLETE') for r in coverage_status),
 'coverage_flags_reference_limited':sum(r['evidence_state'].startswith('REFERENCE_LIMITED') for r in coverage_status),
 'coverage_flags_need_more_category_sources':sum(r['evidence_state'].startswith('OPEN_CATEGORY') for r in coverage_status),
 'missing_100_policy_breakdown':dict(Counter(r['100_point_policy'] for r in missing)),
 'coverage_below_current_playable_heuristic':len(low),
 'previous_source_reported_coverage_below':482,
 'quarantined_model_review_candidates':sum(r['review_state'].startswith('QUARANTINED') for r in candidate),
 'model_candidates_reconciled_as_title_aliases':sum(r['review_state']=='VERIFIED_OFFICIAL_POKEMON_ALIAS__SAME_SCORE' for r in candidate),
 'model_candidates_reconciled_as_nps_aliases':sum(r['review_state']=='VERIFIED_NPS_FULL_TITLE_ALIAS__SAME_SCORE' for r in candidate),
 'model_candidates_reconciled_as_gbif_aliases':sum(r['review_state']=='VERIFIED_GBIF_ENGLISH_ALIAS__SAME_SCORE' for r in candidate),
 'model_candidates_promoted_by_official_source':sum(r['review_state']=='VERIFIED_INDEPENDENT_SOURCE__ESTIMATED_PRACTICE_SCORE' for r in candidate),
 'model_candidates_originally_reviewed':len(candidate),
 'gbif_animal_letter_english_exact_verified':sum(r['gbif_english_name_state']=='EXACT_ENGLISH_SPECIES_AND_LETTER' for r in candidate),
 'gbif_animal_letter_english_rejected_or_unverified':sum(r['gbif_english_name_state']=='HOLD_UNVERIFIED' for r in candidate),
 'gbif_species_taxonomy_category_verified':sum(r['gbif_evidence_state']=='CATEGORY_VERIFIED_INDEPENDENT_SPECIES' for r in candidate),
 'gbif_exact_taxon_but_category_unverified':sum(r['gbif_evidence_state']=='TAXON_EXACT_CATEGORY_UNVERIFIED' for r in candidate),
 'gbif_taxon_no_exact_match':sum(r['gbif_evidence_state']=='TAXON_NOT_EXACT_OR_UNRESOLVED' for r in candidate),
 'model_candidates_absent_from_playable':sum(r['already_playable_estimate']=='NO' for r in candidate),
 'all_scores_are_publisher_verified':False,
 'no_100point_scores_invented':True
}
lexical_target_file=out/'lexical-target-audit.csv'
if lexical_target_file.exists():
    with lexical_target_file.open(encoding='utf8',newline='') as f:
        summary['lexical_heuristic_overstated_cases']=sum(r['screening_result']=='TARGET_NOT_SUPPORTED_BY_LOCAL_REFERENCE' for r in csv.DictReader(f))
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
