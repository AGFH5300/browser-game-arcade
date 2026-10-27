import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'scripts/flash-package-sources.json'), 'utf8'));
const archives = path.join(root, 'public/play/archives');
const cacheRoot = path.join(root, '.next/cache/sidequest-games/flash');
const ruffleSource = path.join(root, 'node_modules/@ruffle-rs/ruffle');
const ruffleTarget = path.join(archives, 'ruffle');

if (manifest.ruffleVersion !== '0.7.1') throw new Error(`Expected pinned Ruffle 0.7.1, received ${manifest.ruffleVersion}`);
const seenSlugs = new Set();
for (const pkg of manifest.packages) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.slug) || seenSlugs.has(pkg.slug)) throw new Error(`Invalid or duplicate Flash package slug: ${pkg.slug}`);
  if (!/^https:\/\//.test(pkg.url) || !/^[a-f0-9]{64}$/.test(pkg.sha256) || !Number.isSafeInteger(pkg.size)) throw new Error(`Invalid source pin for ${pkg.slug}`);
  seenSlugs.add(pkg.slug);
  const fileName = pkg.file || 'game.swf';
  if (path.basename(fileName) !== fileName) throw new Error(`Invalid package file for ${pkg.slug}`);

  const packageDir = path.join(archives, pkg.slug);
  const publicGamePath = path.join(packageDir, fileName);
  const cacheDir = path.join(cacheRoot, pkg.sha256);
  const cachedGamePath = path.join(cacheDir, fileName);
  await mkdir(packageDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  let data = await readIfExists(cachedGamePath);
  if (data) {
    verifySwf(pkg, data);
  } else {
    data = await readIfExists(publicGamePath);
    if (!data) {
      const response = await fetch(pkg.url, {
        headers: { 'user-agent': 'Sidequest-Flash-Asset-Prep/1.0 (+local build)' },
        signal: AbortSignal.timeout(90_000),
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`Download failed for ${pkg.slug}: HTTP ${response.status}`);
      data = Buffer.from(await response.arrayBuffer());
    }
    verifySwf(pkg, data);
    await writeNewOrMatch(cachedGamePath, data, pkg.slug);
    data = await readFile(cachedGamePath);
    verifySwf(pkg, data);
  }
  await writeNewOrMatch(publicGamePath, data, pkg.slug);

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; worker-src 'self' blob:; manifest-src 'self'; form-action 'none'; base-uri 'none'">
<title>${escapeHtml(pkg.title)}</title><style>html,body,#game{box-sizing:border-box;width:100%;height:100%;margin:0;overflow:hidden;background:#05070d}#game{display:grid;place-items:center}ruffle-player{display:block;width:100%;height:100%}#status{position:fixed;inset:auto 12px 12px;color:#ddd;font:14px system-ui,sans-serif;pointer-events:none}</style>
<script src="player.js"></script><script src="../ruffle/ruffle.js"></script><script defer src="wrapper.js"></script>
</head><body><main id="game" aria-label="${escapeHtml(pkg.title)}"></main><p id="status" role="status" hidden></p></body></html>\n`;
  const config = `window.RufflePlayer = window.RufflePlayer || {};\nwindow.RufflePlayer.config = { autoplay: "off", allowScriptAccess: false, openUrlMode: "deny", allowNetworking: "none", showSwfDownload: false, polyfills: false };\n`;
  const wrapper = `(() => {\n  let player = null;\n  let muted = false;\n  const host = document.getElementById('game');\n  const status = document.getElementById('status');\n  function applyAudio() { if (player) player.volume = muted ? 0 : 1; }\n  window.addEventListener('message', (event) => {\n    const data = event.data;\n    if (event.source !== parent || !data || data.type !== 'sidequest:audio-set' || typeof data.muted !== 'boolean') return;\n    muted = data.muted; applyAudio();\n    parent.postMessage({ type: 'sidequest:audio-state', muted, supported: true }, '*');\n  });\n  try {\n    const api = window.RufflePlayer && window.RufflePlayer.newest();\n    if (!api) throw new Error('The local Ruffle runtime did not initialize.');\n    player = api.createPlayer();\n    player.setAttribute('aria-label', ${JSON.stringify(pkg.title)});\n    host.appendChild(player);\n    applyAudio();\n    player.ruffle().load(${JSON.stringify(fileName)}).catch((error) => {\n      status.hidden = false; status.textContent = 'The Flash game could not load in the local player.';\n      console.error('Ruffle load failed:', error);\n      parent.postMessage({ type: 'sidequest:error' }, '*');\n    });\n    parent.postMessage({ type: 'sidequest:audio-ready' }, '*');\n  } catch (error) {\n    status.hidden = false; status.textContent = 'The local Flash player could not start.';\n    console.error(error);\n    parent.postMessage({ type: 'sidequest:error' }, '*');\n  }\n})();\n`;
  const packageNotes = {
    ...pkg,
    authorizationNote: manifest.authorizationNote,
    runtime: {
      name: '@ruffle-rs/ruffle', version: manifest.ruffleVersion,
      licensePaths: ['../ruffle/LICENSE_MIT', '../ruffle/LICENSE_APACHE'],
      licenseIds: ['MIT', 'Apache-2.0'],
      config: { autoplay: 'off', allowScriptAccess: false, openUrlMode: 'deny', allowNetworking: 'none' },
      limitation: 'Ruffle 0.7.1 documents allowNetworking="none" as not implemented; wrapper CSP limits network destinations to same-origin as additional defense.',
    },
    gameplayQa: 'Not performed.',
  };
  await Promise.all([
    writeFile(path.join(packageDir, 'index.html'), html),
    writeFile(path.join(packageDir, 'player.js'), config),
    writeFile(path.join(packageDir, 'wrapper.js'), wrapper),
    writeFile(path.join(packageDir, 'source-manifest.json'), `${JSON.stringify(packageNotes, null, 2)}\n`),
  ]);
}

await mkdir(ruffleTarget, { recursive: true });
await cp(ruffleSource, ruffleTarget, { recursive: true, force: true });
for (const required of ['ruffle.js', 'LICENSE_MIT', 'LICENSE_APACHE']) {
  try { await readFile(path.join(ruffleTarget, required)); }
  catch { throw new Error(`Pinned Ruffle package is missing ${required}`); }
}

const cacheManifest = {
  ...manifest,
  ruffleRuntime: {
    package: '@ruffle-rs/ruffle', version: manifest.ruffleVersion,
    source: 'Pinned npm package in package-lock.json',
    copiedFiles: 'Full package copied to public/play/archives/ruffle, including LICENSE_MIT and LICENSE_APACHE.',
    licenses: ['MIT (LICENSE_MIT)', 'Apache-2.0 (LICENSE_APACHE)'],
    configuration: { autoplay: 'off', allowScriptAccess: false, openUrlMode: 'deny', allowNetworking: 'none' },
    limitation: 'Ruffle 0.7.1 documentation states allowNetworking="none" is not implemented. The wrapper CSP restricts network destinations to same-origin as additional defense. Gameplay QA was not performed.',
  },
};
const manifestFile = path.join(cacheRoot, 'source-manifest.json');
const manifestBytes = `${JSON.stringify(cacheManifest, null, 2)}\n`;
await writeFile(manifestFile, manifestBytes);

console.log(`Prepared ${manifest.packages.length} pinned Flash packages with Ruffle ${manifest.ruffleVersion}.`);

async function readIfExists(file) {
  try { return await readFile(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function writeNewOrMatch(file, data, slug) {
  try { await writeFile(file, data, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const existing = await readFile(file);
    if (!existing.equals(data)) throw new Error(`Refusing to overwrite a different pinned file for ${slug}: ${file}`);
  }
}

function verifySwf(pkg, data) {
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (data.length !== pkg.size || sha256 !== pkg.sha256) throw new Error(`${pkg.slug} does not match its pin (${data.length} bytes, ${sha256})`);
  if (!['CWS', 'FWS', 'ZWS'].includes(data.subarray(0, 3).toString('ascii'))) throw new Error(`${pkg.slug} is not an SWF file`);
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
