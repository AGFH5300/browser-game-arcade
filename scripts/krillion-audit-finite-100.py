#!/usr/bin/env python3
"""Audit finite category membership independently of 100-point rarity.
A zero 100-point score in an objectively complete answer universe is not a
spelling/coverage defect. All empirical original source tiers remain untouched.
"""
import csv,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bank=root/'public/play/deep-dive/recovered/independent-bank'
review=root/'data/krillion-review/96-missing-100-review.csv'
OUT=root/'data/krillion-review/finite-category-completeness.csv'
# Independently enumerated, intentionally narrowly-scoped sets; do not treat
# conjectural media, geographical edge cases or open ended categories as closed.
universe={
 'KR0204':'Togo;Oman;Niue;Mali;Laos;Fiji;Chad;Peru;Iraq;Iran;Cuba',
 'KR0214':'Raya;Pocahontas;Merida;Tiana;Rapunzel;Mulan;Moana;Jasmine;Aurora;Snow White;Cinderella;Belle;Ariel',
 'KR0218':'San Marino;Republic of the Congo;Lesotho;Trinidad and Tobago;Togo;Montenegro;Burkina Faso;Morocco;Monaco;Democratic Republic of the Congo;Mexico',
 'KR0306':'Radon;Fluorine;Xenon;Krypton;Argon;Nitrogen;Neon;Hydrogen;Chlorine;Oxygen;Helium',
 'KR0371':'Tuvalu;Timor-Leste;Turkmenistan;Tonga;Togo;Tajikistan;Tunisia;Trinidad and Tobago;Tanzania;Turkey;Thailand',
 'KR0384':'Uruguay;Argentina;Paraguay;Bolivia;Peru;Colombia;Venezuela;Guyana;Suriname;France',
 'KR0403':'Palau;Paraguay;Papua New Guinea;Philippines;Panama;Pakistan;Portugal;Poland;Peru',
 'KR0407':'Ivory Coast;Indonesia;Israel;Ireland;Iraq;Iran;Iceland;Italy;India',
 'KR0444':'United States;Russia;China;United Kingdom;France;India;Pakistan;North Korea;Israel',
 'KR0484':'Antigua and Barbuda;Azerbaijan;Armenia;Angola;Andorra;Algeria;Albania;Afghanistan;Austria;Australia;Argentina',
 'KR0491':'Afghanistan;Bhutan;India;Kazakhstan;North Korea;Kyrgyzstan;Laos;Mongolia;Myanmar;Nepal;Pakistan;Russia;Tajikistan;Vietnam',
 'KR0615':'Turkmenistan;Armenia;Pakistan;Jordan;Azerbaijan;Syria;Kuwait;Afghanistan;Iraq;Iran;Turkey;Saudi Arabia',
 'KR0754':'Slovakia;Lithuania;Belarus;Ukraine;Czechia;Russia;Germany',
 'KR0755':'Suriname;Netherlands;Andorra;Monaco;Luxembourg;Brazil;Switzerland;Belgium;Spain;Italy;Germany',
 'KR0757':'Death Proof;The Hateful Eight;Reservoir Dogs;Once Upon a Time in Hollywood;Jackie Brown;Inglourious Basterds;Pulp Fiction;Kill Bill: Volume 2;Kill Bill: Volume 1;Django Unchained',
 'KR0794':'England;Italy;Germany;France;Uruguay;Spain;Brazil;Argentina',
 'KR0803':'El Salvador;Belize;Panama;Nicaragua;Honduras;Guatemala;Costa Rica',
 'KR0842':'Luxembourg;Denmark;Czechia;Belgium;Switzerland;Netherlands;Austria;Poland;France',
 'KR0846':'Suriname;Guyana;Uruguay;Bolivia;Venezuela;Peru;Paraguay;Ecuador;Colombia;Chile;Brazil;Argentina',
 'KR0852':'Timor-Leste;Laos;Cambodia;Brunei;Myanmar;Vietnam;Thailand;Singapore;Philippines;Malaysia;Indonesia',
 'KR0864':'Wedge;Screw;Inclined plane;Pulley;Wheel and axle;Lever',
 'KR0876':'Montana;Missouri;Mississippi;Minnesota;Michigan;Massachusetts;Maryland;Maine',
 'KR0885':'North Dakota;North Carolina;New Mexico;New Jersey;New Hampshire;Nevada;Nebraska;New York',
 'KR0883':'Slovakia;Romania;Moldova;Hungary;Belarus;Poland;Russia',
 'KR0888':'Blitzen;Donner;Cupid;Vixen;Comet;Prancer;Rudolph;Dasher;Dancer',
 'KR0945':'Luxembourg;Denmark;Czechia;Belgium;Switzerland;Netherlands;Austria;Poland;France',
}
def normalized(a):return re.sub('[^a-z0-9]','',a.casefold())
def audit():
    data=[]
    for id,raw in universe.items():
        p=json.loads((bank/(id+'.json')).read_text())
        got=[r[0] for r in p['answers']]
        expected=raw.split(';')
        e={normalized(v) for v in expected}
        g={normalized(v) for v in got}
        missing=[v for v in expected if normalized(v) not in g]
        extra=[v for v in got if normalized(v) not in e]
        assert not missing and not extra,(id,missing,extra)
        assert len(got)==len(expected)==len(e),(id,len(got),len(expected))
        assert not any(r[1]==5 for r in p['answers']),id+' has documented 100 already'
        data.append({'id':id,'question':p['prompt'],'expected_members':len(expected),
            'playable_members':len(got),'coverage_state':'COMPLETE_UNDER_DOCUMENTED_FINITE_DEFINITION',
            '100_point_score':'NONE_IN_DOCUMENTED_ARCHIVE','publisher_100_absence_proven':'NO',
            'result':'NO_EVIDENCE_BASED_100_POINT_VALUE_TO_ADD',
            'note':'Full enumerated list is covered in independent practice, existing tiers retained. No evidence warrants inventing a 100-point answer.'})
    with OUT.open('w',encoding='utf8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(data[0]),lineterminator='\n');w.writeheader();w.writerows(data)
    rows=list(csv.DictReader(review.open()))
    closed=set(universe)
    assert all(r['id'] in {x['id'] for x in rows} for r in data)
    for r in rows:
        if r['id'] in closed:
            r['review_state']='MEMBERSHIP_COMPLETE__NO_DOCUMENTED_100'
            r['decision']='DO_NOT_INVENT_RARITY_FOR_FINITE_COMPLETE_CATEGORY'
            r['needs_empirical_guess_frequency']='YES_TO_CLAIM_NEW_100'
    with review.open('w',encoding='utf8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
    print(json.dumps({'audited_complete':len(data),'other_100_cases_not_evidence_closed':len(rows)-len(data),
      'finite_audit_total_answers':sum(x['playable_members'] for x in data)},indent=2))
if __name__=='__main__':audit()
