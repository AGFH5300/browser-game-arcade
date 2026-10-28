// Restore the Cocos Creator runtime bundles from their exact configured URLs.
// This writes only the package's Cocos asset tree and its recovery evidence.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_DIR = path.join(ROOT, 'public/play/archives/pixel-shooter');
const CHECKPOINT_DIR = path.join(ROOT, '.next/cache/sidequest-games/pixel-shooter/checkpoint');
const SOURCE_BASE = 'https://watchdocumentaries.com/wp-content/uploads/games/pixel-shooter/';
const MIRROR_BASE = 'https://274019683-173520394482650759.preview.editmysite.com/uploads/b/139890129-131715539788281629/files/';
const MIRROR_GITHUB_PIN = {
  repository: 'brickyosu/ugs-files-sorted',
  commit: '33ebd73c4fd042bf2f398a76c527e738bd8c4eca',
  path: 'P/clpixelshooter.html',
  gitBlobSha1: 'cc31b503c4402c8030ac7ac03c245b2984d2e52e',
};
const MAX_TRANSFER_BYTES = 40_000_000;
const MAX_PACKAGE_BYTES = 40_000_000;
const CONCURRENCY = 4;
const BUNDLE_NAMES = ['internal', 'resources', 'sub', 'main'];
const TEXTURE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.webp', '.pvr', '.pkm'];
const MIRROR_FINGERPRINT = [
  ['src/settings.5beaa.js', 591, 'e2792d59d0d6857b0c486d4c3aa9d1595a19460ffd8b25ecbc6af77c8d0308bd'],
  ['main.93472.js', 27575, '1cb593db4ba98a71b1a14201393fa6a2cfe817b6da67b72287fc4775b8c01982'],
  ['assets/main/config.99d5f.json', 28113, '25aed94527d7e84ff6832e75986d2d545ddacd0b866ed6e3b787fb34b828a284'],
  ['assets/main/index.99d5f.js', 225478, '4f674ce846b579891c333c2d2e5fcd7f26bf70b573216ce01fda23c4c2a94bd5'],
  ['assets/main/import/06/06f2dff0f.f4014.json', 37083, '133d9dc2fed6fcf4203615f6b37cbaf98e0841a000862d0cb896e5b5cb742627'],
];
const MISSING_CLIP_PATH = 'assets/main/native/63/634bb89c-5f55-4c3c-baa0-01ea910db53b.752cd.mp3';

