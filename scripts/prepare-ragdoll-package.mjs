// Prepare the pinned Ragdoll Hit Unity build from Git blob-verified source parts.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(ROOT, 'scripts/ragdoll-source.json');
const OUTPUT_DIR = path.join(ROOT, 'public/play/archives/ragdoll-hit');
const CACHE_ROOT = path.join(ROOT, '.next/cache/sidequest-games/ragdoll');
const AUDIO_BRIDGE = path.join(ROOT, 'public/play/arcade-bridge.js');
const MAX_FILE_BYTES = 30 * 1024 * 1024;

const source = JSON.parse(await readFile(SOURCE_FILE, 'utf8'));
if (source.slug !== 'ragdoll-hit' || source.source !== 'bubbls/UGS-Assets' ||
    !/^[a-f0-9]{40}$/.test(source.revision) || source.sourcePath !== 'ragdoll-hit') {
  throw new Error('Ragdoll source must remain pinned to the reviewed public repository and revision.');
}

function gitBlobSha(bytes) {
  return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeChild(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.posix.isAbsolute(relativePath) ||
      relativePath.includes('\\') || relativePath.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe package path: ' + relativePath);
  }
  const base = path.resolve(root);
  const child = path.resolve(base, ...relativePath.split('/'));
  if (!child.startsWith(base + path.sep)) throw new Error('Package path escapes its root: ' + relativePath);
  return child;
}

function rawUrl(file) {
  const suffix = file.path.split('/').map(encodeURIComponent).join('/');
  return 'https://raw.githubusercontent.com/' + source.source + '/' + source.revision + '/' +
    source.sourcePath.split('/').map(encodeURIComponent).join('/') + '/' + suffix;
}

function isVerified(bytes, file) {
  return bytes.length === file.size && gitBlobSha(bytes) === file.sha;
}

async function getVerifiedSource(file) {
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES ||
      !/^[a-f0-9]{40}$/.test(file.sha)) {
    throw new Error('Invalid pinned source metadata for ' + file.path);
  }
  const cachedFile = safeChild(path.join(CACHE_ROOT, source.revision), file.path);
  try {
    const cached = await readFile(cachedFile);
    if (isVerified(cached, file)) return cached;
  } catch {
    // A cold cache is expected. A corrupt cache is replaced from the pinned source.
  }

  const response = await fetch(rawUrl(file), { redirect: 'follow', headers: { 'accept-encoding': 'identity' } });
  if (!response.ok) throw new Error('Source fetch failed (' + response.status + '): ' + file.path);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!isVerified(bytes, file)) throw new Error('Pinned Git blob SHA or size mismatch: ' + file.path);
  await mkdir(path.dirname(cachedFile), { recursive: true });
  await writeFile(cachedFile, bytes);
  return bytes;
}

async function mapLimit(values, limit, callback) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await callback(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function assertUniqueSourcePaths(files) {
  const seen = new Set();
  for (const file of files) {
    safeChild(ROOT, file.path);
    if (seen.has(file.path)) throw new Error('Duplicate source path: ' + file.path);
    seen.add(file.path);
  }
}

assertUniqueSourcePaths(source.files);
const sourceBytes = new Map();
await mapLimit(source.files, 4, async file => {
  sourceBytes.set(file.path, await getVerifiedSource(file));
});

const assemblies = source.assemblies || [];
for (const assembly of assemblies) {
  if (!Array.isArray(assembly.parts) || assembly.parts.length === 0) throw new Error('Invalid assembly: ' + assembly.outputPath);
  const parts = assembly.parts.map(part => {
    const bytes = sourceBytes.get(part);
    if (!bytes) throw new Error('Assembly references an unfetched source part: ' + part);
    return bytes;
  });
  const assembled = Buffer.concat(parts);
  if (assembled.length !== assembly.size || sha256(assembled) !== assembly.sha256) {
    throw new Error('Reassembled Unity payload does not match its pinned output hash: ' + assembly.outputPath);
  }
  sourceBytes.set(assembly.outputPath, assembled);
}

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });
for (const file of source.files) {
  if (!file.include || file.path.includes('.part')) continue;
  await mkdir(path.dirname(safeChild(OUTPUT_DIR, file.path)), { recursive: true });
  await writeFile(safeChild(OUTPUT_DIR, file.path), sourceBytes.get(file.path));
}
for (const assembly of assemblies) {
  const outputFile = safeChild(OUTPUT_DIR, assembly.outputPath);
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, sourceBytes.get(assembly.outputPath));
}
await copyFile(AUDIO_BRIDGE, path.join(OUTPUT_DIR, 'bridge.js'));

