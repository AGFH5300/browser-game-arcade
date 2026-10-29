// Prepare pinned, hash-checked offline game packages. Visitors never fetch source files.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getLocalOfflineSdkAdapter } from './reference-sdk-adapters.mjs';

const manifestUrl = new URL('./extra-package-sources.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const outputBase = path.resolve('public/play/archives');
const cacheBase = path.resolve('.next/cache/sidequest-games/extra');
const motoAdapter = getLocalOfflineSdkAdapter('moto-x3m');
if (!motoAdapter) throw new Error('Moto X3M has no reviewed guest-only local adapter.');
const adapterSource = path.resolve(motoAdapter.file);
const bridgeSource = path.resolve('public/play/arcade-bridge.js');
const USER_AUTHORIZATION = 'Owner authorization for selected game content is recorded by the project. It is not an upstream license and does not erase source-specific distribution conditions.';
const MAX_BYTES_PER_FILE = 30 * 1024 * 1024;

function gitBlobSha(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

function localSha(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeChild(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe package path: ${relativePath}`);
  }
  const resolvedRoot = path.resolve(root);
  const resolvedChild = path.resolve(resolvedRoot, relativePath);
  if (!resolvedChild.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Package path escapes its root: ${relativePath}`);
  }
  return resolvedChild;
}

function rawUrl(pkg, filePath) {
  const segments = [pkg.source, pkg.revision];
  if (pkg.sourcePath && pkg.sourcePath !== '.') segments.push(pkg.sourcePath);
  segments.push(filePath);
  return `https://raw.githubusercontent.com/${segments.map((part, index) => index < 2 ? part : part.split('/').map(encodeURIComponent).join('/')).join('/')}`;
}

async function verifiedLocal(filePath, expectedSha, expectedSize) {
  try {
    const bytes = await readFile(filePath);
    return bytes.length === expectedSize && gitBlobSha(bytes) === expectedSha ? bytes : null;
  } catch {
    return null;
  }
}

async function verifiedSource(pkg, file) {
  if (!Number.isInteger(file.size) || file.size < 0 || file.size > MAX_BYTES_PER_FILE) {
    throw new Error(`Invalid or oversized source entry: ${pkg.slug}/${file.path}`);
  }
  if (!/^[a-f0-9]{40}$/i.test(file.sha)) throw new Error(`Invalid Git blob SHA: ${pkg.slug}/${file.path}`);

  const cachePath = safeChild(path.join(cacheBase, pkg.revision, pkg.slug), file.path);
  const outputPath = safeChild(path.join(outputBase, pkg.slug), file.path);
  let bytes = await verifiedLocal(cachePath, file.sha, file.size)
    || await verifiedLocal(outputPath, file.sha, file.size);

  if (!bytes) {
    const response = await fetch(rawUrl(pkg, file.path), { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`Source download failed (${response.status}): ${pkg.slug}/${file.path}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== file.size || gitBlobSha(bytes) !== file.sha) {
      throw new Error(`Pinned Git blob verification failed: ${pkg.slug}/${file.path}`);
    }
  }

  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, bytes);
  return bytes;
}

async function fetchPackageSources(pkg, packageRoot) {
  const importFiles = pkg.files.filter(file => file.include || file.noticeOnly);
  for (let offset = 0; offset < importFiles.length; offset += 8) {
    await Promise.all(importFiles.slice(offset, offset + 8).map(async file => {
      const bytes = await verifiedSource(pkg, file);
      const relativeOutput = file.noticeOnly
        ? path.join('original-notices', path.basename(file.path))
        : file.path;
      const destination = safeChild(packageRoot, relativeOutput);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
    }));
  }
}

function replaceRequired(html, expression, replacement, label, expectedCount = 1) {
  const matches = html.match(expression) ?? [];
  if (matches.length !== expectedCount) {
    throw new Error(`${label}: expected ${expectedCount} matching source tags, found ${matches.length}`);
  }
  return html.replace(expression, replacement);
}

async function transformMotoX3M(packageRoot) {
  const entry = safeChild(packageRoot, 'index.html');
  let html = await readFile(entry, 'utf8');
  html = replaceRequired(html, /<script\b(?=[^>]*\bid=["']gamebridge-sdk["'])[^>]*>[\s\S]*?<\/script\s*>/gi, '', 'Moto X3M gamebridge tag');
  html = replaceRequired(html, /<script\b[^>]*\bsrc=["']pk-sdk\.js["'][^>]*>\s*<\/script\s*>/gi, '', 'Moto X3M pk-sdk tag');
  html = replaceRequired(html, /<script\b[^>]*\bsrc=["']https:\/\/imasdk\.googleapis\.com\/js\/sdkloader\/ima3\.js["'][^>]*>\s*<\/script\s*>/gi, '', 'Moto X3M IMA tag');
  const runtime = await readFile(safeChild(packageRoot, 'motox3m.min.js'), 'utf8');
  if (!/renderer\s*:\s*Phaser\.AUTO/.test(runtime) || /renderer\s*:\s*Phaser\.WEBGL/.test(runtime)) {
    throw new Error('Moto X3M runtime differs from the pinned Phaser.AUTO build; refusing renderer changes.');
  }
  html = html.replace('</head>', '    <script src="bridge.js"></script>\n    <script src="offline-adapter.js"></script>\n</head>');
  if (!html.includes('offline-adapter.js') || !html.includes('bridge.js')) throw new Error('Moto X3M local adapters could not be added.');
  await writeFile(entry, html);
  const adapter = await readFile(adapterSource);
  await writeFile(safeChild(packageRoot, 'offline-adapter.js'), adapter);
  const bridge = await readFile(bridgeSource);
  await writeFile(safeChild(packageRoot, 'bridge.js'), bridge);
  return {
    index: 'Removed the upstream gamebridge, pk-sdk and IMA script tags; the game runtime source and assets were not patched.',
    adapter: 'Reuses the repository guest adapter for observed ID/GameAPI callbacks. Login remains not-authorized; score/achievement saves are no-ops; showNextAd grants no reward.',
    bridge: 'Added the repository audio bridge so the player mute control can reach the local game.',
    generatedFiles: [
      { path: 'offline-adapter.js', size: adapter.length, sha256: localSha(adapter) },
      { path: 'bridge.js', size: bridge.length, sha256: localSha(bridge) },
    ],
  };
}

async function transformSlope(packageRoot) {
  const entry = safeChild(packageRoot, 'index.html');
  let html = await readFile(entry, 'utf8');
  html = replaceRequired(html, /<script\b(?=[^>]*googlesyndication\.com)[\s\S]*?<\/script\s*>/gi, '', 'Slope Google Ads tags', 2);
  html = replaceRequired(html, /<script\b(?=[^>]*static\.getclicky\.com)[\s\S]*?<\/script\s*>/gi, '', 'Slope Clicky script');
  html = replaceRequired(html, /<noscript\b[^>]*>[\s\S]*?in\.getclicky\.com[\s\S]*?<\/noscript\s*>/gi, '', 'Slope Clicky noscript');
  html = html.replace('</head>', '    <script src="bridge.js"></script>\n</head>');
  await writeFile(entry, html);
  const bridge = await readFile(bridgeSource);
  await writeFile(safeChild(packageRoot, 'bridge.js'), bridge);
  return {
    index: 'Removed the Google Ads loader tags and Clicky analytics script/noscript. Unity game code and assets were not patched.',
    bridge: 'Added the repository audio bridge so the player mute control can reach the local game.',
    generatedFiles: [{ path: 'bridge.js', size: bridge.length, sha256: localSha(bridge) }],
  };
}

async function transformSnowRider(packageRoot) {
  const entry = safeChild(packageRoot, 'index.html');
  let html = await readFile(entry, 'utf8');
  html = replaceRequired(html, /<script\b[^>]*>[\s\S]*?window\.location\s*=\s*["']https:\/\/snowrider3d\.ubg235\.com\/["'];?[\s\S]*?<\/script\s*>/gi, '', 'Snow Rider 3D portal redirect');
  html = replaceRequired(html, /<script\b[^>]*\bsrc=["']js\/analytics_ubg_v1_4\.js["'][^>]*>\s*<\/script\s*>/gi, '', 'Snow Rider 3D analytics tag');
  if (/ubg235|analytics_ubg_v1_4/i.test(html)) throw new Error('Snow Rider 3D entry still refers to a portal redirect or analytics dependency.');
  // The pinned community mirror has the complete Unity runtime/build assets,
  // but its HTML omitted the UnityLoader and UnityProgress bootstrap entirely.
  // Without it the container stays blank with no network or console errors.
  // Restore the published Unity WebGL bootstrap using ONLY the existing pinned
  // files. Do not import third-party ads, analytics or the portal redirect.
  if (/UnityLoader\.instantiate|<script[^>]+Build\/UnityLoader\.js/i.test(html))
    throw new Error('Snow Rider source bootstrap changed; inspect before patching.');
  const loaderBootstrap = [
    '    <script src="bridge.js"></script>',
    '    <script src="TemplateData/UnityProgress.js"></script>',
    '    <script src="Build/UnityLoader.js"></script>',
    '    <script>',
    '      window.addEventListener("DOMContentLoaded", function () {',
    '        try {',
    '          window.gameInstance = UnityLoader.instantiate("gameContainer", "Build/SnowRider3D-gd-1.json", { onProgress: UnityProgress });',
    '        } catch (error) {',
    '          console.error("Snow Rider Unity startup failed", error);',
    '          var box = document.getElementById("gameContainer");',
    '          if (box) box.textContent = "Snow Rider failed to start. Try restarting the game."; ',
    '        }',
    '      });',
    '    </script>',
  ].join('\n');
  html = html.replace('</head>', loaderBootstrap + '\n</head>');
  if (!html.includes('UnityLoader.instantiate("gameContainer"')) throw new Error('Snow Rider bootstrap was not written.');
  await writeFile(entry, html);
  const bridge = await readFile(bridgeSource);
  await writeFile(safeChild(packageRoot, 'bridge.js'), bridge);
  return {
    index: 'Removed redirect/analytics; restored missing local UnityLoader/UnityProgress startup bootstrap while keeping game payload unchanged.',
    bridge: 'Added the repository audio bridge so the player mute control can reach the local game.',
    generatedFiles: [{ path: 'bridge.js', size: bridge.length, sha256: localSha(bridge) }],
  };
}

const transforms = {
  'moto-x3m': transformMotoX3M,
  slope: transformSlope,
  'snow-rider-3d': transformSnowRider,
};

if (!Array.isArray(manifest.packages) || manifest.packages.length !== 3) {
  throw new Error('Expected exactly the three reviewed extra packages.');
}

const reports = [];
for (const pkg of manifest.packages) {
  if (!/^[a-f0-9]{40}$/i.test(pkg.revision)) throw new Error(`Unpinned source revision: ${pkg.slug}`);
  if (!/^[a-z0-9-]+$/.test(pkg.slug)) throw new Error(`Unsafe package slug: ${pkg.slug}`);
  const transform = transforms[pkg.slug];
  if (!transform) throw new Error(`No reviewed transformation defined for ${pkg.slug}`);
  if (!Array.isArray(pkg.files) || !pkg.files.length || !pkg.files.some(file => file.path === pkg.entry && file.include)) {
    throw new Error(`Package entry is not included in the pinned manifest: ${pkg.slug}`);
  }
  const packageRoot = path.resolve(outputBase, pkg.slug);
  await rm(packageRoot, { recursive: true, force: true });
  await mkdir(packageRoot, { recursive: true });
  await fetchPackageSources(pkg, packageRoot);
  const transformation = await transform(packageRoot);

  const allSourceBytes = pkg.files.reduce((sum, file) => sum + file.size, 0);
  const imported = pkg.files.filter(file => file.include);
  const noticeFiles = pkg.files.filter(file => file.noticeOnly || (file.notice && file.include));
  const sourceManifest = {
    formatVersion: 1,
    game: pkg.slug,
    source: pkg.source,
    revision: pkg.revision,
    sourcePath: pkg.sourcePath,
    entry: pkg.entry,
    repositoryUrl: `https://github.com/${pkg.source}`,
    pinnedSourceUrl: `https://github.com/${pkg.source}/tree/${pkg.revision}${pkg.sourcePath && pkg.sourcePath !== '.' ? `/${pkg.sourcePath}` : ''}`,
    sourceFileCount: pkg.files.length,
    sourceBytes: allSourceBytes,
    importedRuntimeFileCount: imported.length,
    importedRuntimeBytes: imported.reduce((sum, file) => sum + file.size, 0),
    files: pkg.files,
    originalNotices: noticeFiles.map(file => ({
      sourcePath: file.path,
      outputPath: file.noticeOnly ? `original-notices/${path.basename(file.path)}` : file.path,
      sha: file.sha,
      size: file.size,
    })),
    provenance: pkg.provenance,
    ownerAuthorization: USER_AUTHORIZATION,
    manualGameplayQA: 'Deferred to the user as requested; this preparer performs source/hash and static entry checks only.',
    localChanges: [transformation.index, ...(transformation.adapter ? [transformation.adapter] : []), ...(transformation.bridge ? [transformation.bridge] : [])],
    preparationNotes: pkg.modifications,
    generatedFiles: transformation.generatedFiles,
  };
  await writeFile(safeChild(packageRoot, 'source-manifest.json'), `${JSON.stringify(sourceManifest, null, 2)}\n`);
  reports.push({ slug: pkg.slug, sourceFiles: pkg.files.length, sourceBytes: allSourceBytes, importedRuntimeFiles: imported.length, importedRuntimeBytes: sourceManifest.importedRuntimeBytes });
}

console.log(JSON.stringify({ prepared: reports }, null, 2));
