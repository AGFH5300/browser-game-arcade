#!/usr/bin/env node

// Controlled, reversible-at-source preparation for Geometry Dash Hyper Wave.
// By default this performs only static checks and deterministic VM callback
// checks. Pass --apply to replace the one reviewed YaGames extension file.
// The GameMaker runtime, game code, atlases, package manifest, and domains are
// never modified by this script.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const packageDir = path.join(repoRoot, 'public', 'play', 'archives', 'geometry-dash-hyper-wave');
const manifestPath = path.join(packageDir, 'source-manifest.json');
const extensionPath = path.join(packageDir, 'html5game', 'vph_YaGames.js');
const gamePath = path.join(packageDir, 'html5game', 'gd_arrow_neon.js');
const manifestExtensionPath = 'html5game/vph_YaGames.js';
const apply = process.argv.includes('--apply');

const guestAdapter = String.raw`// Sidequest guest/offline compatibility adapter for Geometry Dash Hyper Wave.
// This adapter replaces only the Yandex Games extension. It does not load or
// impersonate a publisher SDK, create an account, show ads, or grant rewards.
(function installSidequestGuestMode(root) {
  "use strict";

  let requestId = 0;
  const guestStatus = Object.freeze({
    mode: "guest/offline",
    bootReady: true,
    available: false,
    publisherSdkAvailable: false,
    playerAccountAvailable: false,
    leaderboardsAvailable: false,
    adsAvailable: false,
    rewardsAvailable: false
  });
  root.SidequestGuestMode = guestStatus;

  function nextRequestId() {
    return ++requestId;
  }

  function send(payload) {
    const api = root.GMS_API;
    if (api && typeof api.send_async_event_social === "function") {
      api.send_async_event_social(payload);
    } else if (root.console && typeof root.console.warn === "function") {
      root.console.warn("[Sidequest guest mode] GameMaker async event API is unavailable.");
    }
  }

  function sendData(id, event, data) {
    send({ type: "YaGames", request_id: id, event, data: JSON.stringify(data) });
  }

  function sendUnsupported(id, event, feature) {
    send({
      type: "YaGames",
      request_id: id,
      event,
      code: "SIDEQUEST_OFFLINE_UNAVAILABLE",
      name: "UnsupportedFeature",
      message: feature + " is unavailable in guest/offline mode. No account or reward was created."
    });
  }

  function unsupported(event, feature) {
    const id = nextRequestId();
    root.setTimeout(function reportUnsupportedFeature() {
      sendUnsupported(id, event, feature);
    }, 0);
    return id;
  }

  function showGuestNotice() {
    const doc = root.document;
    if (!doc || !doc.body || typeof doc.createElement !== "function") return;
    if (doc.getElementById && doc.getElementById("sidequest-guest-mode")) return;
    const notice = doc.createElement("div");
    notice.id = "sidequest-guest-mode";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.textContent = "Guest mode: accounts, leaderboards, and ads are unavailable.";
    notice.style.cssText = "position:fixed;right:8px;top:8px;z-index:2147483647;max-width:calc(100vw - 24px);padding:6px 9px;border:1px solid #777;border-radius:4px;background:rgba(16,20,27,.88);color:#fff;font:12px/1.3 system-ui,sans-serif;pointer-events:none";
    doc.body.appendChild(notice);
  }

  if (root.document && root.document.readyState === "loading" && root.document.addEventListener) {
    root.document.addEventListener("DOMContentLoaded", showGuestNotice, { once: true });
  } else {
    showGuestNotice();
  }

  root.YaGamesGMS_getInitStatus = function YaGamesGMS_getInitStatus() {
    // 1 means this local adapter is ready for game boot; publisher/account
    // availability is explicitly false in SidequestGuestMode.
    return 1;
  };

  root.YaGamesGMS_GameReadyOn = function YaGamesGMS_GameReadyOn() {
    // Local-only readiness: deliberately send no publisher lifecycle signal.
    return nextRequestId();
  };

  root.YaGamesGML_browserConsoleLog = function YaGamesGML_browserConsoleLog(text) {
    if (root.console && typeof root.console.info === "function") {
      root.console.info("[Game]", String(text));
    }
  };

  root.YaGamesGML_getEnvironment = function YaGamesGML_getEnvironment() {
    const id = nextRequestId();
    const rawLanguage = root.navigator && (root.navigator.language || root.navigator.userLanguage);
    const lang = String(rawLanguage || "en").split(/[-_]/, 1)[0].toLowerCase();
    root.setTimeout(function reportBrowserLocale() {
      sendData(id, "environment", { i18n: { lang } });
    }, 0);
    return id;
  };

  root.YaGamesGMS_showFullscreenAdv = function YaGamesGMS_showFullscreenAdv() {
    return unsupported("adError", "Fullscreen advertising");
  };

  root.YaGamesGMS_showRewardedVideo = function YaGamesGMS_showRewardedVideo() {
    return unsupported("rewardError", "Rewarded advertising");
  };

  root.YaGamesGML_Leaderboards_Init = function YaGamesGML_Leaderboards_Init() {
    return unsupported("leaderboardsInitError", "Online leaderboards");
  };

  root.YaGamesGML_Leaderboards_getPlayerEntry = function YaGamesGML_Leaderboards_getPlayerEntry() {
    return unsupported("leaderboardsPlayerEntryError", "Online leaderboard entries");
  };

  root.YaGamesGML_Leaderboards_getEntries = function YaGamesGML_Leaderboards_getEntries() {
    return unsupported("leaderboardsEntriesError", "Online leaderboard entries");
  };

  root.YaGamesGML_Leaderboards_setScore = function YaGamesGML_Leaderboards_setScore() {
    return unsupported("leaderboardsSetScoreError", "Online score submission");
  };

  root.YaGamesGML_Player_Init = function YaGamesGML_Player_Init() {
    return unsupported("playerInitError", "Player accounts");
  };

  root.YaGamesGML_Player_GetMode = function YaGamesGML_Player_GetMode() {
    return unsupported("notPlayerInitSDK", "Player account mode");
  };

  root.YaGamesGML_OpenAuthDialog = function YaGamesGML_OpenAuthDialog() {
    return unsupported("playerLoggedError", "Account sign-in");
  };
})(globalThis);
`;

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkSource() {
  assert(fs.existsSync(manifestPath), 'Geometry Dash Hyper Wave source-manifest.json is missing.');
  assert(fs.existsSync(extensionPath), 'Reviewed VPH YaGames extension is missing.');
  assert(fs.existsSync(gamePath), 'GameMaker runtime bundle is missing.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pinned = manifest.files?.find((file) => file.path === manifestExtensionPath);
  assert(pinned, 'The reviewed VPH extension is not pinned in the package manifest.');
  const actualExtensionHash = sha256(extensionPath);
  const alreadyGuest = fs.readFileSync(extensionPath, 'utf8').includes('Sidequest guest/offline compatibility adapter');
  assert(alreadyGuest
    ? actualExtensionHash === pinned.sha256
    : actualExtensionHash === (pinned.sourceSha256 || pinned.sha256),
    `Refusing to replace an extension that differs from its pinned source hash (${actualExtensionHash}).`);

  const gameSource = fs.readFileSync(gamePath, 'utf8');
  assert(gameSource.includes('"./vph_YaGames.js"'), 'GameMaker extension path changed; refusing to patch a different runtime target.');
  const requiredFunctions = [
    'YaGamesGMS_getInitStatus', 'YaGamesGMS_GameReadyOn', 'YaGamesGML_browserConsoleLog',
    'YaGamesGML_getEnvironment', 'YaGamesGMS_showFullscreenAdv', 'YaGamesGMS_showRewardedVideo',
    'YaGamesGML_Leaderboards_Init', 'YaGamesGML_Leaderboards_getPlayerEntry',
    'YaGamesGML_Leaderboards_getEntries', 'YaGamesGML_Leaderboards_setScore',
    'YaGamesGML_Player_Init', 'YaGamesGML_Player_GetMode', 'YaGamesGML_OpenAuthDialog'
  ];
  const usedFunctions = requiredFunctions.filter((name) => new RegExp(`\\b${name}\\b`).test(gameSource));
  for (const name of usedFunctions) {
    assert(guestAdapter.includes(`root.${name} = function ${name}`), `Guest adapter does not implement GameMaker call ${name}.`);
  }

  const immutableFiles = manifest.files
    .filter((file) => file.path === 'html5game/gd_arrow_neon.js' || /html5game\/gd_arrow_neon_texture_\d+\.png$/.test(file.path));
  for (const file of immutableFiles) {
    const localPath = path.join(packageDir, file.path);
    assert(fs.existsSync(localPath), `Immutable runtime/atlas file is missing: ${file.path}`);
    if (file.sha256) assert(sha256(localPath) === file.sha256, `Immutable runtime/atlas hash differs from package manifest: ${file.path}`);
  }
  return {
    manifest,
    pinned,
    alreadyGuest,
    originalExtensionHash: pinned.sourceSha256 || actualExtensionHash,
    currentExtensionHash: actualExtensionHash,
    immutableFiles: immutableFiles.map((file) => file.path),
    usedFunctions
  };
}

async function verifyCallbacks() {
  const events = [];
  const noticeElements = [];
  const fakeDocument = {
    readyState: 'complete',
    body: { appendChild(element) { noticeElements.push(element); } },
    createElement(tag) {
      return { tagName: tag, style: { cssText: '' }, setAttribute() {}, textContent: '', id: '' };
    },
    getElementById() { return null; }
  };
  const sandbox = {
    document: fakeDocument,
    navigator: { language: 'en-US' },
    console: { info() {}, warn() {} },
    setTimeout,
    GMS_API: { send_async_event_social(payload) { events.push({ ...payload }); } }
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(guestAdapter, context, { timeout: 1000 });
  const bootReady = vm.runInContext('YaGamesGMS_getInitStatus() === 1 && SidequestGuestMode.bootReady === true', context);
  assert(bootReady, 'Local guest adapter did not report boot-ready.');
  assert(vm.runInContext('SidequestGuestMode.available === false && SidequestGuestMode.playerAccountAvailable === false', context), 'Guest mode must report online/account availability as false.');
  vm.runInContext('YaGamesGMS_GameReadyOn(); YaGamesGMS_showFullscreenAdv(); YaGamesGMS_showRewardedVideo(); YaGamesGML_Player_Init(); YaGamesGML_Leaderboards_Init(); YaGamesGML_getEnvironment();', context, { timeout: 1000 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const eventNames = events.map((event) => event.event);
  assert(eventNames.includes('adError'), 'Fullscreen ad call did not return an explicit unsupported error.');
  assert(eventNames.includes('rewardError'), 'Rewarded ad call did not return an explicit unsupported error.');
  assert(eventNames.includes('playerInitError'), 'Player initialization did not report that accounts are unavailable.');
  assert(eventNames.includes('leaderboardsInitError'), 'Leaderboard initialization did not report that online service is unavailable.');
  assert(eventNames.includes('environment'), 'Browser locale response was not delivered to the game.');
  assert(!eventNames.includes('rewardReceived'), 'Guest adapter must never emit a reward grant.');
  assert(noticeElements.length === 1 && /Guest mode/.test(noticeElements[0].textContent), 'Visible guest-mode notice was not created.');
  return { bootReady, available: false, eventNames, rewardReceived: eventNames.includes('rewardReceived'), guestNotice: noticeElements[0].textContent };
}

const checked = checkSource();
const callbackChecks = await verifyCallbacks();
const adapterHash = crypto.createHash('sha256').update(guestAdapter).digest('hex');
const adapterSize = Buffer.byteLength(guestAdapter, 'utf8');
let changedFiles = [];
let sourceManifestEdited = false;
if (apply) {
  const manifest = checked.manifest;
  const fileEntry = manifest.files.find((file) => file.path === manifestExtensionPath);
  fileEntry.sha256 = adapterHash;
  fileEntry.size = adapterSize;
  fileEntry.appliedChanges = [...new Set([
    ...(fileEntry.appliedChanges || []),
    'Replaced the publisher YaGames loader with a visibly labeled Sidequest guest/offline adapter; upstream sourceSha256/sourceSize and wire hashes are preserved.'
  ])];
  manifest.appliedChanges = [...new Set([
    ...(manifest.appliedChanges || []),
    'Applied Sidequest guest/offline compatibility overlay to html5game/vph_YaGames.js; GameMaker core, atlases, index.html, domains, and source pins were preserved.'
  ])];
  manifest.artifactBytes = manifest.files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  manifest.localOverlays = [
    ...(manifest.localOverlays || []).filter((overlay) => overlay.path !== manifestExtensionPath),
    {
      path: manifestExtensionPath,
      kind: 'generated-local-compatibility-overlay',
      name: 'Sidequest guest/offline adapter',
      sha256: adapterHash,
      size: adapterSize,
      replacesSourceSha256: fileEntry.sourceSha256 || checked.originalExtensionHash,
      generatedBy: 'scripts/prepare-hyperwave-guest-adapter.mjs'
    }
  ];

  const extensionTemp = `${extensionPath}.sidequest-tmp`;
  const manifestTemp = `${manifestPath}.sidequest-tmp`;
  if (!checked.alreadyGuest) {
    fs.writeFileSync(extensionTemp, guestAdapter, 'utf8');
    fs.renameSync(extensionTemp, extensionPath);
    changedFiles.push(manifestExtensionPath);
  }
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  sourceManifestEdited = manifestText !== fs.readFileSync(manifestPath, 'utf8');
  if (sourceManifestEdited) {
    fs.writeFileSync(manifestTemp, manifestText, 'utf8');
    fs.renameSync(manifestTemp, manifestPath);
    changedFiles.push('source-manifest.json (artifact metadata only)');
  }
}

const report = {
  mode: apply ? 'apply-one-file-overlay' : 'dry-run; no package files changed',
  slug: 'geometry-dash-hyper-wave',
  target: manifestExtensionPath,
  originalExtensionHash: checked.originalExtensionHash,
  currentExtensionHash: apply ? adapterHash : checked.currentExtensionHash,
  adapterHash,
  alreadyApplied: checked.alreadyGuest,
  changedFiles,
  unchangedProtectedFiles: checked.immutableFiles,
  sourceManifestEdited,
  sourcePinsPreserved: true,
  sourceManifestIntegrityNote: sourceManifestEdited
    ? 'Updated artifact sha256/size, appliedChanges, artifactBytes, and localOverlays; retained sourceSha256/sourceSize and wire hashes.'
    : null,
  requiredGameMakerFunctions: checked.usedFunctions,
  callbackChecks
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
