"""Validate the committed V4 catalogue. Package and provider choices are curated.
Never regenerate entries from the old host-blocked runtime inventory.
"""
import json
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parent.parent
read=lambda p: json.loads((root/p).read_text())
games=read('data/reference-games.json')
assert len(games)==128 and len({g['slug'] for g in games})==128
registry={g['slug']:g for g in read('docs/V4_INTEGRATION_STATUS.json')['games']}
for game in games:
    assert registry[game['slug']]['gameUrl']==game['gameUrl'],game['slug']
    assert urlparse(game['gameUrl']).hostname!='watchdocumentaries.com',game['slug']
    assert 'user-qa-pending' in game['tags'],game['slug']
    assert not game['gameUrl'].endswith('.swf'),game['slug']
assert len(read('scripts/reference-cover-sources.json')['items'])==128
print('Validated 128 curated records and covers; no files rewritten.')
