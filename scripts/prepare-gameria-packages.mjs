// Verify previously pinned Flipline standard-game ZIPs and package the
// original SWFs behind the existing local Ruffle 0.7.1 runtime.
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_MANIFEST_PATH = path.join(ROOT, 'scripts/gameria-package-sources.json');
const CACHE_ROOT = path.join(ROOT, '.next/cache/sidequest-games/gameria');
const ARCHIVE_CACHE = path.join(CACHE_ROOT, 'incoming');
const OUTPUT_ROOT = path.join(ROOT, 'public/play/archives');
const COVER_ROOT = path.join(ROOT, 'public/covers/gamerias');
const RUFFLE_RELATIVE_PATH = '../ruffle/ruffle.js';
const MAX_ARCHIVE_BYTES = 40_000_000;
const MAX_EXTRACTED_GAME_BYTES = 40_000_000;
const MAX_BATCH_ARCHIVE_BYTES = 120_000_000;
const MAX_BATCH_OUTPUT_BYTES = 120_000_000;

const BATCHES = {
  1: ['papas-burgeria', 'papas-taco-mia', 'papas-pancakeria', 'papas-wingeria'],
  2: ['papas-hot-doggeria', 'papas-cupcakeria', 'papas-pastaria', 'papas-donuteria'],
  3: ['papas-cheeseria', 'papas-bakeria', 'papas-sushiria', 'papas-scooperia'],
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.includes('\\') ||
      value.startsWith('/') || /^[a-z]:/i.test(value) ||
      value.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe package file path: ${JSON.stringify(value)}`);
  }
  return value;
}

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

function readZipEntries(zipBytes) {
  if (zipBytes.length < 22 || zipBytes[0] !== 0x50 || zipBytes[1] !== 0x4b) {
    throw new Error('Official download is not a ZIP archive.');
  }

  const firstEocd = Math.max(0, zipBytes.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = zipBytes.length - 22; i >= firstEocd; i--) {
    if (zipBytes.readUInt32LE(i) === 0x06054b50) {
      const commentLength = zipBytes.readUInt16LE(i + 20);
      if (i + 22 + commentLength === zipBytes.length) { eocd = i; break; }
    }
  }
  if (eocd < 0) throw new Error('ZIP end-of-central-directory record is missing.');

  const diskNumber = zipBytes.readUInt16LE(eocd + 4);
  const centralDisk = zipBytes.readUInt16LE(eocd + 6);
  const entriesOnDisk = zipBytes.readUInt16LE(eocd + 8);
  const entryCount = zipBytes.readUInt16LE(eocd + 10);
  const centralSize = zipBytes.readUInt32LE(eocd + 12);
  const centralOffset = zipBytes.readUInt32LE(eocd + 16);
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount ||
      entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new Error('Multi-volume and ZIP64 source archives are not supported.');
  }
  if (centralOffset + centralSize > eocd) throw new Error('ZIP central directory is out of bounds.');

  const files = [];
  let cursor = centralOffset;
  let totalBytes = 0;
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > zipBytes.length || zipBytes.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`Invalid ZIP central directory entry ${index}.`);
    }
    const flags = zipBytes.readUInt16LE(cursor + 8);
    const method = zipBytes.readUInt16LE(cursor + 10);
    const expectedCrc = zipBytes.readUInt32LE(cursor + 16).toString(16).padStart(8, '0');
    const compressedSize = zipBytes.readUInt32LE(cursor + 20);
    const uncompressedSize = zipBytes.readUInt32LE(cursor + 24);
    const nameLength = zipBytes.readUInt16LE(cursor + 28);
    const extraLength = zipBytes.readUInt16LE(cursor + 30);
    const commentLength = zipBytes.readUInt16LE(cursor + 32);
    const diskStart = zipBytes.readUInt16LE(cursor + 34);
    const localOffset = zipBytes.readUInt32LE(cursor + 42);
    if ([compressedSize, uncompressedSize, localOffset].includes(0xffffffff) || diskStart !== 0) {
      throw new Error('ZIP64 entries and split-disk source files are not supported.');
    }
    if ((flags & 1) !== 0) throw new Error('Encrypted ZIP entries are not accepted.');
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    const next = nameEnd + extraLength + commentLength;
    if (next > zipBytes.length) throw new Error('ZIP directory entry is truncated.');
    const sourcePath = zipBytes.subarray(nameStart, nameEnd).toString('utf8');
    cursor = next;
    if (sourcePath.endsWith('/')) continue;
    const relativePath = safeRelativePath(sourcePath);
    if (uncompressedSize > MAX_EXTRACTED_GAME_BYTES) {
      throw new Error(`Archive entry exceeds the ${MAX_EXTRACTED_GAME_BYTES}-byte limit: ${relativePath}`);
    }
    totalBytes += uncompressedSize;
    if (totalBytes > MAX_EXTRACTED_GAME_BYTES) {
      throw new Error(`Uncompressed game package exceeds ${MAX_EXTRACTED_GAME_BYTES} bytes.`);
    }
    if (localOffset + 30 > zipBytes.length || zipBytes.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local file header: ${relativePath}`);
    }
    const localNameLength = zipBytes.readUInt16LE(localOffset + 26);
    const localExtraLength = zipBytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > zipBytes.length) throw new Error(`Truncated ZIP content: ${relativePath}`);
    const compressed = zipBytes.subarray(dataStart, dataEnd);
    let bytes;
    if (method === 0) bytes = Buffer.from(compressed);
    else if (method === 8) bytes = inflateRawSync(compressed, { maxOutputLength: MAX_EXTRACTED_GAME_BYTES });
    else throw new Error(`Unsupported ZIP compression method ${method}: ${relativePath}`);
    if (bytes.length !== uncompressedSize || crc32(bytes) !== expectedCrc) {
      throw new Error(`ZIP size/CRC verification failed: ${relativePath}`);
    }
    files.push({
      path: relativePath,
      bytes,
      sourceSize: bytes.length,
      sourceSha256: sha256(bytes),
      crc32: expectedCrc,
      compressionMethod: method,
    });
  }
  if (cursor !== centralOffset + centralSize) throw new Error('ZIP central-directory length does not match the end record.');
  if (!files.length) throw new Error('Official ZIP contains no files.');
  return { files, totalBytes };
}

