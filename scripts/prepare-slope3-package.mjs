// Prepare the complete, pinned Slope 3 Unity build from byte-verified Git blobs.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OVERRIDES_FILE = path.join(ROOT, 'scripts/reference-recovery-overrides.json');
const OUTPUT_DIR = path.join(ROOT, 'public/play/archives/slope-3');
const CACHE_ROOT = path.join(ROOT, '.next/cache/sidequest-games/slope3');
const MAX_TOTAL_DOWNLOAD_BYTES = 50_000_000;
const MAX_CONCURRENCY = 3;

const allOverrides = JSON.parse(await readFile(OVERRIDES_FILE, 'utf8'));
const source = allOverrides.records?.find(record => record.slug === 'slope-3');
if (!source || source.source !== 'Slope3/Slope3.github.io' ||
    source.revision !== '114ce2132ebfa47d8f4a82814d759d7bd34da2c7' ||
    !Array.isArray(source.pinnedTreeFiles) || source.pinnedTreeFiles.length !== 22) {
  throw new Error('Slope 3 source must remain pinned to the reviewed complete repository tree.');
}

const totalPinnedBytes = source.pinnedTreeFiles.reduce((sum, file) => sum + file.size, 0);
if (totalPinnedBytes > MAX_TOTAL_DOWNLOAD_BYTES) {
  throw new Error(`Pinned Slope 3 tree exceeds the ${MAX_TOTAL_DOWNLOAD_BYTES}-byte download ceiling.`);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function gitBlobSha(bytes) {
  return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}

function safeChild(base, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.posix.isAbsolute(relativePath) ||
      relativePath.includes('\\') || relativePath.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe package path: ' + relativePath);
  }
  const root = path.resolve(base);
  const child = path.resolve(root, ...relativePath.split('/'));
  if (!child.startsWith(root + path.sep)) throw new Error('Package path escapes its root: ' + relativePath);
  return child;
}

function validatePinnedFile(file) {
  if (!file || typeof file.path !== 'string' || typeof file.url !== 'string' ||
      !Number.isSafeInteger(file.size) || file.size < 0 ||
      !/^[a-f0-9]{40}$/.test(file.gitBlobSha1 || '')) {
    throw new Error('Invalid pinned source metadata: ' + JSON.stringify(file));
  }
  safeChild(OUTPUT_DIR, file.path);
  const expectedUrl = `https://raw.githubusercontent.com/Slope3/Slope3.github.io/${source.revision}/${file.path}`;
  if (file.url !== expectedUrl) throw new Error('Unexpected pinned source URL for ' + file.path);
}

const seenPaths = new Set();
for (const file of source.pinnedTreeFiles) {
  validatePinnedFile(file);
  if (seenPaths.has(file.path)) throw new Error('Duplicate pinned source path: ' + file.path);
  seenPaths.add(file.path);
}

async function readBounded(response, maxBytes, label) {
  if (!response.body) throw new Error('Empty response body: ' + label);
  const chunks = [];
  let byteCount = 0;
  for await (const chunk of response.body) {
    const bytes = Buffer.from(chunk);
    byteCount += bytes.length;
    if (byteCount > maxBytes) throw new Error('Source response exceeded its pinned size: ' + label);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, byteCount);
}

function matchesPin(bytes, file) {
  return bytes.length === file.size && gitBlobSha(bytes) === file.gitBlobSha1;
}

async function fetchVerifiedSource(file) {
  const cachedFile = safeChild(path.join(CACHE_ROOT, source.revision), file.path);
  try {
    const cached = await readFile(cachedFile);
    if (matchesPin(cached, file)) return cached;
  } catch {
    // Cache misses and mismatches are replaced from the immutable GitHub revision.
  }

  const response = await fetch(file.url, {
    redirect: 'follow',
    headers: { 'accept-encoding': 'identity' }
  });
  if (!response.ok) throw new Error(`Source fetch failed (${response.status}): ${file.url}`);
  const finalHost = new URL(response.url).hostname;
  if (finalHost !== 'raw.githubusercontent.com' && finalHost !== 'githubusercontent.com') {
    throw new Error(`Unexpected source redirect host ${finalHost}: ${file.url}`);
  }
  const bytes = await readBounded(response, file.size, file.path);
  if (!matchesPin(bytes, file)) throw new Error('Git blob SHA or size mismatch: ' + file.path);
  const cacheFilePath = safeChild(path.join(CACHE_ROOT, source.revision), file.path);
  await mkdir(path.dirname(cacheFilePath), { recursive: true });
  await writeFile(cacheFilePath, bytes);
  return bytes;
}

