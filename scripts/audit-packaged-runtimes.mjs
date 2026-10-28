#!/usr/bin/env node

// Read-only package gate. It validates files already emitted by the reference
// packager and checks a few runtime formats whose core dependencies are known.
// It does not run a browser or claim gameplay QA.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const archivesRoot = path.join(repoRoot, 'public', 'play', 'archives');
const args = process.argv.slice(2);
const slugs = args.filter((arg) => !arg.startsWith('--'));
const useDeployed = args.includes('--deployed');
const deployedSlugs = useDeployed
  ? [...JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts', 'deployed-reference-packages.json'), 'utf8')), 'slope-3', 'ragdoll-hit']
  : [];
const requestedSlugs = useDeployed ? [...new Set(deployedSlugs)] : slugs;
const packageDirs = requestedSlugs.length
  ? requestedSlugs.map((slug) => [slug, path.join(archivesRoot, slug)])
  : fs.existsSync(archivesRoot)
    ? fs.readdirSync(archivesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => [entry.name, path.join(archivesRoot, entry.name)])
        .sort(([a], [b]) => a.localeCompare(b))
    : [];

const ASSET_EXT = /\.(?:png|jpe?g|gif|webp|svg|json|js|mjs|css|wasm|data|unityweb|mp3|ogg|wav|mp4|webm|woff2?|ttf|eot)$/i;
const LOCAL_ASSET_PREFIX = /^(?:\.\/|\/)?(?:assets|images|media|audio|fonts|icons|data|scripts)\//i;

function safePackagePath(packageDir, relPath) {
  const candidate = path.resolve(packageDir, relPath);
  return candidate === packageDir || candidate.startsWith(`${packageDir}${path.sep}`)
    ? candidate
    : null;
}

function setRuntime(details, runtime) {
  if (details.runtime === 'unclassified') details.runtime = runtime;
}

function existsRelative(packageDir, relPath) {
  const candidate = safePackagePath(packageDir, relPath);
  return Boolean(candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function cleanLocalPath(raw) {
  let value = raw.trim().replaceAll('\\/', '/');
  if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value)) return null;
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the original path when a template literal is not URI-encoded.
  }
  const pathname = value.split(/[?#]/, 1)[0];
  return pathname.replace(/^\.\//, '').replace(/^\//, '');
}

function localHtmlReferences(packageDir, htmlPath, html, issues, details) {
  // Ignore commented-out includes (several publisher mirrors leave their SDK
  // tag in a comment after removing the corresponding request).
  const activeHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  const refPattern = /<(script|link|img|source|audio|video|iframe)\b[^>]*?\b(src|href|poster)\s*=\s*(["'])(.*?)\3/gi;
  for (const match of activeHtml.matchAll(refPattern)) {
    const tag = match[1].toLowerCase();
    const attr = match[2].toLowerCase();
    const raw = match[4];
    if (/^(?:https?:)?\/\//i.test(raw)) {
      if (tag === 'script') {
        details.externalScripts.push(raw);
        const basename = path.posix.basename(raw.split(/[?#]/, 1)[0]);
        const localTwin = [...activeHtml.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi)]
          .some((entry) => {
            const candidate = entry[2];
            if (/^(?:https?:)?\/\//i.test(candidate)) return false;
            const local = cleanLocalPath(candidate);
            if (!local) return false;
            const baseDir = path.posix.dirname(htmlPath);
            const resolved = path.posix.normalize(path.posix.join(baseDir === '.' ? '' : baseDir, local));
            return path.posix.basename(resolved) === basename && existsRelative(packageDir, resolved);
          });
        issues.push({
          severity: localTwin ? 'warning' : 'blocker',
          code: localTwin ? 'external-entry-script-has-local-copy' : 'external-entry-script',
          path: htmlPath,
          detail: localTwin
            ? `External script is also referenced locally as ${basename}; the local copy is packaged, but the external request remains blocked: ${raw}`
            : `Entry script is external and archive CSP blocks it: ${raw}`
        });
      }
      continue;
    }
    const local = cleanLocalPath(raw);
    if (!local) continue;
    const baseDir = path.posix.dirname(htmlPath);
    const resolved = path.posix.normalize(path.posix.join(baseDir === '.' ? '' : baseDir, local));
    if (resolved.startsWith('../') || resolved === '..') continue;
    if (!existsRelative(packageDir, resolved)) {
      const severity = tag === 'script' ? 'blocker' : 'warning';
      issues.push({ severity, code: tag === 'script' ? 'missing-entry-script' : 'missing-entry-asset', path: resolved, detail: `${tag}.${attr} reference from ${htmlPath} is absent from the archive.` });
    }
  }
}

function discoverC3(manifest, packageDir, files, issues, details) {
  const main = files.find((file) => /(?:^|\/)scripts\/main\.js$/i.test(file.path));
  const htmlText = readText(safePackagePath(packageDir, manifest.sourceEntry || 'index.html'));
  const mainText = main ? readText(safePackagePath(packageDir, main.path)) : '';
  const runtime = files.find(file => /(?:^|\/)scripts\/c3runtime\.js$/i.test(file.path) || (mainText.includes('runtimeScriptList') && mainText.includes('scripts/c3main.js') && file.path==='scripts/c3main.js'));
  const runtimeText = runtime ? readText(safePackagePath(packageDir, runtime.path)) : '';
  const isC3 = /Construct\s*3|engineScripts\s*:\s*\[|new\s+self\.RuntimeInterface/i.test(`${htmlText}\n${mainText}`) || Boolean(runtime);
  if (!isC3) return;

  setRuntime(details, 'construct-3');
  const useWorker = mainText.match(/\buseWorker\s*:\s*(!0|!1|true|false)\b/i)?.[1]?.toLowerCase();
  const enableWorker = mainText.match(/\b(?:const|let|var)\s+enableWorker\s*=\s*(true|false)/i)?.[1]?.toLowerCase();
  const workerRequired = useWorker ? !['!1', 'false'].includes(useWorker) : enableWorker !== 'false';
  details.constructWorkerRequired = workerRequired;
  if (!runtime) issues.push({ severity: 'blocker', code: 'missing-c3-runtime', detail: 'Construct main.js expects scripts/c3runtime.js, but it is not packaged.' });
  const worker = mainText.match(/workerMainUrl\s*:\s*["']([^"']+)["']/)?.[1];
  if (worker && workerRequired && !existsRelative(packageDir, worker)) {
    issues.push({ severity: 'blocker', code: 'missing-c3-worker', path: worker, detail: 'Construct 3 worker entry is referenced by main.js but is absent.' });
  }
  const workerDeps = mainText.match(/workerDependencyScripts\s*:\s*\[([^\]]*)\]/)?.[1] || '';
  for (const dep of (workerRequired ? workerDeps : '').matchAll(/["']([^"']+)["']/g)) {
    if (!existsRelative(packageDir, dep[1])) issues.push({ severity: 'blocker', code: 'missing-c3-worker-dependency', path: dep[1], detail: 'Construct 3 worker dependency is referenced by main.js but is absent.' });
  }

  const needsData = /FetchJson\(["']data\.json["']\)/.test(runtimeText);
  if (needsData && !existsRelative(packageDir, 'data.json')) {
    issues.push({ severity: 'blocker', code: 'missing-c3-project-data', path: 'data.json', detail: 'Construct 3 runtime explicitly FetchJson("data.json"); the required project document is absent.' });
  } else if (needsData) {
    details.constructDataJson = 'present';
    try {
      const projectData = JSON.parse(readText(path.join(packageDir, 'data.json')));
      const referenced = new Set();
      collectAssetPaths(projectData, referenced);
      const missing = [...referenced].filter((ref) => !existsRelative(packageDir, ref));
      if (missing.length) issues.push({ severity: 'blocker', code: 'missing-c3-project-assets', detail: `${missing.length} media path(s) in data.json are absent.`, paths: missing.slice(0, 25) });
      details.constructDataAssets = { referenced: referenced.size, missing: missing.length };
    } catch (error) {
      issues.push({ severity: 'blocker', code: 'invalid-c3-project-data', path: 'data.json', detail: `Construct data.json is not valid JSON: ${error.message}` });
    }
  }
}

function discoverC2(packageDir, files, issues, details) {
  const runtime = files.find((file) => /(?:^|\/)c2runtime\.js$/i.test(file.path));
  if (!runtime) return;
  const runtimeText = readText(safePackagePath(packageDir, runtime.path));
  const filename = runtimeText.match(/datajs_filename\s*=\s*["']([^"']+)["']/)?.[1] || 'data.js';
  setRuntime(details, 'construct-2');
  details.construct2ProjectData = filename;
  if (!existsRelative(packageDir, filename)) {
    issues.push({ severity: 'blocker', code: 'missing-c2-project-data', path: filename, detail: `Construct 2 runtime loads ${filename}; the project document is absent.` });
  }
}

function discoverCocos(packageDir, files, issues, details) {
  const settings = files.find((file) => /(?:^|\/)(?:settings(?:\.[a-f0-9]+)?|settings)\.js$/i.test(file.path));
  if (!settings) return;
  const text = readText(safePackagePath(packageDir, settings.path));
  if (!/_CCSettings\s*=/.test(text)) return;
  setRuntime(details, 'cocos-creator');
  const hasResources = /hasResourcesBundle\s*:\s*true/.test(text);
  const assetFiles = files.filter((file) => /^(?:assets|src)\//i.test(file.path)
    && !/(?:^|\/)(?:settings(?:\.[a-f0-9]+)?|main(?:\.[a-f0-9]+)?|application(?:\.[a-f0-9]+)?)\.js$/i.test(file.path));
  details.cocos = { hasResourcesBundle: hasResources, packagedAssetFiles: assetFiles.length };
  if (hasResources && assetFiles.length === 0) {
    issues.push({ severity: 'blocker', code: 'missing-cocos-resources-bundle', detail: `${settings.path} sets hasResourcesBundle=true, but no assets/ or src/ resource bundle is packaged.` });
  }
  if (hasResources && assetFiles.length > 0 && !files.some((file) => /^(?:assets|src)\/(?:resources|internal|main|assets)(?:\/|\.)/i.test(file.path))) {
    issues.push({ severity: 'blocker', code: 'cocos-bundle-not-found', detail: `${settings.path} enables the resources bundle, but the package has no recognizable resources/internal/main/asset bundle (loose files found: ${assetFiles.length}).` });
  }
}

function discoverUnity(manifest, packageDir, files, issues, details) {
  const declaredEngine = String(manifest.runtimeAudit?.engineClassification || '').toLowerCase();
  const unityFiles = files.filter((file) => /\.unityweb$/i.test(file.path));
  const isUnity = declaredEngine.includes('unity') || unityFiles.length > 0 || Boolean(manifest.unity);
  if (!isUnity) return;
  setRuntime(details, 'unity-webgl');
  const names = files.map((file) => file.path);
  let hasData = names.some((name) => /(?:\.data(?:\.unityweb)?|_data\.unityweb)$/i.test(name));
  let hasCode = names.some((name) => /\.wasm(?:\.[a-z]+)?(?:\.unityweb)?$|\.asm\.code\.unityweb$|_wasmcode\.unityweb$/i.test(name));
  const hasLoader = names.some((name) => /(?:loader|\.js$)/i.test(name) && /\.js$/i.test(name));
  // Legacy Unity builds can use opaque payload names. Validate the configured
  // roles rather than requiring descriptive .data/.wasm filenames.
  for(const file of files.filter(file=>file.path.endsWith('.json'))){
    let config;try{config=JSON.parse(readText(safePackagePath(packageDir,file.path)));}catch{continue;}
    const codeKeys=config.wasmCodeUrl&&config.wasmFrameworkUrl?['wasmCodeUrl','wasmFrameworkUrl']:config.asmCodeUrl?['asmCodeUrl','asmMemoryUrl','asmFrameworkUrl']:[];
    if(!config.dataUrl||!codeKeys.length)continue;
    const configured=['dataUrl',...codeKeys].map(role=>({role,value:config[role]}));
    const resolved=configured.map(item=>{
      if(typeof item.value!=='string')return {...item,present:false};
      const local=/^https?:/.test(item.value)?files.find(f=>f.url===item.value||f.originalRuntimeReference===item.value)?.path:path.posix.normalize(path.posix.join(path.posix.dirname(file.path),decodeURIComponent(item.value.split(/[?#]/,1)[0])));
      return {...item,path:local,present:Boolean(local&&existsRelative(packageDir,local))};
    });
    details.unityConfiguredPayloads=resolved;
    const missing=resolved.filter(item=>!item.present);
    if(missing.length)issues.push({severity:'blocker',code:'missing-configured-unity-payload',path:file.path,detail:'Unity build configuration references absent payloads.',paths:missing.map(item=>item.value||item.role)});
    hasData ||= resolved.find(item=>item.role==='dataUrl')?.present===true;
    hasCode ||= resolved.filter(item=>item.role!=='dataUrl').every(item=>item.present);
  }
  details.unityPayloads = unityFiles.map((file) => {
    const diskPath = safePackagePath(packageDir, file.path);
    const sample = fs.readFileSync(diskPath).subarray(0, 4);
    const magic = sample[0] === 0x1f && sample[1] === 0x8b ? 'gzip' : 'other-or-identity';
    return { path: file.path, bytes: file.size, sourceEncoding: file.wireContentEncoding || null, artifactEncoding: file.contentEncoding || null, magic };
  });
  if (!hasData) issues.push({ severity: 'blocker', code: 'missing-unity-data', detail: 'Unity package has no .data or .data.unityweb payload.' });
  if (!hasCode) issues.push({ severity: 'blocker', code: 'missing-unity-runtime-code', detail: 'Unity package has no WebAssembly or asm.js runtime code payload.' });
  if (!hasLoader) issues.push({ severity: 'blocker', code: 'missing-unity-loader', detail: 'Unity package has no JavaScript loader/runtime entry.' });
}

function discoverPackedLime(packageDir, files, issues, details) {
  for (const file of files.filter((entry) => /\.js$/i.test(entry.path) && (entry.size || 0) > 100_000)) {
    const text = readText(safePackagePath(packageDir, file.path));
    if (!/PackedAssetLibrary|libraryArgs/.test(text)) continue;
    const at = text.indexOf('libraryArgs');
    const nearby = text.slice(at, at + 500).replaceAll('\\"', '"').replaceAll('\\/', '/');
    const packedPath = nearby.match(/([A-Za-z0-9._/-]+\.pak)/)?.[1];
    if (!packedPath) continue;
    setRuntime(details, 'lime-packed-assets');
    details.packedAssetLibrary = packedPath;
    const packingMode = nearby.match(/\.pak["']\s*,\s*["']([^"']+)["']/)?.[1] || null;
    details.packedAssetCompression = packingMode;
    if (!existsRelative(packageDir, packedPath)) {
      issues.push({ severity: 'blocker', code: 'missing-packed-asset-library', path: packedPath, detail: `Embedded Lime manifest names ${packedPath}, but the package does not contain it.` });
    } else if (packingMode === 'gzip') {
      const sample = fs.readFileSync(safePackagePath(packageDir, packedPath)).subarray(0, 64);
      const magicOffset = sample.findIndex((byte, index) => byte === 0x1f && sample[index + 1] === 0x8b);
      const prefix = sample.toString('ascii', 0, Math.min(sample.length, 20));
      const recognizedHeader = (prefix.startsWith('lime-asset-pack') && magicOffset === 15)
        || (prefix.startsWith('asset-pack') && magicOffset === 10);
      if (magicOffset !== 0 && !recognizedHeader) {
        issues.push({ severity: 'blocker', code: 'packed-asset-compression-mismatch', path: packedPath, detail: 'Lime declares gzip packing, but no gzip stream was found at the file start or after a recognized Lime asset-pack header.' });
      } else {
        details.packedAssetCompressionEvidence = magicOffset === 0 ? 'gzip at byte 0' : `gzip after ${magicOffset}-byte Lime asset-pack header`;
      }
    }
    return;
  }
}

function discoverFireboy(manifest, packageDir, files, issues, details) {
  const gameConfigFile = files.find((file) => /(?:^|\/)game\.json$/i.test(file.path));
  const jsFile = files.find((file) => /fireboy-and-watergirl-(?:forest|light)-temple\.min\.js$/i.test(file.path));
  if (!gameConfigFile || !jsFile) return;
  let config;
  try {
    config = JSON.parse(readText(safePackagePath(packageDir, gameConfigFile.path)));
  } catch (error) {
    issues.push({ severity: 'blocker', code: 'invalid-fireboy-config', path: gameConfigFile.path, detail: `Fireboy game.json is invalid: ${error.message}` });
    return;
  }

  setRuntime(details, 'phaser-fireboy-watergirl');
  const temples = Array.isArray(config.temples) ? config.temples : [config.temples || config.assets || config.id].filter(Boolean);
  const required = [];
  const source = readText(safePackagePath(packageDir, jsFile.path));
  for (const temple of temples) {
    const id = String(temple);
    required.push(`data/${id}/temple.json`);
    required.push(`assets/atlasses/Temples/${id}/TempleAssets.png`);
    required.push(`assets/atlasses/Temples/${id}/TempleAssets.json`);
  }
  if (temples.length > 1 && /"TempleIcons"/.test(source)) {
    required.push('assets/atlasses/TempleIcons.png', 'assets/atlasses/TempleIcons.json');
  }
  const missing = [...new Set(required)].filter((file) => !existsRelative(packageDir, file));
  if (missing.length) issues.push({ severity: 'blocker', code: 'missing-fireboy-theme-assets', detail: `The boot theme in game.json requires local temple data and atlases absent from the archive.`, paths: missing });

  const templeData = required.filter((file) => file.endsWith('/temple.json') && existsRelative(packageDir, file));
  for (const dataPath of templeData) {
    try {
      const json = JSON.parse(readText(safePackagePath(packageDir, dataPath)));
      const refs = new Set();
      collectAssetPaths(json, refs);
      const levelFiles = new Set();
      collectLevelFileNames(json, levelFiles);
      for (const levelFile of levelFiles) refs.add(levelFile.startsWith('data/') ? levelFile : `data/${levelFile}`);
      const absent = [...refs].filter((ref) => !existsRelative(packageDir, ref));
      if (absent.length) issues.push({ severity: 'blocker', code: 'missing-fireboy-level-assets', path: dataPath, detail: `${absent.length} asset path(s) referenced by temple data are absent.`, paths: absent.slice(0, 30) });
      details.fireboyDataAssets = { path: dataPath, referenced: refs.size, missing: absent.length };
    } catch (error) {
      issues.push({ severity: 'blocker', code: 'invalid-fireboy-temple-data', path: dataPath, detail: `Temple data is not valid JSON: ${error.message}` });
    }
  }

  details.fireboyTheme = temples;
  details.fireboyRequiredCoreFiles = required;
}

function collectLevelFileNames(value, result) {
  if (Array.isArray(value)) {
    for (const child of value) collectLevelFileNames(child, result);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:filename|file)$/i.test(key) && typeof child === 'string' && /\.(?:json|tmx)$/i.test(child)) {
        result.add(child);
      } else {
        collectLevelFileNames(child, result);
      }
    }
  }
}

function discoverYandexAdapter(packageDir, files, issues, details) {
  for (const file of files.filter((entry) => /vph_yagames\.js$/i.test(entry.path))) {
    const text = readText(safePackagePath(packageDir, file.path));
    if (text.includes('Sidequest guest/offline compatibility adapter')) {
      const manifestPath = path.join(packageDir, 'source-manifest.json');
      let manifest = {};
      try {
        manifest = JSON.parse(readText(manifestPath));
      } catch {
        // The ordinary manifest validation reports malformed source metadata.
      }
      const pinned = (manifest.files || []).find((entry) => entry.path === file.path);
      const overlay = (manifest.localOverlays || []).find((entry) => entry.path === file.path);
      const actualHash = crypto.createHash('sha256').update(fs.readFileSync(safePackagePath(packageDir, file.path))).digest('hex');
      if (!pinned || pinned.sha256 !== actualHash || !overlay || overlay.sha256 !== actualHash) {
        issues.push({ severity: 'blocker', code: 'guest-adapter-metadata-mismatch', path: file.path, detail: 'Guest adapter is present but its local overlay and artifact hash are not consistently recorded in source-manifest.json.' });
      } else {
        setRuntime(details, 'gamemaker-html5-guest-offline');
        details.guestAdapter = {
          available: false,
          publisherSdkAvailable: false,
          accountAvailable: false,
          adsAvailable: false,
          rewardsAvailable: false,
          artifactSha256: actualHash
        };
      }
      continue;
    }
    if (!/\.src\s*=\s*["']sdk\.js["']/.test(text)) continue;
    const sdkPath = 'sdk.js'; // Script URLs resolve against index.html/document base, not this adapter's directory.
    if (!existsRelative(packageDir, sdkPath)) {
      issues.push({ severity: 'blocker', code: 'missing-publisher-sdk', path: sdkPath, detail: 'YaGames adapter injects this path relative to the game document (index.html), then the GameMaker controller polls SDK initialization before starting. The SDK file is absent; external SDK access is blocked by archive CSP.' });
    }
  }
}

function discoverGameMaker(packageDir, files, details) {
  const gameCore = files.find((file) => /(?:^|\/)gd_arrow_neon\.js$/i.test(file.path));
  if (!gameCore) return;
  const source = readText(safePackagePath(packageDir, gameCore.path));
  setRuntime(details, source.includes('Sidequest guest/offline compatibility adapter')
    ? 'gamemaker-html5-guest-offline'
    : /YaGamesGMS_getInitStatus|YaGamesGMS_showFullscreenAdv/.test(source)
      ? 'gamemaker-html5-with-yagames-extension'
      : 'gamemaker-html5');
}

function discoverKnownDependencies(slug, packageDir, files, issues, details) {
  const required = slug === 'papas-freezeria'
    ? ['assets/fonts.swf', 'assets/papa_freezeria_sdk.swf']
    : slug === 'drift-boss'
      ? ['media/graphics/packed/texture.png']
      : [];
  if (!required.length) return;
  setRuntime(details, slug === 'papas-freezeria' ? 'flash-papa-series' : 'game-asset-bundle');
  const missing = required.filter((file) => !existsRelative(packageDir, file));
  if (missing.length) issues.push({
    severity: 'blocker',
    code: slug === 'papas-freezeria' ? 'missing-papa-swf-core' : 'missing-drift-boss-atlas',
    detail: 'Static runtime evidence identifies required core game assets that are absent from the archive.',
    paths: missing
  });
  details.requiredRuntimeFiles = required;
}

function collectAssetPaths(value, result) {
  if (typeof value === 'string') {
    const clean = cleanLocalPath(value);
    if (clean && LOCAL_ASSET_PREFIX.test(value) && ASSET_EXT.test(clean)) result.add(clean);
    return;
  }
  if (Array.isArray(value)) {
    for (const child of value) collectAssetPaths(child, result);
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectAssetPaths(child, result);
  }
}

function readText(filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function auditPackage(slug, packageDir) {
  const issues = [];
  const details = { runtime: 'unclassified', externalScripts: [] };
  const manifestPath = path.join(packageDir, 'source-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { slug, status: 'hold', integrity: null, details, issues: [{ severity: 'blocker', code: 'missing-source-manifest', detail: 'Archive package has no source-manifest.json.' }] };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { slug, status: 'hold', integrity: null, details, issues: [{ severity: 'blocker', code: 'invalid-source-manifest', detail: error.message }] };
  }

  if (manifest.referencePackageManifest !== true && Array.isArray(manifest.outputs)) {
    return auditDeclaredOutputManifest(slug, packageDir, manifest, details);
  }
  if (manifest.referencePackageManifest !== true && Array.isArray(manifest.files)) {
    return auditLegacySourceManifest(slug, packageDir, manifest, details);
  }

  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const outputPaths = new Set(files.map((file) => file.path));
  const missing = [];
  const mismatch = [];
  let bytes = 0;
  for (const file of files) {
    const diskPath = safePackagePath(packageDir, file.path);
    if (!diskPath || !fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) {
      missing.push(file.path);
      continue;
    }
    const buffer = fs.readFileSync(diskPath);
    bytes += buffer.length;
    if (Number.isFinite(file.size) && buffer.length !== file.size) mismatch.push({ path: file.path, kind: 'size', expected: file.size, actual: buffer.length });
    if (file.sha256) {
      const digest = crypto.createHash('sha256').update(buffer).digest('hex');
      if (digest !== file.sha256) mismatch.push({ path: file.path, kind: 'sha256' });
    }
  }
  if (missing.length) issues.push({ severity: 'blocker', code: 'missing-pinned-files', paths: missing.slice(0, 40), detail: `${missing.length} pinned manifest file(s) are absent.` });
  if (mismatch.length) issues.push({ severity: 'blocker', code: 'pinned-file-integrity-mismatch', paths: mismatch.slice(0, 40), detail: `${mismatch.length} pinned file size/hash check(s) failed.` });

  let bridgeBytes = 0;
  if (manifest.bridge?.path) {
    const bridgePath = safePackagePath(packageDir, manifest.bridge.path);
    if (!bridgePath || !fs.existsSync(bridgePath) || !fs.statSync(bridgePath).isFile()) {
      issues.push({ severity: 'blocker', code: 'missing-bridge', path: manifest.bridge.path, detail: 'Packager integration bridge is missing.' });
    } else {
      const bridgeBuffer = fs.readFileSync(bridgePath);
      bridgeBytes = bridgeBuffer.length;
      const bridgeHash = crypto.createHash('sha256').update(bridgeBuffer).digest('hex');
      if (manifest.bridge.sha256 && bridgeHash !== manifest.bridge.sha256) {
        issues.push({ severity: 'blocker', code: 'bridge-integrity-mismatch', path: manifest.bridge.path, detail: 'Integration bridge hash differs from source-manifest.json.' });
      }
    }
  }
  const expectedArtifactBytes = bytes;
  if (Number.isFinite(manifest.artifactBytes) && manifest.artifactBytes !== expectedArtifactBytes) {
    issues.push({ severity: 'blocker', code: 'artifact-byte-total-mismatch', detail: `source-manifest.json says ${manifest.artifactBytes} artifact bytes; its pinned files array totals ${expectedArtifactBytes}.` });
  }

  const entryPath = manifest.sourceEntry || 'index.html';
  const entryFile = safePackagePath(packageDir, entryPath);
  const entryText = readText(entryFile);
  if (!entryText) issues.push({ severity: 'blocker', code: 'missing-entry-html', path: entryPath, detail: 'Configured entry HTML is absent or empty.' });
  else localHtmlReferences(packageDir, entryPath, entryText, issues, details);

  discoverC3(manifest, packageDir, files, issues, details);
  discoverC2(packageDir, files, issues, details);
  discoverCocos(packageDir, files, issues, details);
  discoverUnity(manifest, packageDir, files, issues, details);
  discoverPackedLime(packageDir, files, issues, details);
  discoverYandexAdapter(packageDir, files, issues, details);
  discoverFireboy(manifest, packageDir, files, issues, details);
  discoverGameMaker(packageDir, files, details);
  discoverKnownDependencies(slug, packageDir, files, issues, details);

  const encodingPairs = [...new Set(files.map((file) => `${file.wireContentEncoding || 'unknown'}->${file.contentEncoding || 'unknown'}`))];
  details.encodings = encodingPairs;
  details.manifestWarnings = (manifest.warnings || []).length;
  details.manifestErrors = manifest.errors || [];
  if (details.manifestErrors.length) issues.push({ severity: 'blocker', code: 'packager-errors', detail: 'Source package manifest records packager errors.', errors: details.manifestErrors });

  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;
  return {
    slug,
    title: manifest.title || slug,
    status: blockerCount ? 'hold' : details.runtime === 'unclassified' ? 'needs-review' : 'asset-check-pass',
    integrity: {
      pinnedFiles: files.length,
      missing: missing.length,
      mismatches: mismatch.length,
      summedBytes: bytes,
      manifestArtifactBytes: manifest.artifactBytes ?? null,
      bridgeBytes,
      note: 'artifactBytes sums the pinned files array; bridge hash/size are checked separately, and source-manifest.json is not counted as a game artifact.'
    },
    details,
    issues
  };
}

function collectPhysicalFiles(packageDir, dir = packageDir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectPhysicalFiles(packageDir, fullPath, result);
    else if (entry.isFile()) {
      const relPath = path.relative(packageDir, fullPath).split(path.sep).join('/');
      if (relPath !== 'source-manifest.json') result.push({ path: relPath, size: fs.statSync(fullPath).size });
    }
  }
  return result;
}

function finalizeLegacyReport(slug, title, packageDir, manifest, files, details, issues, integrity) {
  const entryPath = manifest.entry || 'index.html';
  const entryText = readText(safePackagePath(packageDir, entryPath));
  if (!entryText) issues.push({ severity: 'blocker', code: 'missing-entry-html', path: entryPath, detail: 'Configured entry HTML is absent or empty.' });
  else localHtmlReferences(packageDir, entryPath, entryText, issues, details);
  discoverUnity({ runtimeAudit: { engineClassification: 'unity-webgl' } }, packageDir, files, issues, details);
  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;
  return {
    slug,
    title,
    status: blockerCount ? 'hold' : details.runtime === 'unclassified' ? 'needs-review' : 'asset-check-pass',
    integrity,
    details,
    issues
  };
}

function auditDeclaredOutputManifest(slug, packageDir, manifest, details) {
  const issues = [];
  const files = manifest.outputs;
  const missing = [];
  const mismatches = [];
  let bytes = 0;
  for (const file of files) {
    const diskPath = safePackagePath(packageDir, file.path);
    if (!diskPath || !fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) {
      missing.push(file.path);
      continue;
    }
    const buffer = fs.readFileSync(diskPath);
    bytes += buffer.length;
    if (Number.isFinite(file.size) && buffer.length !== file.size) mismatches.push({ path: file.path, kind: 'size', expected: file.size, actual: buffer.length });
    if (file.sha256) {
      const digest = crypto.createHash('sha256').update(buffer).digest('hex');
      if (digest !== file.sha256) mismatches.push({ path: file.path, kind: 'sha256' });
    }
  }
  if (missing.length) issues.push({ severity: 'blocker', code: 'missing-declared-output-files', paths: missing.slice(0, 40), detail: `${missing.length} declared assembled output file(s) are absent.` });
  if (mismatches.length) issues.push({ severity: 'blocker', code: 'declared-output-integrity-mismatch', paths: mismatches.slice(0, 40), detail: `${mismatches.length} declared output size/hash check(s) failed.` });
  details.outputFormat = 'declared assembled outputs';
  const physicalFiles = files.filter((file) => !missing.includes(file.path));
  const report = finalizeLegacyReport(slug, manifest.slug || manifest.game || slug, packageDir, manifest, physicalFiles, details, issues, {
    pinnedFiles: files.length,
    missing: missing.length,
    mismatches: mismatches.length,
    summedBytes: bytes,
    manifestArtifactBytes: null,
    note: 'Legacy output manifest hashes are checked against assembled output files; source part hashes are provenance only.'
  });
  if (Array.isArray(manifest.assemblies)) {
    for (const assembly of manifest.assemblies) {
      const output = files.find((file) => file.path === assembly.outputPath);
      if (output && output.size !== assembly.size) report.issues.push({ severity: 'blocker', code: 'assembly-metadata-mismatch', path: assembly.outputPath, detail: 'Assembled file size differs from assembly metadata.' });
    }
  }
  const blockerCount = report.issues.filter((issue) => issue.severity === 'blocker').length;
  if (blockerCount) report.status = 'hold';
  return report;
}

function auditLegacySourceManifest(slug, packageDir, manifest, details) {
  const issues = [];
  const mismatches = [];
  const missing = [];
  const entryPath = manifest.entry || 'index.html';
  const entryChanged = (manifest.localChanges || []).length > 0;
  const included = manifest.files.filter((file) => file.include !== false);
  let bytes = 0;
  for (const file of included) {
    const diskPath = safePackagePath(packageDir, file.path);
    if (!diskPath || !fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) {
      missing.push(file.path);
      continue;
    }
    const buffer = fs.readFileSync(diskPath);
    bytes += buffer.length;
    // Legacy `files[].sha` is a raw-source SHA-1 pin. The source entry can be
    // intentionally rewritten to remove portal/ads and add the local bridge.
    if (file.path === entryPath && entryChanged) continue;
    if (Number.isFinite(file.size) && buffer.length !== file.size) mismatches.push({ path: file.path, kind: 'size', expected: file.size, actual: buffer.length });
    if (file.sha) {
      const digest = crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
      if (digest !== file.sha) mismatches.push({ path: file.path, kind: 'git-blob-sha1' });
    }
  }
  if (missing.length) issues.push({ severity: 'blocker', code: 'missing-legacy-included-files', paths: missing.slice(0, 40), detail: `${missing.length} legacy included source file(s) are absent.` });
  if (mismatches.length) issues.push({ severity: 'blocker', code: 'legacy-included-file-mismatch', paths: mismatches.slice(0, 40), detail: `${mismatches.length} included unchanged source size/SHA-1 check(s) failed.` });
  details.outputFormat = 'legacy source-file manifest';
  if (entryChanged) details.entryModification = 'Entry source pin retained; generated/local entry rewrite is not compared to the raw source size/hash.';
  const generated = manifest.generatedFiles || [];
  for (const file of generated) {
    const diskPath = safePackagePath(packageDir, file.path);
    if (!diskPath || !fs.existsSync(diskPath)) {
      issues.push({ severity: 'blocker', code: 'missing-legacy-generated-file', path: file.path, detail: 'Legacy manifest-declared generated file is absent.' });
      continue;
    }
    const buffer = fs.readFileSync(diskPath);
    if (Number.isFinite(file.size) && buffer.length !== file.size) issues.push({ severity: 'blocker', code: 'legacy-generated-file-size-mismatch', path: file.path, detail: 'Generated file size differs from legacy manifest metadata.' });
    if (file.sha256 && crypto.createHash('sha256').update(buffer).digest('hex') !== file.sha256) issues.push({ severity: 'blocker', code: 'legacy-generated-file-hash-mismatch', path: file.path, detail: 'Generated file hash differs from legacy manifest metadata.' });
  }
  const physicalFiles = collectPhysicalFiles(packageDir);
  return finalizeLegacyReport(slug, manifest.game || slug, packageDir, manifest, physicalFiles, details, issues, {
    pinnedFiles: included.length,
    missing: missing.length,
    mismatches: mismatches.length,
    summedBytes: bytes,
    manifestArtifactBytes: null,
    note: 'Legacy Git blob SHA-1 pins are checked only for included unchanged files; the intentionally modified entry and generated files use local-change metadata.'
  });
}

const results = packageDirs.map(([slug, packageDir]) => auditPackage(slug, packageDir));
const counts = results.reduce((acc, result) => {
  acc[result.status] = (acc[result.status] || 0) + 1;
  for (const issue of result.issues) acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  mode: 'read-only; no browser/gameplay execution',
  counts,
  results
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (results.some((result) => result.status === 'hold')) process.exitCode = 1;