async function getArchiveBytes(game) {
  const cachePath = path.join(ARCHIVE_CACHE, `${game.slug}.zip`);
  await mkdir(path.dirname(cachePath), { recursive: true });
  let bytes;
  try { bytes = await readFile(cachePath); } catch {}

  const existingPin = game.packagePin?.archive;
  if (!existingPin || !existingPin.sha256 || !Number.isInteger(existingPin.bytes)) {
    throw new Error(`Official ZIP has no immutable archive pin; refusing to learn a pin during build: ${game.slug}`);
  }
  if (bytes && existingPin && (bytes.length !== existingPin.bytes || sha256(bytes) !== existingPin.sha256)) {
    throw new Error(`Cached official ZIP does not match its pin: ${game.slug}`);
  }
  if (!bytes) {
    const response = await fetch(game.officialPackageUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Official ZIP returned HTTP ${response.status}: ${game.officialPackageUrl}`);
    if (new URL(response.url).hostname !== 'i.flipline.com' || response.url !== existingPin.finalUrl) {
      throw new Error(`Official package redirect differs from its saved source URL: ${response.url}`);
    }
    if (response.status !== existingPin.status || response.headers.get('content-type') !== existingPin.contentType) {
      throw new Error(`Official package response metadata changed from its saved pin: ${game.slug}`);
    }
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (existingPin.contentLength && contentLength !== existingPin.contentLength) {
      throw new Error(`Official package Content-Length changed from its saved pin: ${game.slug}`);
    }
    if (contentLength > MAX_ARCHIVE_BYTES) throw new Error(`ZIP exceeds the ${MAX_ARCHIVE_BYTES}-byte limit: ${game.slug}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_ARCHIVE_BYTES) throw new Error(`Invalid ZIP size: ${game.slug} ${bytes.length}`);
    if (contentLength && contentLength !== bytes.length) throw new Error(`ZIP Content-Length mismatch: ${game.slug}`);
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(`Official response was not a ZIP: ${game.slug}`);
    if (bytes.length !== existingPin.bytes || sha256(bytes) !== existingPin.sha256) {
      throw new Error(`Live official ZIP changed from its saved pin: ${game.slug}`);
    }
    await writeFile(cachePath, bytes);
  }

  const archivePin = game.packagePin.archive;
  if (bytes.length !== archivePin.bytes || sha256(bytes) !== archivePin.sha256) {
    throw new Error(`Official ZIP does not match its recorded pin: ${game.slug}`);
  }
  return { bytes, archivePin, cachePath };
}