async function mapLimit(files, limit, callback) {
  const results = new Array(files.length);
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const index = cursor++;
      results[index] = await callback(files[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(files.length, limit) }, worker));
  return results;
}

const fetchedBytes = await mapLimit(source.pinnedTreeFiles, MAX_CONCURRENCY, async file => {
  const bytes = await fetchVerifiedSource(file);
  console.log(`Verified ${file.path} (${bytes.length} bytes)`);
  return [file.path, bytes];
});
const sourceBytes = new Map(fetchedBytes);

const sourceConfig = JSON.parse(sourceBytes.get('Build/Slope3.json').toString('utf8'));
const expectedConfig = {
  companyName: 'GreenLight',
  productName: 'SlopeGame',
  productVersion: '0.1',
  dataUrl: 'Slope3.data.unityweb',
  wasmCodeUrl: 'Slope3.wasm.code.unityweb',
  wasmFrameworkUrl: 'Slope3.wasm.framework.unityweb',
  unityVersion: '2019.4.24f1'
};
for (const [key, value] of Object.entries(expectedConfig)) {
  if (sourceConfig[key] !== value) throw new Error(`Unexpected Unity config value for ${key}.`);
}

const excludedPaths = new Set(source.excludedPaths || []);
const sourceHtmlPin = source.pinnedTreeFiles.find(file => file.path === 'index.html');
if (!sourceHtmlPin || !source.replaceSourceEntry?.sourceUrl) {
  throw new Error('Pinned source entry HTML is required for provenance.');
}

const indexHtml = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '  <script src="./bridge.js"></script>',
  '  <meta charset="utf-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
  '  <meta name="theme-color" content="#231F20">',
  '  <title>Slope 3</title>',
  '  <link rel="icon" href="./unity/favicon.ico">',
  '  <link rel="stylesheet" href="./unity/style.css">',
  '  <style>html,body,#gameContainer{width:100%;height:100%;margin:0;overflow:hidden;background:#231F20}#gameContainer{position:absolute;inset:0}.webgl-content{width:100%;height:100%}</style>',
  '  <script src="./unity/dummy.js"></script>',
  '  <script src="./unity/unity-mod.js"></script>',
  '  <script src="./unity/UnityProgress.js"></script>',
  '  <script src="./Build/UnityLoader.js"></script>',
  '</head>',
  '<body>',
  '  <main id="gameView" class="webgl-content"><div id="gameContainer"></div></main>',
  '  <script>',
  '    (function () {',
  '      "use strict";',
  '      var gameInstance = null;',
  '      gameInstance = UnityLoader.instantiate("gameContainer", "Build/Slope3.json", {',
  '        onProgress: UnityProgress,',
  '        Module: { onRuntimeInitialized: function () { UnityProgress(gameInstance, "complete"); } }',
  '      });',
  '      window.gameInstance = gameInstance;',
  '    })();',
  '  </script>',
  '</body>',
  '</html>',
  ''
].join('\n');

if (/ubg44|analytics_ubg|ubg235_client|https?:\/\//i.test(indexHtml)) {
  throw new Error('Generated entry must not contain portal redirects, tracking scripts, or external URLs.');
}