const EXPECTED = {
  internal: {
    config: ['assets/internal/config.604e0.json', 1669, '8cf58eab9bd9fd037f8750a804d13a18af84aaca4b254cec72706face98a4df1'],
    index: ['assets/internal/index.604e0.js', 463, '91e9970eba5f76af1a8585527b6e80352978ac231908ea9e6ec3e139e8f326a5'],
  },
  resources: {
    config: ['assets/resources/config.3f07b.json', 405, 'a271e0f3cec15792a676a68a13e3b61d922035df0637465f71f89673b54d2477'],
    index: ['assets/resources/index.3f07b.js', 463, '91e9970eba5f76af1a8585527b6e80352978ac231908ea9e6ec3e139e8f326a5'],
  },
  sub: {
    config: ['assets/sub/config.6c731.json', 221, 'cf73db0521be4efb1ad30a34115b8c91c3334008cb58dabbdce3b820d9f5a0ac'],
    index: ['assets/sub/index.6c731.js', 14489, 'aa557f72a8fee3a04e1b29a781ee654e77643811fb964979cd3f1684ba3f50bf'],
  },
  main: {
    config: ['assets/main/config.99d5f.json', 28113, '25aed94527d7e84ff6832e75986d2d545ddacd0b866ed6e3b787fb34b828a284'],
    index: ['assets/main/index.99d5f.js', 225478, '4f674ce846b579891c333c2d2e5fcd7f26bf70b573216ce01fda23c4c2a94bd5'],
  },
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function decodeUuid(value) {
  // Exact Cocos Creator 2.x decode-uuid transform bundled in the local engine.
  if (value.length !== 22) return value;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let hex = value.slice(0, 2);
  for (let i = 2; i < 22; i += 2) {
    const a = alphabet.indexOf(value[i]);
    const b = alphabet.indexOf(value[i + 1]);
    if (a < 0 || b < 0) throw new Error(`Invalid Cocos compressed UUID: ${value}`);
    hex += (a >> 2).toString(16);
    hex += (((3 & a) << 2) | (b >> 4)).toString(16);
    hex += (b & 15).toString(16);
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function safePackagePath(relative) {
  if (typeof relative !== 'string' || !relative || relative.startsWith('/') ||
      relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe package path: ${relative}`);
  }
  return relative;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

let transferredBytes = 0;
const proofRecords = [];
const writeEntries = new Map();

async function fetchPinned(relative, kind, expectation = null) {
  relative = safePackagePath(relative);
  const url = new URL(relative, SOURCE_BASE).href;
  let response;
  try {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(45_000) });
  } catch (error) {
    throw new Error(`Request failed for ${url}: ${error.message}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  transferredBytes += bytes.length;
  if (transferredBytes > MAX_TRANSFER_BYTES) {
    throw new Error(`Pixel Shooter responses exceeded the ${MAX_TRANSFER_BYTES}-byte download ceiling.`);
  }
  const record = {
    kind,
    path: relative,
    url,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    contentEncoding: response.headers.get('content-encoding'),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  proofRecords.push(record);
  if (expectation) {
    const [, expectedSize, expectedSha256] = expectation;
    if (!response.ok) throw new Error(`Pinned Cocos source returned HTTP ${response.status}: ${url}`);
    if (bytes.length !== expectedSize || record.sha256 !== expectedSha256) {
      throw new Error(`Pinned Cocos source changed for ${url}: size ${bytes.length}, sha256 ${record.sha256}`);
    }
  }
  if (response.ok) {
    if (writeEntries.has(relative)) throw new Error(`Duplicate Cocos source path: ${relative}`);
    writeEntries.set(relative, { bytes, source: record });
  }
  return { ...record, bytes, ok: response.ok };
}

async function fetchMirror(relative, kind, expectation = null) {
  relative = safePackagePath(relative);
  const url = new URL(relative, MIRROR_BASE).href;
  let response;
  try {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(45_000) });
  } catch (error) {
    throw new Error(`Same-build mirror request failed for ${url}: ${error.message}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  transferredBytes += bytes.length;
  if (transferredBytes > MAX_TRANSFER_BYTES) throw new Error(`Pixel Shooter responses exceeded the ${MAX_TRANSFER_BYTES}-byte download ceiling.`);
  const record = {
    kind,
    source: 'same-build-mirror',
    path: relative,
    url,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    contentEncoding: response.headers.get('content-encoding'),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  proofRecords.push(record);
  if (expectation) {
    const [, expectedSize, expectedSha256] = expectation;
    if (!response.ok || bytes.length !== expectedSize || record.sha256 !== expectedSha256) {
      throw new Error(`The same-build mirror fingerprint did not match for ${url}.`);
    }
  }
  return { ...record, bytes, ok: response.ok };
}

function parseSettings(settingsText) {
  const versionMatch = settingsText.match(/bundleVers:\{([^}]+)\}/);
  const sceneMatch = settingsText.match(/launchScene:"([^"]+)"/);
  if (!versionMatch || !sceneMatch) throw new Error('Could not parse the local Cocos settings bundle versions.');
  const versions = Object.fromEntries([...versionMatch[1].matchAll(/([A-Za-z]+):"([a-f0-9]+)"/g)].map(match => [match[1], match[2]]));
  return { versions, launchScene: sceneMatch[1] };
}

function versionPairs(values) {
  if (!Array.isArray(values) || values.length % 2 !== 0) throw new Error('Invalid Cocos version table.');
  const pairs = [];
  for (let i = 0; i < values.length; i += 2) pairs.push([values[i], values[i + 1]]);
  return pairs;
}

function textureExtensionList(content) {
  const encoded = content.split(',')[0];
  const codes = encoded.split('_').map(token => Number.parseInt(token.split('@')[0], 10));
  if (!codes.length || codes.some(code => !Number.isInteger(code) || !TEXTURE_EXTENSIONS[code])) {
    throw new Error(`Unknown Cocos texture native format: ${encoded}`);
  }
  const extensions = [...new Set(codes.map(code => TEXTURE_EXTENSIONS[code]))];
  // This build uses a single format per native texture. Refuse to guess when
  // a platform-dependent multi-format choice would need a different URL.
  if (extensions.length !== 1) throw new Error(`Platform-dependent Cocos texture variants need explicit handling: ${encoded}`);
  return extensions;
}

function gatherStrings(value, found = []) {
  if (typeof value === 'string') found.push(value);
  else if (Array.isArray(value)) for (const item of value) gatherStrings(item, found);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) gatherStrings(item, found);
  return found;
}

const sourceManifest = JSON.parse(await readFile(path.join(PACKAGE_DIR, 'source-manifest.json'), 'utf8'));
if (sourceManifest.slug !== 'pixel-shooter' || sourceManifest.assetBaseUrl !== SOURCE_BASE) {
  throw new Error('The local package source manifest no longer identifies the reviewed Pixel Shooter source root.');
}
const settingsText = await readFile(path.join(PACKAGE_DIR, 'src/settings.5beaa.js'), 'utf8');
const settings = parseSettings(settingsText);
for (const name of BUNDLE_NAMES) {
  if (!settings.versions[name] || settings.versions[name] !== EXPECTED[name].config[0].split('.').at(-2)) {
    throw new Error(`Local Cocos bundle version changed unexpectedly for ${name}.`);
  }
}
if (settings.launchScene !== 'db://assets/loadBundle.fire') throw new Error('The local launch scene differs from the inspected Cocos build.');

// Verify the unchanged six-file upstream shell before adding the native bundles.
const baseArtifacts = sourceManifest.files.filter(file => file.path !== 'bridge.js');
let existingPackageBytes = 0;
for (const file of baseArtifacts) {
  const bytes = await readFile(path.join(PACKAGE_DIR, safePackagePath(file.path)));
  if (sha256(bytes) !== file.sha256 || bytes.length !== file.size) throw new Error(`Existing package artifact changed: ${file.path}`);
  existingPackageBytes += bytes.length;
}
const bridge = await readFile(path.join(PACKAGE_DIR, 'bridge.js'));
existingPackageBytes += bridge.length;

const parsedConfigs = new Map();
const topRequests = [];
for (const bundle of BUNDLE_NAMES) {
  const version = settings.versions[bundle];
  for (const kind of ['config', 'index']) {
    const [relative, expectedSize, expectedSha256] = EXPECTED[bundle][kind];
    const expected = [relative, expectedSize, expectedSha256];
    if (!relative.startsWith(`assets/${bundle}/`) || !relative.includes(`.${version}.`)) throw new Error(`Invalid pinned ${bundle} ${kind} path.`);
    topRequests.push({ bundle, kind, relative, expected });
  }
}
const topResponses = await mapLimit(topRequests, CONCURRENCY, request => fetchPinned(request.relative, `${request.bundle}-${request.kind}`, request.expected));
for (let i = 0; i < topRequests.length; i++) {
  const request = topRequests[i];
  const response = topResponses[i];
  if (request.kind === 'config') {
    const config = JSON.parse(response.bytes.toString('utf8'));
    parsedConfigs.set(request.bundle, config);
  }
}

const importRequests = [];
const importRequestByBundle = new Map(BUNDLE_NAMES.map(bundle => [bundle, []]));
for (const bundle of BUNDLE_NAMES) {
  const config = parsedConfigs.get(bundle);
  for (const [id, version] of versionPairs(config.versions?.import || [])) {
    let relative;
    let request = { bundle, id, version, kind: 'single' };
    if (typeof id === 'string') {
      if (!Object.hasOwn(config.packs || {}, id)) throw new Error(`Cocos import references unlisted pack ${id} in ${bundle}.`);
      relative = `assets/${bundle}/import/${id.slice(0, 2)}/${id}.${version}.json`;
      request.kind = 'pack';
    } else if (Number.isSafeInteger(id) && config.uuids[id]) {
      const uuid = decodeUuid(config.uuids[id]);
      relative = `assets/${bundle}/import/${uuid.slice(0, 2)}/${uuid}.${version}.json`;
      request.uuid = uuid;
      request.compressedUuid = config.uuids[id];
    } else {
      throw new Error(`Invalid Cocos import id in ${bundle}: ${JSON.stringify(id)}`);
    }
    request.relative = safePackagePath(relative);
    importRequests.push(request);
    importRequestByBundle.get(bundle).push(request);
  }
}

const importResponses = await mapLimit(importRequests, CONCURRENCY, request => fetchPinned(request.relative, `${request.bundle}-${request.kind}`));
const parsedImports = new Map();
for (let i = 0; i < importRequests.length; i++) {
  const request = importRequests[i];
  const response = importResponses[i];
  request.response = response;
  if (response.status === 200) {
    try {
      request.json = JSON.parse(response.bytes.toString('utf8'));
    } catch {
      throw new Error(`Cocos import response was not valid JSON: ${response.url}`);
    }
    parsedImports.set(`${request.bundle}:${String(request.id)}`, request.json);
  } else if (!(response.status === 404 && request.bundle === 'main' && request.kind === 'single')) {
    throw new Error(`Required Cocos import returned HTTP ${response.status}: ${response.url}`);
  }
}

// Build the exact UUID-to-object mapping used by config.packs and the native table.
const objectMaps = new Map();
for (const bundle of BUNDLE_NAMES) {
  const config = parsedConfigs.get(bundle);
  const map = new Map();
  for (const request of importRequestByBundle.get(bundle)) {
    if (!request.json) continue;
    if (request.kind === 'pack') {
      const indices = config.packs[request.id];
      if (!Array.isArray(indices)) throw new Error(`Invalid Cocos pack map for ${request.id}.`);
      if (Array.isArray(request.json)) {
        if (request.json.length !== indices.length) throw new Error(`Pack JSON length mismatch for ${request.id}.`);
        indices.forEach((index, position) => map.set(index, { object: request.json[position], request, position }));
      } else if (request.json.type === 'cc.Texture2D' && typeof request.json.data === 'string') {
        const textureRows = request.json.data.split('|');
        if (textureRows.length !== indices.length) throw new Error(`Packed texture metadata length mismatch for ${request.id}.`);
        indices.forEach((index, position) => map.set(index, { textureContent: textureRows[position], request, position }));
      } else {
        throw new Error(`Unknown Cocos pack response shape for ${request.id}.`);
      }
    } else {
      const configIndex = request.id;
      map.set(configIndex, { object: request.json, request, position: 0 });
    }
  }
  objectMaps.set(bundle, map);
}

// Main's 13 unavailable single imports must be provably unreferenced by every
// returned source import object before the package can be considered complete.
const omittedImports = importRequests.filter(request => request.response.status === 404);
const successfulImportStrings = [];
for (const request of importRequests) if (request.json) gatherStrings(request.json, successfulImportStrings);
for (const request of omittedImports) {
  const refs = [request.uuid, request.compressedUuid].filter(Boolean);
  const references = refs.flatMap(value => successfulImportStrings.filter(candidate => candidate === value).map(() => value));
  request.referenceCount = references.length;
  if (references.length !== 0) throw new Error(`Unavailable Cocos single import is referenced by a successful import: ${request.url}`);
}

// Resolve native filenames with the same UUID/version tables used by Cocos
// asset-manager's URL combiner. Packed Texture2D metadata is one row per pack UUID.
const nativeRequests = [];
for (const bundle of BUNDLE_NAMES) {
  const config = parsedConfigs.get(bundle);
  for (const [index, version] of versionPairs(config.versions?.native || [])) {
    const asset = objectMaps.get(bundle).get(index);
    if (!asset) throw new Error(`Cocos native asset has no import object: ${bundle} UUID index ${index}.`);
    const rawUuid = config.uuids[index];
    const uuid = decodeUuid(rawUuid);
    const textureContent = asset.textureContent ?? asset.object?.content;
    let nativeName = null;
    let extensions = [];
    if (typeof textureContent === 'string') {
      extensions = textureExtensionList(textureContent);
    } else if (typeof asset.object?._native === 'string') {
      const native = asset.object._native;
      if (native.startsWith('/')) {
        throw new Error(`Absolute Cocos native path is outside this bundle recipe: ${native}`);
      }
      if (native.startsWith('.')) extensions = [native];
      else {
        nativeName = native;
        const ext = native.match(/\.[^./]+$/)?.[0];
        if (!ext) throw new Error(`Could not determine Cocos native extension for ${uuid}: ${native}`);
        extensions = [ext];
      }
    } else {
      throw new Error(`Cocos native asset has no recognized source filename: ${bundle} ${uuid}.`);
    }
    for (const extension of extensions) {
      const nativePath = nativeName
        ? `assets/${bundle}/native/${uuid.slice(0, 2)}/${uuid}.${version}/${nativeName}`
        : `assets/${bundle}/native/${uuid.slice(0, 2)}/${uuid}.${version}${extension}`;
      nativeRequests.push({
        bundle, index, uuid, version, extension, nativeName,
        relative: safePackagePath(nativePath), sourceImport: asset.request.relative,
        sourceType: asset.object?.__type__ || (asset.textureContent ? 'cc.Texture2D' : null),
        sourceName: asset.object?._name || null,
        sourceNative: asset.object?._native || null,
      });
    }
  }
}

// Prove whether any unavailable native file belongs to a scene's dependency
// closure. Cocos scene objects can be serialized as arrays, so scan all string
// values against that bundle's exact config UUID table.
const reachableScenesByAsset = new Map();
const directEdgesByAsset = new Map();
for (const bundle of BUNDLE_NAMES) {
  const config = parsedConfigs.get(bundle);
  const uuidIndex = new Map();
  config.uuids.forEach((uuid, index) => {
    uuidIndex.set(uuid, index);
    uuidIndex.set(decodeUuid(uuid), index);
  });
  const dependencies = new Map();
  for (const [index, asset] of objectMaps.get(bundle)) {
    const objectStrings = gatherStrings(asset.object ?? asset.textureContent ?? '');
    const refs = new Set();
    for (const value of objectStrings) {
      const dependency = uuidIndex.get(value);
      if (Number.isSafeInteger(dependency) && dependency !== index) refs.add(dependency);
    }
    dependencies.set(index, [...refs]);
    for (const dependency of refs) {
      const key = `${bundle}:${dependency}`;
      const edges = directEdgesByAsset.get(key) || [];
      edges.push({ fromIndex: index, fromUuid: decodeUuid(config.uuids[index]), toIndex: dependency });
      directEdgesByAsset.set(key, edges);
    }
  }
  for (const [sceneName, rootIndex] of Object.entries(config.scenes || {})) {
    const pending = [rootIndex];
    const seen = new Set();
    while (pending.length) {
      const index = pending.pop();
      if (seen.has(index)) continue;
      seen.add(index);
      const key = `${bundle}:${index}`;
      const scenes = reachableScenesByAsset.get(key) || [];
      if (!scenes.includes(sceneName)) scenes.push(sceneName);
      reachableScenesByAsset.set(key, scenes);
      pending.push(...(dependencies.get(index) || []));
    }
  }
}

const nativeResponses = await mapLimit(nativeRequests, CONCURRENCY, request => fetchPinned(request.relative, `${request.bundle}-native`));
for (let i = 0; i < nativeRequests.length; i++) {
  nativeRequests[i].response = nativeResponses[i];
}
let alternateSourceAudit = null;
const missingPrimaryNative = nativeRequests.filter(request => request.response.status !== 200);
if (missingPrimaryNative.some(request => request.relative !== MISSING_CLIP_PATH)) {
  throw new Error(`An unreviewed native source is missing: ${missingPrimaryNative.find(request => request.relative !== MISSING_CLIP_PATH).relative}`);
}
if (missingPrimaryNative.length) {
  const fingerprint = await mapLimit(MIRROR_FINGERPRINT, CONCURRENCY,
    ([relative, bytes, digest]) => fetchMirror(relative, 'same-build-fingerprint', [relative, bytes, digest]));
  const fingerprintVerified = fingerprint.every((record, index) =>
    record.bytes.length === MIRROR_FINGERPRINT[index][1] && record.sha256 === MIRROR_FINGERPRINT[index][2]);
  if (!fingerprintVerified) throw new Error('The alternate mirror does not match the pinned Cocos build fingerprint.');
  const mirrorNative = await fetchMirror(MISSING_CLIP_PATH, 'same-build-native-fallback');
  if (mirrorNative.status === 200) {
    const hasMp3Header = mirrorNative.bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
      (mirrorNative.bytes[0] === 0xff && (mirrorNative.bytes[1] & 0xe0) === 0xe0);
    if (!hasMp3Header) throw new Error(`The same-build mirror returned non-MP3 bytes for ${MISSING_CLIP_PATH}.`);
    writeEntries.set(MISSING_CLIP_PATH, { bytes: mirrorNative.bytes, source: mirrorNative });
    const request = missingPrimaryNative[0];
    request.response = mirrorNative;
    request.usedAlternateSource = true;
  }
  alternateSourceAudit = {
    githubSource: {
      ...MIRROR_GITHUB_PIN,
      url: `https://github.com/${MIRROR_GITHUB_PIN.repository}/blob/${MIRROR_GITHUB_PIN.commit}/${MIRROR_GITHUB_PIN.path}`,
      purpose: 'Pinned HTML mirror identifies the alternate game asset host and the same Pixel Shooter Cocos entry files.',
    },
    assetRoot: MIRROR_BASE,
    fingerprint: MIRROR_FINGERPRINT.map((item, index) => ({ path: item[0], status: fingerprint[index].status, bytes: fingerprint[index].bytes.length, sha256: fingerprint[index].sha256 })),
    nativeFallback: {
      path: MISSING_CLIP_PATH,
      url: mirrorNative.url,
      status: mirrorNative.status,
      bytes: mirrorNative.bytes.length,
      sha256: mirrorNative.sha256,
      used: mirrorNative.status === 200,
    },
  };
}
const missingNative = nativeRequests.filter(request => request.response.status !== 200);
const blockers = missingNative.filter(request => (reachableScenesByAsset.get(`${request.bundle}:${request.index}`) || []).length > 0)
  .map(request => ({
    bundle: request.bundle,
    index: request.index,
    uuid: request.uuid,
    version: request.version,
    type: request.sourceType,
    name: request.sourceName,
    native: request.sourceNative,
    path: request.relative,
    url: request.response.url,
    status: request.response.status,
    responseBytes: request.response.bytes.length,
    responseSha256: request.response.sha256,
    sourceImport: request.sourceImport,
    reachableScenes: reachableScenesByAsset.get(`${request.bundle}:${request.index}`) || [],
    referencedBy: directEdgesByAsset.get(`${request.bundle}:${request.index}`) || [],
  }));

// Verify every restored JSON document, source digest, and the package byte cap
// before writing any of the additions to the existing game directory.
let restoredBytes = existingPackageBytes;
for (const [relative, entry] of writeEntries) {
  restoredBytes += entry.bytes.length;
  if (relative.endsWith('.json')) JSON.parse(entry.bytes.toString('utf8'));
}
if (restoredBytes > MAX_PACKAGE_BYTES) throw new Error(`Prepared Pixel Shooter package exceeds ${MAX_PACKAGE_BYTES} bytes.`);

const files = [...writeEntries.entries()].map(([relative, entry]) => ({
  path: relative,
  kind: entry.source.kind,
  url: entry.source.url,
  status: entry.source.status,
  contentType: entry.source.contentType,
  contentEncoding: entry.source.contentEncoding,
  bytes: entry.bytes.length,
  sha256: sha256(entry.bytes),
}));
const omittedImportProof = omittedImports.map(request => ({
  bundle: request.bundle,
  path: request.relative,
  url: request.response.url,
  status: request.response.status,
  responseBytes: request.response.bytes,
  responseSha256: request.response.sha256,
  uuid: request.uuid,
  compressedUuid: request.compressedUuid,
  referencesInSuccessfulImports: request.referenceCount,
}));
const httpProof = {
  schemaVersion: 1,
  package: 'pixel-shooter',
  sourceBase: SOURCE_BASE,
  sourceAuthorization: sourceManifest.authorization,
  limits: { maxResponseBytes: MAX_TRANSFER_BYTES, transferredBytes, maxPackageBytes: MAX_PACKAGE_BYTES, preparedPackageBytes: restoredBytes },
  alternateSourceAudit,
  records: proofRecords,
};
const manifest = {
  schemaVersion: 1,
  package: 'pixel-shooter',
  checkpointOnly: true,
  publicArchiveWritten: false,
  sourceBase: SOURCE_BASE,
  complete: missingNative.length === 0 && omittedImports.length === 0,
  launchable: blockers.length === 0,
  blockers,
  entry: 'index.html',
  launchScene: settings.launchScene,
  bundleVersions: settings.versions,
  runtime: {
    engine: 'Cocos Creator 2.x asset-manager',
    engineFile: 'cocos2d-js-min.55149.js',
    configPattern: 'assets/{bundle}/config.{bundleVersion}.json',
    indexPattern: 'assets/{bundle}/index.{bundleVersion}.js',
    importPattern: 'assets/{bundle}/import/{uuidPrefix}/{uuid}.{importVersion}.json',
    nativePattern: 'assets/{bundle}/native/{uuidPrefix}/{uuid}.{nativeVersion}{extension}',
  },
  bundleSummary: BUNDLE_NAMES.map(bundle => ({
    bundle,
    config: EXPECTED[bundle].config[0],
    index: EXPECTED[bundle].index[0],
    uuidCount: parsedConfigs.get(bundle).uuids.length,
    packCount: Object.keys(parsedConfigs.get(bundle).packs || {}).length,
    importCount: importRequestByBundle.get(bundle).length,
    nativeCount: versionPairs(parsedConfigs.get(bundle).versions?.native || []).length,
    scenes: parsedConfigs.get(bundle).scenes || {},
  })),
  omittedImports: omittedImportProof,
  missingNative: missingNative.map(request => ({
    bundle: request.bundle,
    index: request.index,
    uuid: request.uuid,
    version: request.version,
    path: request.relative,
    primarySourceUrl: request.response.url,
    primarySourceStatus: missingPrimaryNative.find(x => x.relative === request.relative)?.response.status || request.response.status,
    reachableScenes: reachableScenesByAsset.get(`${request.bundle}:${request.index}`) || [],
  })),
  alternateSourceAudit,
  files,
  httpProofFile: 'cocos-http-source-proof.json',
  remoteFileCount: files.length,
  remoteFileBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  gameplayQa: 'Not performed; no browser gameplay or manual QA was run.',
};
const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
const proofBytes = Buffer.from(`${JSON.stringify(httpProof, null, 2)}\n`);

for (const [relative, entry] of writeEntries) {
  const destination = path.join(CHECKPOINT_DIR, safePackagePath(relative));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, entry.bytes);
}
await writeFile(path.join(CHECKPOINT_DIR, 'cocos-asset-manifest.json'), manifestBytes);
await writeFile(path.join(CHECKPOINT_DIR, 'cocos-http-source-proof.json'), proofBytes);

// Read-after-write verification ensures the package contains the recorded bytes.
for (const file of files) {
  const bytes = await readFile(path.join(CHECKPOINT_DIR, safePackagePath(file.path)));
  if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Written Cocos package file did not verify: ${file.path}`);
}
const finalManifest = JSON.parse(await readFile(path.join(CHECKPOINT_DIR, 'cocos-asset-manifest.json'), 'utf8'));
const finalProof = JSON.parse(await readFile(path.join(CHECKPOINT_DIR, 'cocos-http-source-proof.json'), 'utf8'));
if (finalManifest.files.length !== files.length || finalProof.records.length !== proofRecords.length) throw new Error('Cocos package recovery evidence did not verify.');

if (finalManifest.blockers.length) {
  const cachePath = path.join(ROOT, '.next/cache/sidequest-games/pixel-shooter/pixel-shooter-recovery-blocker.json');
  const blockerReport = {
    schemaVersion: 1,
    package: 'pixel-shooter',
    complete: false,
    checkpoint: path.relative(ROOT, CHECKPOINT_DIR),
    sourceBase: SOURCE_BASE,
    launchScene: settings.launchScene,
    reason: 'A Cocos native asset referenced by a scene is missing at its exact runtime URL in both reviewed sources.',
    limits: { maxTransferBytes: MAX_TRANSFER_BYTES, transferredBytes },
    blockers: finalManifest.blockers,
    alternateSourceAudit,
  };
  await writeFile(cachePath, `${JSON.stringify(blockerReport, null, 2)}\n`);
  const first = finalManifest.blockers[0];
  throw new Error(`Cocos asset checkpoint prepared, but launch remains blocked: ${first.type} ${first.name} is referenced by ${first.reachableScenes.join(', ')} and is HTTP ${first.status} at ${first.url}. Checkpoint: ${path.relative(ROOT, CHECKPOINT_DIR)}`);
}

console.log(JSON.stringify({
  checkpoint: path.relative(ROOT, CHECKPOINT_DIR),
  bundles: BUNDLE_NAMES.length,
  importedFiles: importRequests.filter(request => request.response.status === 200).length,
  omittedUnreferencedSingles: omittedImports.length,
  nativeFiles: nativeRequests.length,
  transferredBytes,
  packageBytes: restoredBytes,
  proofRecords: proofRecords.length,
  complete: finalManifest.complete,
  launchable: finalManifest.launchable,
  blockers: finalManifest.blockers.map(blocker => ({ name: blocker.name, path: blocker.path, status: blocker.status })),
}, null, 2));