function makeIndexHtml(title) {
  const safeTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">
  <title>${safeTitle}</title>
  <style>
    html, body, #game { box-sizing: border-box; width: 100%; height: 100%; margin: 0; overflow: hidden; background: #05070d; }
    #game { display: grid; place-items: center; }
    ruffle-player { display: block; width: 100%; height: 100%; }
    #status { position: fixed; inset: auto 12px 12px; color: #ddd; font: 14px system-ui, sans-serif; pointer-events: none; }
  </style>
  <script src="arcade-bridge.js"></script>
  <script src="player.js"></script>
  <script src="${RUFFLE_RELATIVE_PATH}"></script>
  <script defer src="wrapper.js"></script>
</head>
<body>
  <main id="game" aria-label="${safeTitle}"></main>
  <p id="status" role="status" hidden></p>
</body>
</html>
`;
}

function makeWrapperJs(title, swfPath) {
  return `(() => {
  let player = null;
  let muted = false;
  const host = document.getElementById('game');
  const status = document.getElementById('status');
  function applyAudio() { if (player) player.volume = muted ? 0 : 1; }
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (event.source !== parent || !data || data.type !== 'sidequest:audio-set' || typeof data.muted !== 'boolean') return;
    muted = data.muted; applyAudio();
    parent.postMessage({ type: 'sidequest:audio-state', muted, supported: true }, '*');
  });
  try {
    const api = window.RufflePlayer && window.RufflePlayer.newest();
    if (!api) throw new Error('The local Ruffle runtime did not initialize.');
    player = api.createPlayer();
    player.setAttribute('aria-label', ${JSON.stringify(title)});
    host.appendChild(player);
    applyAudio();
    player.ruffle().load(${JSON.stringify(swfPath)}).catch((error) => {
      status.hidden = false; status.textContent = 'The Flash game could not load in the local player.';
      console.error('Ruffle load failed:', error);
      parent.postMessage({ type: 'sidequest:error' }, '*');
    });
    parent.postMessage({ type: 'sidequest:audio-ready' }, '*');
  } catch (error) {
    status.hidden = false; status.textContent = 'The local Flash player could not start.';
    console.error(error);
    parent.postMessage({ type: 'sidequest:error' }, '*');
  }
})();
`;
}

function makePlayerJs() {
  return `window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = { autoplay: "off", allowScriptAccess: false, openUrlMode: "deny", allowNetworking: "none", showSwfDownload: false, polyfills: false };