const metadata = {
  companyName: 'Ericetto',
  productName: 'Ragdoll Hit',
  productVersion: '0.1',
  dataUrl: 'Build/959bf1c60308f1c34bf072f43c3c17d4.data.unityweb',
  frameworkUrl: 'Build/3276aa7c11496bcc48eb6908f112f0c3.js.unityweb',
  codeUrl: 'Build/f23c0f3f40a28f1adce731399dde22aa.wasm.unityweb',
  streamingAssetsUrl: 'StreamingAssets'
};
const indexLines = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="utf-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
  '  <meta name="theme-color" content="#4d4d4d">',
  '  <title>Ragdoll Hit</title>',
  '  <style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#4d4d4d}#game{width:100%;height:100%;display:block;touch-action:none}</style>',
  '  <script src="MobileDetect.js"></script>',
  '  <script src="poki-sdk.js"></script>',
  '</head>',
  '<body>',
  '  <script src="bridge.js"></script>',
  '  <canvas id="game" tabindex="-1"></canvas>',
  '  <script>',
  '  (function () {',
  '    "use strict";',
  '    var canvas = document.getElementById("game");',
  '    var config = ' + JSON.stringify(metadata) + ';',
  '    function sendPokiMessage(message) {',
  '      if (window.pokiBridge && window.unityGame) window.unityGame.SendMessage(window.pokiBridge, message);',
  '      else if (message === "ready") window.pokiReady = true;',
  '      else if (message === "adblock") window.pokiAdBlock = true;',
  '    }',
  '    if (window.PokiSDK && typeof window.PokiSDK.init === "function") {',
  '      window.PokiSDK.init().then(function () { sendPokiMessage("ready"); }).catch(function () {',
  '        sendPokiMessage("adblock");',
  '        console.info("AdBlocker active");',
  '      });',
  '    } else {',
  '      window.pokiAdBlock = true;',
  '    }',
  '    var loader = document.createElement("script");',
  '    loader.src = "Build/v84.loader.js";',
  '    loader.onload = function () {',
  '      window.PokiSDK && window.PokiSDK.gameLoadingStart();',
  '      window.createUnityInstance(canvas, config, function (progress) {',
  '        window.PokiSDK && window.PokiSDK.gameLoadingProgress({ percentageDone: progress });',
  '      }).then(function (instance) {',
  '        window.unityGame = instance;',
  '        window.PokiSDK && window.PokiSDK.gameLoadingFinished();',
  '      }).catch(function (error) { console.error("Unity startup failed", error); });',
  '    };',
  '    loader.onerror = function () { console.error("Unity loader failed to load"); };',
  '    document.head.appendChild(loader);',
  '  })();',
  '  </script>',
  '</body>',
  '</html>',
  ''
];
const indexHtml = indexLines.join('\n');
await writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml);

const outputFiles = [];
for (const file of source.files.filter(item => item.include && !item.path.includes('.part'))) {
  const bytes = sourceBytes.get(file.path);
  outputFiles.push({ path: file.path, source: file.path, size: bytes.length, sha256: sha256(bytes) });
}
for (const assembly of assemblies) {
  const bytes = sourceBytes.get(assembly.outputPath);
  outputFiles.push({ path: assembly.outputPath, sourceParts: assembly.parts, size: bytes.length, sha256: sha256(bytes) });
}
const bridgeBytes = await readFile(AUDIO_BRIDGE);
outputFiles.push({ path: 'bridge.js', source: 'public/play/arcade-bridge.js', size: bridgeBytes.length, sha256: sha256(bridgeBytes) });
const htmlBytes = Buffer.from(indexHtml);
outputFiles.push({ path: 'index.html', generated: 'clean local Unity bootstrap', size: htmlBytes.length, sha256: sha256(htmlBytes) });

const sourceManifest = {
  formatVersion: 1,
  slug: source.slug,
  source: source.source,
  revision: source.revision,
  sourcePath: source.sourcePath,
  originalEntry: source.entry,
  sourceLicense: source.provenance.sourceLicense,
  ownerPermission: source.provenance.ownerPermission,
  modifications: source.modifications,
  sourceFiles: source.files.map(file => ({
    path: file.path,
    size: file.size,
    gitBlobSha1: file.sha,
    included: file.include,
    handling: file.handling
  })),
  assemblies,
  outputs: outputFiles,
  serving: {
    unityPayloads: 'Serve .unityweb payloads as byte-exact files with no HTTP Content-Encoding so Unity can apply its embedded Brotli fallback.'
  }
};
await writeFile(path.join(OUTPUT_DIR, 'source-manifest.json'), JSON.stringify(sourceManifest, null, 2) + '\n');
console.log('Prepared Ragdoll Hit from pinned revision ' + source.revision + ' (' + source.files.length + ' verified source files).');