const filesToCopy = source.pinnedTreeFiles.filter(file => {
  if (file.path === 'index.html' || excludedPaths.has(file.path)) return false;
  const basename = path.posix.basename(file.path).toUpperCase();
  const licenseOrAttribution = file.path === '@source.txt' ||
    /^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/.test(basename);
  return file.required === true || licenseOrAttribution || [
    'favicon.ico', 'logo.png', 'unity/favicon.ico', 'js/null.js', 'json/config.json', 'json/null.json', 'json/ping.json'
  ].includes(file.path);
});
if (!filesToCopy.some(file => file.path === '@source.txt')) {
  throw new Error('The pinned @source.txt attribution file must be preserved in the package.');
}

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });
const outputFiles = [];
const bridgeBytes=await readFile(path.join(ROOT,'public/play/arcade-bridge.js'));
await writeFile(path.join(OUTPUT_DIR,'bridge.js'),bridgeBytes);
outputFiles.push({path:'bridge.js',generatedFrom:'public/play/arcade-bridge.js',outputBytes:bridgeBytes.length,outputSha256:sha256(bridgeBytes)});
for (const file of filesToCopy) {
  const bytes = sourceBytes.get(file.path);
  const destination = safeChild(OUTPUT_DIR, file.path);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  outputFiles.push({
    path: file.path,
    sourceUrl: file.url,
    sourceGitBlobSha1: file.gitBlobSha1,
    sourceSize: file.size,
    outputSha256: sha256(bytes),
    byteExact: true
  });
}

await writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
outputFiles.push({
  path: 'index.html',
  generated: 'minimal UnityLoader wrapper; removes source portal redirect and external portal scripts',
  sourceEntryUrl: source.replaceSourceEntry.sourceUrl,
  sourceGitBlobSha1: sourceHtmlPin.gitBlobSha1,
  sourceSize: sourceHtmlPin.size,
  outputSha256: sha256(Buffer.from(indexHtml)),
  byteExact: false
});

const licensePaths = source.pinnedTreeFiles
  .map(file => file.path)
  .filter(filePath => /(^|\/)(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/i.test(filePath));
const manifest = {
  formatVersion: 1,
  slug: 'slope-3',
  source: source.source,
  revision: source.revision,
  sourceTreeUrl: source.inspectSourceUrl,
  sourceEntryUrl: source.replaceSourceEntry.sourceUrl,
  sourceEntryHandling: source.replaceSourceEntry.handling,
  unity: {
    companyName: sourceConfig.companyName,
    productName: sourceConfig.productName,
    productVersion: sourceConfig.productVersion,
    unityVersion: sourceConfig.unityVersion,
    configPath: 'Build/Slope3.json',
    configSha256: sha256(sourceBytes.get('Build/Slope3.json')),
    configPayloadUrls: [sourceConfig.dataUrl, sourceConfig.wasmCodeUrl, sourceConfig.wasmFrameworkUrl]
  },
  sourceAttribution: {
    retainedPath: '@source.txt',
    sourceGitBlobSha1: source.pinnedTreeFiles.find(file => file.path === '@source.txt').gitBlobSha1,
    formalLicenseFilesFoundInPinnedTree: licensePaths,
    licenseAssessment: licensePaths.length ? 'Source license files are included at their original paths.' :
      'No LICENSE, LICENCE, COPYING, or NOTICE file appears in the pinned source tree; no upstream license is asserted.'
  },
  modifications: [
    'Generated a local entry shell that invokes the pinned legacy UnityLoader with the original Build/Slope3.json.',
    'Removed the source shell redirect and publisher analytics/client scripts from the runtime entry.',
    'Copied original Unity binaries and runtime/template files byte-for-byte; no game binary or hostname was patched.'
  ],
  excludedSourcePaths: [...excludedPaths, 'index.html'].sort(),
  download: {
    pinnedSourceFileCount: source.pinnedTreeFiles.length,
    verifiedSourceBytes: totalPinnedBytes,
    maximumSourceBytes: MAX_TOTAL_DOWNLOAD_BYTES,
    gitBlobVerification: 'git blob SHA-1 and byte size checked for every source file.'
  },
  serving: {
    unityPayloads: 'Serve .unityweb files byte-exact and without HTTP Content-Encoding; Unity applies its embedded Brotli fallback.',
    requiredUrls: source.requiredUrls
  },
  outputs: outputFiles
};
await writeFile(path.join(OUTPUT_DIR, 'source-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared Slope 3 at ${path.relative(ROOT, OUTPUT_DIR)} from ${source.revision}; verified ${totalPinnedBytes} source bytes.`);