`;
}

async function pathExists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function prepareOne(game, sidecar) {
  const { bytes: zipBytes, archivePin } = await getArchiveBytes(game);
  const { files: extracted, totalBytes } = readZipEntries(zipBytes);
  const pinnedFiles = extracted.map(file => ({
    path: file.path,
    bytes: file.sourceSize,
    sha256: file.sourceSha256,
    crc32: file.crc32,
    compressionMethod: file.compressionMethod,
  }));

  if (!Array.isArray(game.packagePin?.files) || game.packagePin.files.length !== pinnedFiles.length) {
    throw new Error(`Official ZIP has no complete entry pins; refusing to learn pins during build: ${game.slug}`);
  }
  const actual = new Map(pinnedFiles.map(file => [file.path, file]));
  for (const pin of game.packagePin.files) {
    const file = actual.get(pin.path);
    if (!file || file.bytes !== pin.bytes || file.sha256 !== pin.sha256 || file.crc32 !== pin.crc32) {
      throw new Error(`Source ZIP entry differs from its pin for ${game.slug}: ${pin.path}`);
    }
  }

  const swfs = extracted.filter(file => file.path.toLowerCase().endsWith('.swf'));
  const infoFiles = extracted.filter(file => path.posix.basename(file.path).toLowerCase() === 'gameinfo.txt');
  const coverCandidates = [
    /400x226[^/]*\.(?:jpe?g|png)$/i,
    /278x188[^/]*\.(?:jpe?g|png)$/i,
    /300x300[^/]*\.(?:jpe?g|png)$/i,
    /100x100[^/]*\.(?:jpe?g|png)$/i,
  ];
  let cover = null;
  for (const pattern of coverCandidates) {
    const matches = extracted.filter(file => pattern.test(file.path));
    if (matches.length > 1) throw new Error(`Official source ZIP has ambiguous cover candidates for ${game.slug}: ${pattern}`);
    if (matches.length === 1) { cover = matches[0]; break; }
  }
  if (swfs.length !== 1 || infoFiles.length !== 1 || !cover) {
    throw new Error(`${game.slug} source ZIP needs one SWF, one gameinfo.txt and one recognized official cover; got ${swfs.length}/${infoFiles.length}/${cover ? 1 : 0}.`);
  }
  const swf = swfs[0];
  const gameInfo = infoFiles[0];
  if (swf.sourceSize < 1024 || swf.bytes.subarray(0, 3).toString('ascii') !== 'FWS' &&
      swf.bytes.subarray(0, 3).toString('ascii') !== 'CWS' && swf.bytes.subarray(0, 3).toString('ascii') !== 'ZWS') {
    throw new Error(`Source is not a recognized SWF file: ${game.slug}/${swf.path}`);
  }
  const gameInfoText = gameInfo.bytes.toString('latin1');
  if (!/^Developer:\s*Flipline Studios\s*$/mi.test(gameInfoText)) {
    throw new Error(`Official gameinfo.txt does not credit Flipline Studios: ${game.slug}`);
  }
  if (!new RegExp(`^Version:\\s*${game.version.replaceAll('.', '\\.')}\\s*$`, 'mi').test(gameInfoText)) {
    throw new Error(`Official gameinfo.txt version differs from the observed listing for ${game.slug}`);
  }

  const sourceFiles = [...extracted].sort((a, b) => a.path.localeCompare(b.path));
  const savedPin = game.packagePin;
  if (!savedPin.swf || savedPin.swf.path !== swf.path || savedPin.swf.bytes !== swf.sourceSize || savedPin.swf.sha256 !== swf.sourceSha256 ||
      !savedPin.authorNotice || savedPin.authorNotice.path !== gameInfo.path || savedPin.authorNotice.bytes !== gameInfo.sourceSize || savedPin.authorNotice.sha256 !== gameInfo.sourceSha256 ||
      !savedPin.cover || savedPin.cover.path !== cover.path || savedPin.cover.bytes !== cover.sourceSize || savedPin.cover.sha256 !== cover.sourceSha256) {
    throw new Error(`Source SWF, notice, or cover pin does not match the archive pin: ${game.slug}`);
  }

  const dest = path.join(OUTPUT_ROOT, game.slug);
  const coverExtension = path.extname(cover.path).toLowerCase() || '.jpg';
  const coverDest = path.join(COVER_ROOT, `${game.slug}${coverExtension}`);
  const staging = path.join(CACHE_ROOT, 'staging', game.slug);
  const existingManifestPath = path.join(dest, 'source-manifest.json');
  const priorCoverExists = await pathExists(coverDest);
  if (priorCoverExists) {
    const priorCover = await readFile(coverDest);
    if (sha256(priorCover) !== cover.sourceSha256) throw new Error(`A different cover already exists at ${coverDest}`);
  }
  if (await pathExists(dest)) {
    if (!(await pathExists(existingManifestPath))) throw new Error(`Refusing to replace an unrecognized output directory: ${dest}`);
    const prior = JSON.parse(await readFile(existingManifestPath, 'utf8'));
    if (prior.source?.archiveSha256 !== archivePin.sha256) throw new Error(`Existing output was built from a different source ZIP: ${game.slug}`);
  }
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  let outputBytes = 0;
  const outputFiles = [];
  for (const file of sourceFiles) {
    const relative = safeRelativePath(file.path);
    if (path.posix.basename(relative).toLowerCase() === 'thumbs.db') continue;
    const outputRelative = `upstream/${relative}`;
    const target = path.join(staging, outputRelative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
    outputBytes += file.bytes.length;
    outputFiles.push({ path: outputRelative, sourcePath: file.path, bytes: file.bytes.length, sha256: file.sourceSha256, origin: 'official-flipline-zip' });
  }

  const runtimeInputs = [
    ['arcade-bridge.js', path.join(ROOT, 'public/play/arcade-bridge.js')],
  ];
  for (const [name, sourcePath] of runtimeInputs) {
    const bytes = await readFile(sourcePath);
    await writeFile(path.join(staging, name), bytes);
    outputBytes += bytes.length;
    outputFiles.push({ path: name, bytes: bytes.length, sha256: sha256(bytes), origin: 'existing-local-sidequest-bridge' });
  }

  const indexBytes = Buffer.from(makeIndexHtml(game.title));
  const playerBytes = Buffer.from(makePlayerJs());
  const swfOutputPath = `upstream/${safeRelativePath(swf.path)}`;
  const wrapperBytes = Buffer.from(makeWrapperJs(game.title, swfOutputPath));
  for (const [name, data] of [['index.html', indexBytes], ['player.js', playerBytes], ['wrapper.js', wrapperBytes]]) {
    await writeFile(path.join(staging, name), data);
    outputBytes += data.length;
    outputFiles.push({ path: name, bytes: data.length, sha256: sha256(data), origin: 'generated-local-ruffle-wrapper' });
  }
  if (outputBytes > MAX_EXTRACTED_GAME_BYTES) throw new Error(`Prepared package exceeds the output size limit: ${game.slug}`);

  const sourceManifest = {
    schemaVersion: 1,
    slug: game.slug,
    id: game.id,
    title: game.title,
    source: {
      owner: 'Flipline Studios / Flipline IDS LLC',
      officialGameUrl: game.officialGameUrl,
      officialListingUrl: sidecar.sourceListingUrl,
      officialPackageUrl: game.officialPackageUrl,
      archiveSha256: archivePin.sha256,
      archiveBytes: archivePin.bytes,
      version: game.version,
      distribution: sidecar.observedDistributionStatement,
      swfOriginalPath: swf.path,
      swfOutputPath: swfOutputPath,
      swfBytes: swf.sourceSize,
      swfSha256: swf.sourceSha256,
      noticePath: `upstream/${gameInfo.path}`,
      noticeSha256: gameInfo.sourceSha256,
      coverSourcePath: cover.path,
      coverOutputPath: `/covers/gamerias/${game.slug}${coverExtension}`,
      coverBytes: cover.sourceSize,
      coverSha256: cover.sourceSha256,
    },
    rights: {
      basis: sidecar.authorizationBasis,
      upstreamLicense: 'No open-source license asserted. Preserve official Flipline source files and game notices.',
      sourceNotices: [`upstream/${gameInfo.path}`],
      ownerAuthorization: 'Owner content-use authorization is recorded in the project source registry; the official standard web package is separately offered for site hosting by Flipline.',
    },
    runtime: {
      engine: 'Adobe Flash SWF',
      player: '@ruffle-rs/ruffle',
      playerVersion: '0.7.1',
      playerPath: RUFFLE_RELATIVE_PATH,
      playerLicensePaths: ['../ruffle/LICENSE_MIT', '../ruffle/LICENSE_APACHE'],
      playerSettings: { autoplay: 'off', allowScriptAccess: false, openUrlMode: 'deny', allowNetworking: 'none' },
      localAudioBridge: 'wrapper.js controls Ruffle player volume and arcade-bridge.js handles the standard Sidequest audio messages.',
      gameplayQa: 'Not performed; user handles manual gameplay QA.',
    },
    sourceArchiveFiles: sourceFiles.map(file => ({ path: file.path, bytes: file.sourceSize, sha256: file.sourceSha256, crc32: file.crc32 })),
    sourceFilesOmittedFromRuntime: sourceFiles.filter(file => path.posix.basename(file.path).toLowerCase() === 'thumbs.db')
      .map(file => ({ path: file.path, bytes: file.sourceSize, sha256: file.sourceSha256, reason: 'Windows thumbnail cache; pin retained in the ZIP inventory, excluded from served files.' })),
    outputFiles,
    packageBytes: outputBytes,
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(sourceManifest, null, 2)}\n`);
  await writeFile(path.join(staging, 'source-manifest.json'), manifestBytes);
  outputBytes += manifestBytes.length;

  await mkdir(path.dirname(dest), { recursive: true });
  const backup = `${dest}.gameria-old`;
  if (await pathExists(dest)) {
    await rm(backup, { recursive: true, force: true });
    await rename(dest, backup);
  }
  try {
    await rename(staging, dest);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await pathExists(backup)) await rename(backup, dest);
    throw error;
  }

  await mkdir(COVER_ROOT, { recursive: true });
  if (priorCoverExists) {
    // The authentic cover already exists and matched its source pin above.
  } else {
    await writeFile(coverDest, cover.bytes);
  }

  // Verify every copied byte and generated cover after the atomic directory swap.
  for (const output of sourceManifest.outputFiles) {
    const data = await readFile(path.join(dest, output.path));
    if (data.length !== output.bytes || sha256(data) !== output.sha256) {
      throw new Error(`Output integrity check failed for ${game.slug}/${output.path}`);
    }
  }
  const coverBytes = await readFile(coverDest);
  if (coverBytes.length !== cover.sourceSize || sha256(coverBytes) !== cover.sourceSha256) {
    throw new Error(`Authentic cover integrity check failed for ${game.slug}`);
  }

  return {
    slug: game.slug,
    title: game.title,
    archiveBytes: archivePin.bytes,
    archiveSha256: archivePin.sha256,
    swfPath: swfOutputPath,
    swfBytes: swf.sourceSize,
    swfSha256: swf.sourceSha256,
    sourceEntryCount: sourceFiles.length,
    sourceEntryBytes: totalBytes,
    outputBytes,
    cover: `/covers/gamerias/${game.slug}${coverExtension}`,
    coverBytes: cover.sourceSize,
    coverSha256: cover.sourceSha256,
    output: path.relative(ROOT, dest),
  };
}

const args = process.argv.slice(2);
const batchArg = args.find(arg => arg.startsWith('--batch='));
const slugsArg = args.find(arg => arg.startsWith('--slugs='));
if (batchArg && slugsArg) throw new Error('Choose only one selector: --batch=1|2|3 or --slugs=slug,slug.');

const sidecar = JSON.parse(await readFile(SOURCE_MANIFEST_PATH, 'utf8'));
if (sidecar.sourceListingUrl !== 'https://www.flipline.com/freegames.html' ||
    !sidecar.observedDistributionStatement.includes('upload any of the games below to your site')) {
  throw new Error('Official Flipline distribution provenance changed or is missing.');
}
let batches;
if (batchArg) {
  const batchNumber = Number(batchArg.slice('--batch='.length));
  if (!BATCHES[batchNumber]) throw new Error('Batch must be 1, 2, or 3.');
  batches = [[String(batchNumber), BATCHES[batchNumber]]];
} else if (slugsArg) {
  const slugs = slugsArg.slice('--slugs='.length).split(',').map(value => value.trim()).filter(Boolean);
  if (!slugs.length || slugs.length > 4 || new Set(slugs).size !== slugs.length) {
    throw new Error('Choose one to four distinct package slugs.');
  }
  batches = [['selected', slugs]];
} else {
  batches = Object.entries(BATCHES).sort(([left], [right]) => left.localeCompare(right));
}

const allResults = [];
let allArchiveBytes = 0;
let allOutputBytes = 0;
for (const [batchName, selectedSlugs] of batches) {
  const selected = selectedSlugs.map(slug => {
    const game = sidecar.games.find(entry => entry.slug === slug && entry.sourceAction === 'build-local-ruffle-package');
    if (!game) throw new Error(`Slug is not an authorized new local Gameria package: ${slug}`);
    if (!game.packagePin?.archive?.sha256 || !game.packagePin?.files?.length) {
      throw new Error(`Package has no complete immutable source pins: ${slug}`);
    }
    return game;
  });

  let batchArchiveBytes = 0;
  for (const game of selected) {
    const { bytes } = await getArchiveBytes(game);
    batchArchiveBytes += bytes.length;
    if (batchArchiveBytes > MAX_BATCH_ARCHIVE_BYTES) throw new Error(`Batch archive total exceeds ${MAX_BATCH_ARCHIVE_BYTES} bytes.`);
  }

  let batchOutputBytes = 0;
  const results = [];
  for (const game of selected) {
    const result = await prepareOne(game, sidecar);
    batchOutputBytes += result.outputBytes;
    if (batchOutputBytes > MAX_BATCH_OUTPUT_BYTES) throw new Error(`Batch package total exceeds ${MAX_BATCH_OUTPUT_BYTES} bytes.`);
    results.push(result);
  }
  allArchiveBytes += batchArchiveBytes;
  allOutputBytes += batchOutputBytes;
  allResults.push(...results);
  console.log(JSON.stringify({ batch: batchName, packageCount: results.length, archiveBytes: batchArchiveBytes, outputBytes: batchOutputBytes }, null, 2));
}

console.log(JSON.stringify({
  batch: batches.length === 3 ? 'all-three-bounded-batches' : batches[0][0],
  packageCount: allResults.length,
  archiveBytes: allArchiveBytes,
  outputBytes: allOutputBytes,
  packages: allResults,
  sourceManifest: path.relative(ROOT, SOURCE_MANIFEST_PATH),
  publicArchiveRoot: path.relative(ROOT, OUTPUT_ROOT),
  coverRoot: path.relative(ROOT, COVER_ROOT),
  gameplayQa: 'Not performed; static ZIP/entry/CRC/SHA verification only.',
}, null, 2));
