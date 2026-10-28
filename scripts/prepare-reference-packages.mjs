import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { brotliDecompressSync, brotliCompressSync, gunzipSync, gzipSync, inflateSync, deflateSync } from 'node:zlib';
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(ROOT, 'scripts/reference-package-sources.json');
const AUDIT_FALLBACK = path.join(ROOT, 'docs/V4_REFERENCE_RUNTIME_AUDIT.json');
const OUTPUT_ROOT = path.join(ROOT, 'public/play/archives');
const CACHE_ROOT = path.join(ROOT, '.next/cache/sidequest-reference-games');
const BRIDGE_FILE = path.join(ROOT, 'public/play/arcade-bridge.js');
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
const ACCEPT_ENCODING = 'identity';
const FETCH_TIMEOUT_MS = 45_000;
const REDIRECT_LIMIT = 5;
const PACKAGE_CONCURRENCY = 2;
const ASSET_CONCURRENCY = 5;
const MAX_ATTEMPTS = 2;
const USE_CONFIGURED_ENV_PROXY = process.env.NODE_USE_ENV_PROXY === '1' && Boolean(process.env.HTTPS_PROXY || process.env.https_proxy);
const TRUSTED_SOURCE_HOSTS = new Set();
const AUDITED_EXTERNAL_URLS = new Set();
const STATIC_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.wasm', '.data', '.unityweb', '.br', '.gz',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp', '.tif', '.tiff', '.ktx', '.ktx2', '.basis', '.hdr', '.env', '.glb', '.gltf', '.obj', '.mtl', '.bin', '.txt', '.xml', '.manifest', '.dmanifest', '.projectc', '.dmloader', '.dmwasm', '.arcd', '.arci', '.opus', '.mp3', '.ogg', '.wav', '.mp4', '.webm', '.m4a', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.map', '.dat', '.pak', '.bytes', '.asset', '.bundle', '.indexdb', '.wasm.br', '.data.br', '.js.br', '.wasm.gz', '.data.gz', '.js.gz',
]);
const SCRIPT_STYLE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css', '.json', '.wasm', '.data', '.unityweb', '.br', '.gz', '.wasm.br', '.data.br', '.js.br', '.wasm.gz', '.data.gz', '.js.gz']);
const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.xml', '.txt', '.manifest', '.dmanifest', '.projectc', '.dmloader']);
const REWRITE_VERSION = 'reference-package-archive-v1';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const isPlainObject = value => value && typeof value === 'object' && !Array.isArray(value);
const safeSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const safeRelative = value => typeof value === 'string' && value.length > 0 && !path.posix.isAbsolute(value) && !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..');

function trustAuditedUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || net.isIP(host) && !isPublicIp(host)) return;
    TRUSTED_SOURCE_HOSTS.add(host);
  } catch { /* malformed audit URLs are not trusted */ }
}

function trustAudit(audit, unityAudit = null) {
  const records = Array.isArray(audit) ? audit : audit?.records || audit?.games || audit?.entries || [];
  for (const record of records) {
    for (const key of ['entryURL', 'finalURL']) trustAuditedUrl(record[key]);
    if (Array.isArray(record.localAssetReferences)) for (const ref of record.localAssetReferences) trustAuditedUrl(ref.resolvedURL || ref.url);
    if (Array.isArray(record.externalAssetReferences)) for (const ref of record.externalAssetReferences) {
      const value = ref.resolvedURL || ref.url;
      try { const url = new URL(value); url.hash = ''; AUDITED_EXTERNAL_URLS.add(url.href); } catch { /* ignored */ }
    }
  }
  const unityRecords = Array.isArray(unityAudit) ? unityAudit : unityAudit?.records || unityAudit?.assets || [];
  for (const record of unityRecords) {
    trustAuditedUrl(record.entryURL);
    for (const asset of record.assets || []) trustAuditedUrl(asset.url || asset.resolvedURL);
  }
}

function isAuditedExternalUrl(urlValue) {
  try { const url = new URL(urlValue); url.hash = ''; return AUDITED_EXTERNAL_URLS.has(url.href); }
  catch { return false; }
}

function trustManifestSourceUrls(manifest) {
  for (const pkg of manifest.packages || []) {
    trustAuditedUrl(pkg.entryUrl);
    trustAuditedUrl(pkg.assetBaseUrl);
    for (const file of pkg.files || []) {
      trustAuditedUrl(file.url);
      trustAuditedUrl(file.finalUrl);
    }
  }
}

function inside(root, target, label) {
  const relative = path.relative(root, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Unsafe ${label} path: ${target}`);
}

function isPublicIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    const [c] = ip.split('.').slice(2).map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 0 && c === 2) || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('ff')) return false;
    const parts = normalized.split(':');
    const mappedAt = parts.findIndex((part, index) => part === 'ffff' && parts.slice(0, index).every(prefix => !prefix || prefix === '0'));
    if (mappedAt >= 0) {
      const suffix = parts.slice(mappedAt + 1).filter(Boolean);
      if (suffix.length === 1 && /^\d+\.\d+\.\d+\.\d+$/.test(suffix[0])) return isPublicIp(suffix[0]);
      if (suffix.length === 2 && suffix.every(part => /^[0-9a-f]{1,4}$/.test(part))) {
        const high = Number.parseInt(suffix[0], 16); const low = Number.parseInt(suffix[1], 16);
        return isPublicIp(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
      }
      return false;
    }
    if (!/^[23][0-9a-f]{3}:/i.test(normalized) || /^2001:db8:/i.test(normalized)) return false;
    return true;
  }
  return false;
}

async function validateUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`Invalid source URL: ${value}`); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error(`Blocked non-public or non-HTTPS URL: ${value}`);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (isBlockedAdOrAnalyticsUrl(url.href)) throw new Error(`Blocked advertising or analytics URL: ${value}`);
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.test') || hostname.endsWith('.invalid') || (!hostname.includes('.') && net.isIP(hostname) === 0)) throw new Error(`Blocked private host: ${hostname}`);
  if (USE_CONFIGURED_ENV_PROXY) {
    if (net.isIP(hostname) || !TRUSTED_SOURCE_HOSTS.has(hostname)) throw new Error(`Blocked source host outside the exact audit allowlist: ${hostname}`);
    return { url, address: null, family: null, viaProxy: true };
  }
  let addresses;
  if (net.isIP(hostname)) addresses = [{ address: hostname, family: net.isIP(hostname) }];
  else addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => !isPublicIp(item.address))) throw new Error(`Blocked host resolving to non-public IP: ${hostname}`);
  return { url, address: addresses[0].address, family: addresses[0].family };
}

function requestRaw(urlValue, redirects = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      const validated = await validateUrl(urlValue);
      const requestOptions = {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': ACCEPT_ENCODING, Accept: '*/*' },
        servername: validated.url.hostname,
        timeout: FETCH_TIMEOUT_MS,
        agent: undefined,
        rejectUnauthorized: true,
      };
      if (!validated.viaProxy) requestOptions.lookup = (_hostname, options, callback) => {
        // Node 22+ can use dual-stack lookups and request an array.
        if (typeof options === 'function') { callback = options; options = {}; }
        if (options?.all) callback(null, [{ address: validated.address, family: validated.family }]);
        else callback(null, validated.address, validated.family);
      };
      const req = httpsRequest(validated.url, requestOptions, response => {
        const status = response.statusCode || 0;
        const location = response.headers.location;
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          response.resume();
          if (redirects >= REDIRECT_LIMIT) return reject(new Error(`Too many redirects for ${urlValue}`));
          const next = new URL(location, validated.url).href;
          requestRaw(next, redirects + 1).then(resolve, reject);
          return;
        }
        const chunks = [];
        let bytes = 0;
        response.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > 200_000_000) {
            req.destroy(new Error(`Response exceeds per-file limit: ${urlValue}`));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolve({ status, headers: response.headers, bytes: Buffer.concat(chunks), finalUrl: validated.url.href }));
        response.on('error', reject);
      });
      req.on('timeout', () => req.destroy(new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms: ${urlValue}`)));
      req.on('error', reject);
      req.end();
    } catch (error) { reject(error); }
  });
}

async function fetchRaw(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try { return await requestRaw(url); }
    catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    }
  }
  throw lastError;
}

function normalizeCloudflareAnalytics(bytes, contentType = '') {
  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) return bytes;
  let html = bytes.toString('utf8');
  html = html.replace(/<script\b(?=[^>]*(?:data-cf-beacon\s*=|(?:src\s*=)["'][^"']*cloudflareinsights\.com\/beacon\.min\.js))[^>]*>\s*<\/script\s*>/gi, '');
  html = html.replace(/\sdata-cf-beacon\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return Buffer.from(html, 'utf8');
}

function contentTypeOf(response, url) {
  return String(response.headers['content-type'] || mimeFor(url)).split(';')[0].trim().toLowerCase();
}

function decodeContentEncoding(bytes, encoding) {
  const value = String(encoding || 'identity').trim().toLowerCase();
  if (value === 'identity' || value === '') return bytes;
  if (value === 'br') return brotliDecompressSync(bytes);
  if (value === 'gzip' || value === 'x-gzip') return gunzipSync(bytes);
  if (value === 'deflate') return inflateSync(bytes);
  return bytes;
}

function encodeContentEncoding(bytes, encoding) {
  const value = String(encoding || 'identity').trim().toLowerCase();
  if (value === 'identity' || value === '') return bytes;
  if (value === 'br') return brotliCompressSync(bytes);
  if (value === 'gzip' || value === 'x-gzip') return gzipSync(bytes, { mtime: 0 });
  if (value === 'deflate') return deflateSync(bytes);
  return bytes;
}

function canonicalizeSourceResponse(wireBytes, wireEncoding, contentType, pinnedEncoding = wireEncoding) {
  const entityBytes = decodeContentEncoding(wireBytes, wireEncoding);
  if (entityBytes.length > 200_000_000) throw new Error(`Decoded response exceeds ${200_000_000} byte per-file limit`);
  const normalizedEntity = normalizeCloudflareAnalytics(entityBytes, contentType);
  const pinnedBytes = encodeContentEncoding(normalizedEntity, pinnedEncoding);
  if (pinnedBytes.length > 200_000_000) throw new Error(`Pinned response exceeds ${200_000_000} byte per-file limit`);
  return { entityBytes, normalizedEntity, pinnedBytes };
}

function mimeFor(urlValue) {
  const ext = path.posix.extname(new URL(urlValue).pathname).toLowerCase();
  return ({ '.html': 'text/html', '.htm': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm' })[ext] || 'application/octet-stream';
}

function extFor(urlValue) {
  const pathname = new URL(urlValue).pathname.toLowerCase();
  for (const ext of [...STATIC_EXTENSIONS].sort((a, b) => b.length - a.length)) if (pathname.endsWith(ext)) return ext;
  return path.posix.extname(pathname);
}

function assetTextExtension(filePathOrUrl) {
  const pathname = (() => { try { return new URL(filePathOrUrl).pathname.toLowerCase(); } catch { return filePathOrUrl.toLowerCase(); } })();
  for (const [suffix, extension] of [['.html.br', '.html'], ['.html.gz', '.html'], ['.htm.br', '.htm'], ['.htm.gz', '.htm'], ['.css.br', '.css'], ['.css.gz', '.css'], ['.js.br', '.js'], ['.js.gz', '.js'], ['.mjs.br', '.mjs'], ['.mjs.gz', '.mjs'], ['.cjs.br', '.cjs'], ['.cjs.gz', '.cjs'], ['.json.br', '.json'], ['.json.gz', '.json']]) if (pathname.endsWith(suffix)) return extension;
  return path.posix.extname(pathname);
}

function isAllowedStaticUrl(urlValue) {
  const pathname = new URL(urlValue).pathname.toLowerCase();
  return [...STATIC_EXTENSIONS].some(ext => pathname.endsWith(ext));
}

function isBlockedAdOrAnalyticsUrl(urlValue) {
  const host = new URL(urlValue).hostname.toLowerCase();
  return /(?:^|\.)(?:cloudflareinsights\.com|googletagmanager\.com|google-analytics\.com|googlesyndication\.com|doubleclick\.net|adservice\.google\.|amazon-adsystem\.com|adnxs\.com|criteo\.com|taboola\.com|outbrain\.com|facebook\.net)$/.test(host);
}

function urlPathToLocalPath(urlValue, entryUrl, isEntry = false, allowExactExtensionless = false) {
  if (isEntry) return 'index.html';
  const url = new URL(urlValue);
  const entry = new URL(entryUrl);
  const extensionlessExplicitFile = allowExactExtensionless && !url.pathname.endsWith('/') && !path.posix.extname(url.pathname);
  if (!isAllowedStaticUrl(urlValue) && !extensionlessExplicitFile) return null;
  let decoded;
  try { decoded = url.pathname.split('/').map(segment => decodeURIComponent(segment)).join('/'); }
  catch { return null; }
  const segments = decoded.split('/').filter(Boolean);
  if (!segments.length || segments.some(segment => segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\') || segment.includes('\0'))) return null;
  if (url.origin === entry.origin) {
    const base = entry.pathname.endsWith('/') ? entry.pathname : entry.pathname.slice(0, entry.pathname.lastIndexOf('/') + 1);
    const decodedBase = base.split('/').filter(Boolean).map(segment => decodeURIComponent(segment));
    const basePath = '/' + decodedBase.join('/') + (decodedBase.length ? '/' : '');
    const sameBase = decoded.startsWith(basePath);
    const relative = sameBase ? decoded.slice(basePath.length) : `_root/${url.host}${decoded}`;
    const safe = relative.split('/').filter(Boolean).join('/');
    return safeRelative(safe) ? safe : null;
  }
  const safe = `_hosts/${url.host}${decoded}`;
  return safeRelative(safe) ? safe : null;
}

function normalizeReference(value) {
  return value.replaceAll('\\/', '/').replaceAll('\\\\', '\\').trim();
}

function resolveReference(value, baseUrl) {
  const normalized = normalizeReference(value);
  if (!normalized || /^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(normalized) || normalized.startsWith('//')) {
    if (normalized.startsWith('//')) { try { return new URL(`https:${normalized}`); } catch { return null; } }
    return null;
  }
  try { return new URL(normalized, baseUrl); } catch { return null; }
}

function collectHtmlReferences(html, baseUrl) {
  const refs = [];
  const tagRe = /<(script|link|img|source|audio|video|track|iframe|object|embed|input|image|use|video|canvas|model-viewer|base)\b[^>]*>/gi;
  const attrRe = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let tagMatch;
  while ((tagMatch = tagRe.exec(html))) {
    const tag = tagMatch[1].toLowerCase();
    const attributes = new Map();
    let attrMatch;
    while ((attrMatch = attrRe.exec(tagMatch[0]))) attributes.set(attrMatch[1].toLowerCase(), attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '');
    const names = tag === 'link' ? ['href'] : tag === 'object' ? ['data'] : tag === 'image' || tag === 'use' ? ['href', 'xlink:href'] : ['src', 'poster'];
    if (tag === 'link' && !/(?:stylesheet|preload|modulepreload|manifest|icon|prefetch)/i.test(attributes.get('rel') || '')) continue;
    for (const name of names) {
      const value = attributes.get(name);
      if (!value) continue;
      const url = resolveReference(value, baseUrl);
      if (tag === 'iframe') continue;
      if (url && isAllowedStaticUrl(url.href) && !isBlockedAdOrAnalyticsUrl(url.href) && !isAuditedExternalUrl(url.href)) refs.push({ url: stripFragment(url).href, required: tag === 'script' || (tag === 'link' && /stylesheet|modulepreload|preload/i.test(attributes.get('rel') || '')) || SCRIPT_STYLE_EXTENSIONS.has(extFor(url.href)), evidence: `html:${tag}[${name}]` });
    }
    const srcset = attributes.get('srcset');
    if (srcset) for (const candidate of srcset.split(',')) {
      const url = resolveReference(candidate.trim().split(/\s+/)[0], baseUrl);
      if (url && isAllowedStaticUrl(url.href) && !isBlockedAdOrAnalyticsUrl(url.href) && !isAuditedExternalUrl(url.href)) refs.push({ url: stripFragment(url).href, required: false, evidence: `html:${tag}[srcset]` });
    }
  }
  for (const styleMatch of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) refs.push(...collectCssReferences(styleMatch[1], baseUrl));
  for (const scriptMatch of html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const type = /\btype\s*=\s*(["'])(.*?)\1/i.exec(scriptMatch[0])?.[2]?.toLowerCase() || '';
    if (!type || /(?:javascript|ecmascript|json)/.test(type)) refs.push(...collectQuotedStaticReferences(scriptMatch[1], baseUrl));
  }
  return refs;
}

function collectCssReferences(css, baseUrl) {
  const refs = [];
  const re = /url\(\s*(["']?)(.*?)\1\s*\)|@import\s+(?:url\()?\s*(["'])(.*?)\3\s*\)?/gi;
  let match;
  while ((match = re.exec(css))) {
    const candidate = match[2] || match[4];
    const url = resolveReference(candidate, baseUrl);
    if (url && isAllowedStaticUrl(url.href) && !isBlockedAdOrAnalyticsUrl(url.href) && !isAuditedExternalUrl(url.href)) refs.push({ url: stripFragment(url).href, required: Boolean(match[4]), evidence: match[4] ? 'css:@import' : 'css:url()' });
  }
  return refs;
}

function collectQuotedStaticReferences(text, baseUrl, exactConfig = false) {
  const refs = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
  let match;
  while ((match = re.exec(text))) {
    const candidate = normalizeReference(match[2]).replace(/\\u002[fF]/g, '/').replace(/\\x2[fF]/g, '/');
    if (!candidate || candidate.includes('${') || candidate.length > 2_000 || !/\.(?:html?|css|m?js|cjs|json|wasm|data|unityweb|br|gz|png|jpe?g|gif|webp|avif|svg|ico|ktx2?|basis|hdr|env|glb|gltf|bin|arcd|arci|dmanifest|projectc|dmloader|dmwasm|opus|mp[34]|ogg|wav|woff2?|ttf|otf)(?:\.(?:br|gz|unityweb))?(?:[?#].*)?$/i.test(candidate)) continue;
    const url = resolveReference(candidate, baseUrl);
    if (url && isAllowedStaticUrl(url.href) && !isBlockedAdOrAnalyticsUrl(url.href) && !isAuditedExternalUrl(url.href)) refs.push({ url: stripFragment(url).href, required: exactConfig && SCRIPT_STYLE_EXTENSIONS.has(extFor(url.href)), evidence: exactConfig ? 'quoted-config-ref' : 'quoted-static-heuristic' });
  }
  return refs;
}

function stripFragment(url) { const copy = new URL(url.href); copy.hash = ''; return copy; }

function entryHtmlName(packageSource) {
  return packageSource.entryPath || 'index.html';
}

function chooseAuditPackageSeeds(audit, omissions = []) {
  const records = Array.isArray(audit) ? audit : audit?.games || audit?.packages || audit?.entries || audit?.records || [];
  const excludedRuntimeSlugs = new Set(omissions.filter(item => item.runtimeEntryExcluded === true).map(item => item.slug));
  const output = [];
  for (const record of records) {
    const value = record.packageSource || record.archiveSource || record.localSource || record.localPackage;
    const entryUrl = record.entryURL || record.entryUrl || record.runtimeUrl || record.gameUrl;
    const blockedSameOrigin = /sameorigin/i.test(`${record.xFrameOptions || ''} ${record.framingAssessment || ''}`);
    let isReferenceRuntimeToArchive = false;
    try {
      const runtime = new URL(entryUrl);
      isReferenceRuntimeToArchive = blockedSameOrigin && runtime.hostname === 'watchdocumentaries.com' && runtime.pathname.startsWith('/wp-content/uploads/games/') && runtime.pathname.split('/').filter(Boolean).length >= 4;
    } catch { /* malformed audit entries are ignored */ }
    const isLocalPackage = record.hosting === 'local_package' || record.archiveEligible === true || record.packageReady === true || isReferenceRuntimeToArchive;
    const seed = isPlainObject(value) ? value : isLocalPackage ? record : null;
    if (!seed) continue;
    const slug = seed.slug || record.slug;
    const runtimeUrl = seed.entryURL || seed.entryUrl || seed.startUrl || seed.runtimeUrl || seed.sourceUrl || seed.url || entryUrl;
    if (!safeSlug(slug) || typeof runtimeUrl !== 'string' || excludedRuntimeSlugs.has(slug)) continue;
    const localAssetReferences = record.localAssetReferences || seed.localAssetReferences || [];
    output.push({ slug, title: seed.title || record.title || slug, reference: seed.reference || record.sourcePageURL || record.reference || record.referencePage || null, entryUrl: runtimeUrl, assetBaseUrl: seed.assetBaseUrl || record.finalURL || runtimeUrl, source: seed.source || seed.repository || null, revision: seed.revision || null, entryPath: 'index.html', requiredUrls: seed.requiredUrls || localAssetReferences, requiredFiles: seed.requiredFiles || [], unity: seed.unity || record.unity || null, fileLists: seed.fileLists || record.fileLists || [], externalDependencies: record.externalAssetReferences || [], sourceNotices: seed.sourceNotices || record.sourceNotices || [], sourceLicenseStatus: seed.sourceLicenseStatus || record.sourceLicenseStatus || null, authorization: seed.authorization || record.authorization || null, runtimeAudit: { entryURL: record.entryURL || null, sourcePageURL: record.sourcePageURL || null, finalURL: record.finalURL || null, httpStatus: record.httpStatus ?? null, contentType: record.contentType || null, xFrameOptions: record.xFrameOptions || null, framingAssessment: record.framingAssessment || null, engineClassification: record.engineClassification || null, rawHTMLFile: record.rawHTMLFile || null }, removeShellRedirectScriptUrl: seed.removeShellRedirectScriptUrl || null, notes: seed.notes || record.notes || [] });
  }
  return output;
}

async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temp, file);
}

function assertSourceManifest(manifest) {
  if (!isPlainObject(manifest) || !Array.isArray(manifest.packages) || !Array.isArray(manifest.omissions)) throw new Error(`Invalid reference package source manifest: ${SOURCE_FILE}`);
  if (manifest.rewriteVersion !== REWRITE_VERSION) throw new Error(`Unexpected rewrite version: ${manifest.rewriteVersion}`);
  const seen = new Set();
  for (const pkg of manifest.packages) {
    if (!safeSlug(pkg.slug) || seen.has(pkg.slug)) throw new Error(`Invalid or duplicate package slug: ${pkg.slug}`);
    seen.add(pkg.slug);
    if (typeof pkg.entryUrl !== 'string' || !Array.isArray(pkg.files)) throw new Error(`Missing entry URL or file pins for ${pkg.slug}`);
    const filePaths = new Set();
    let bytes = 0;
    for (const file of pkg.files) {
      if (!safeRelative(file.path) || filePaths.has(file.path) || typeof file.url !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sourceSha256 || '') || !Number.isSafeInteger(file.sourceSize) || !/^[a-f0-9]{64}$/i.test(file.sha256 || '') || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > manifest.maxFileBytes) throw new Error(`Invalid pin metadata for ${pkg.slug}/${file.path}`);
      filePaths.add(file.path);
      bytes += file.sourceSize;
      if (file.path === entryHtmlName(pkg)) continue;
    }
    if (pkg.ready && (!filePaths.has(entryHtmlName(pkg)) || bytes !== pkg.totalSourceBytes || pkg.files.length !== pkg.totalFiles)) throw new Error(`Ready package totals mismatch for ${pkg.slug}`);
  }
}

function requiredEntryPath(source) { return source.entryPath || 'index.html'; }

function markUniqueRef(map, reference) {
  const current = map.get(reference.url);
  if (!current) map.set(reference.url, reference);
  else if (reference.required && !current.required) map.set(reference.url, { ...current, required: true, evidence: `${current.evidence}; ${reference.evidence}` });
}

function fileListUrls(value, baseUrl, out) {
  if (!value) return;
  if (typeof value === 'string') {
    const url = resolveReference(value, baseUrl);
      if (url && !isBlockedAdOrAnalyticsUrl(url.href)) markUniqueRef(out, { url: stripFragment(url).href, required: true, evidence: 'audited-file-list' });
    return;
  }
  if (Array.isArray(value)) { for (const item of value) fileListUrls(item, baseUrl, out); return; }
  if (isPlainObject(value)) {
    if (typeof value.url === 'string' || typeof value.resolvedURL === 'string' || typeof value.path === 'string') {
      const raw = value.url || value.resolvedURL || value.path;
      const url = resolveReference(raw, baseUrl);
      const kind = String(value.kind || '').toLowerCase();
      const required = value.required !== false && (value.required === true || /(?:script|style|config|loader|wasm|data|code|unity|manifest|font|audio|video|model|texture)/i.test(kind));
      if (url && !isBlockedAdOrAnalyticsUrl(url.href)) markUniqueRef(out, { url: stripFragment(url).href, required, evidence: `audited-file-list:${value.evidence || value.kind || 'unknown'}` });
    }
    for (const key of ['files', 'assets', 'resources', 'children', 'configFiles', 'dataFiles', 'codeFiles']) if (value[key]) fileListUrls(value[key], baseUrl, out);
  }
}

function shellRedirectRemoved(html, exactScriptUrl) {
  if (!exactScriptUrl) return { html, removed: false };
  let removed = false;
  const output = html.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>\s*<\/script\s*>/gi, (tag, _quote, src) => {
    if (removed || normalizeReference(src) !== normalizeReference(exactScriptUrl)) return tag;
    removed = true;
    return '';
  });
  return { html: output, removed };
}

function htmlTagAttributeRewrite(html, fileUrl, resolveLocalUrl) {
  const tagRe = /<(script|link|img|source|audio|video|track|iframe|object|embed|input|image|use|model-viewer|base|a)\b[^>]*>/gi;
  const attrRe = /([\w:-]+\s*=\s*)("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  return html.replace(tagRe, tag => {
    const tagName = /^<([\w-]+)/.exec(tag)?.[1]?.toLowerCase();
    return tag.replace(attrRe, (full, prefix, quoted, doubleValue, singleValue, bareValue) => {
      const name = /^([\w:-]+)/.exec(prefix)?.[1]?.toLowerCase();
      const value = doubleValue ?? singleValue ?? bareValue ?? '';
      const delimiter = quoted[0] || '"';
      if (name === 'style') {
        const css = value.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (all, quote, ref) => {
          const local = resolveLocalUrl(ref, fileUrl);
          return local ? `url(${quote}${local}${quote})` : all;
        });
        if (css !== value) return `${prefix}${delimiter}${css}${delimiter}`;
      }
      if (name === 'srcset') {
        const rewritten = value.split(',').map(candidate => {
          const match = /^(\s*)(\S+)([\s\S]*)$/.exec(candidate);
          if (!match) return candidate;
          const local = resolveLocalUrl(match[2], fileUrl);
          return local ? `${match[1]}${local}${match[3]}` : candidate;
        }).join(',');
        return rewritten === value ? full : `${prefix}${delimiter}${rewritten}${delimiter}`;
      }
      if (!['src', 'href', 'data', 'poster', 'xlink:href'].includes(name)) return full;
      if (tagName === 'link' && name === 'href') {
        const rel = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
        if (!/(?:stylesheet|preload|modulepreload|manifest|icon|prefetch)/i.test(rel?.[1] ?? rel?.[2] ?? rel?.[3] ?? '')) return full;
      }
      if (tagName === 'base' && name === 'href') {
        try {
          if (new URL(value, fileUrl).origin === new URL(fileUrl).origin) return `${prefix}${delimiter}./${delimiter}`;
        } catch { /* leave invalid source base untouched */ }
      }
      const local = resolveLocalUrl(value, fileUrl);
      if (!local) return full;
      return `${prefix}${delimiter}${local}${delimiter}`;
    });
  });
}

function rewriteTextReferences(text, extension, fileUrl, resolveLocalUrl) {
  let output = text;
  if (extension === '.html' || extension === '.htm') output = htmlTagAttributeRewrite(output, fileUrl, resolveLocalUrl);
  if (extension === '.css') output = output.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (all, quote, value) => {
    const local = resolveLocalUrl(value, fileUrl);
    return local ? `url(${quote}${local}${quote})` : all;
  }).replace(/(@import\s+)(["'])(.*?)\2/gi, (all, prefix, quote, value) => {
    const local = resolveLocalUrl(value, fileUrl);
    return local ? `${prefix}${quote}${local}${quote}` : all;
  });
  if (['.js', '.mjs', '.cjs', '.json', '.manifest', '.dmanifest', '.projectc', '.dmloader'].includes(extension)) {
    const quoted = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
    output = output.replace(quoted, (all, quote, value) => {
      const unescaped = normalizeReference(value).replace(/\\u002[fF]/g, '/').replace(/\\x2[fF]/g, '/');
      const local = resolveLocalUrl(unescaped, fileUrl, { onlyStatic: true });
      if (!local) return all;
      return `${quote}${value.includes('\\/') ? local.replaceAll('/', '\\/') : local}${quote}`;
    });
  }
  return output;
}

async function scanPackage(pkg, totalUsed) {
  const errors = [];
  const warnings = Array.isArray(pkg.warnings) ? [...pkg.warnings] : [];
  const modifications = [];
  const entryUrl = new URL(pkg.entryUrl).href;
  if (new URL(entryUrl).pathname === '/') throw new Error(`Refusing root-page runtime entry for ${pkg.slug}: ${entryUrl}`);
  if (pkg.runtimeAudit) {
    const entry = new URL(entryUrl);
    const segments = entry.pathname.split('/').filter(Boolean);
    if (pkg.runtimeAudit.entryURL !== entryUrl || entry.hostname !== 'watchdocumentaries.com' || !entry.pathname.startsWith('/wp-content/uploads/games/') || segments.length < 4) throw new Error(`Runtime entry does not match the exact audited WatchDocumentaries game path for ${pkg.slug}: ${entryUrl}`);
  }
  const assetBaseUrl = new URL(pkg.assetBaseUrl || pkg.entryUrl).href;
  const refs = new Map();
  markUniqueRef(refs, { url: stripFragment(new URL(entryUrl)).href, required: true, evidence: 'audited-runtime-entry' });
  for (const value of pkg.requiredUrls || []) fileListUrls(value, entryUrl, refs);
  for (const value of pkg.requiredFiles || []) fileListUrls(value, entryUrl, refs);
  for (const value of pkg.fileLists || []) fileListUrls(value, entryUrl, refs);
  if (pkg.unity) fileListUrls(pkg.unity, entryUrl, refs);

  const sourceFiles = new Map();
  const pending = [...refs.keys()];
  const queued = new Set(pending);
  const visited = new Set();
  let sourceBytes = 0;
  let cursor = 0;
  let firstRequiredFailure = null;
  async function worker() {
    while (cursor < pending.length && !firstRequiredFailure) {
      const pendingUrl = pending[cursor++];
      const ref = refs.get(pendingUrl);
      if (!ref || visited.has(ref.url)) continue;
      visited.add(ref.url);
      const isEntry = ref.url === stripFragment(new URL(entryUrl)).href;
      const exactFileListEntry = /audited-file-list|html:script|html:link\[href\]/.test(ref.evidence || '') && ref.required;
      const assignedPath = isEntry ? requiredEntryPath(pkg) : urlPathToLocalPath(ref.url, assetBaseUrl, false, exactFileListEntry);
      if (!assignedPath) {
        if (ref.required) firstRequiredFailure = new Error(`Required URL is not a versioned static file or safe entry point: ${pkg.slug} ${ref.url}`);
        else warnings.push(`Skipped non-static, root, or bare-directory reference: ${ref.url}`);
        continue;
      }
      try {
        const response = await fetchRaw(ref.url);
        if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
        const wireContentEncoding = String(response.headers['content-encoding'] || 'identity').toLowerCase();
        const decodedForDetection = decodeContentEncoding(response.bytes, wireContentEncoding);
        if (decodedForDetection.length > 200_000_000) throw new Error(`decoded response exceeds ${200_000_000} byte per-file limit`);
        let contentType = contentTypeOf(response, ref.url);
        if (isEntry && looksLikeHtml(decodedForDetection)) contentType = 'text/html';
        const canonical = canonicalizeSourceResponse(response.bytes, wireContentEncoding, contentType, wireContentEncoding);
        const normalizedEntity = canonical.normalizedEntity;
        const bytes = canonical.pinnedBytes;
        sourceBytes += bytes.length;
        totalUsed.value += bytes.length;
        if (totalUsed.value > 3_000_000_000) throw new Error('aggregate source payload exceeds 3 GB');
        if (contentType.includes('text/html')) {
          const text = normalizedEntity.toString('utf8');
          if (looksLikeHttpErrorPage(text)) warnings.push(`HTTP 200 body contains an error-page marker (kept as a warning): ${ref.url}`);
          if (isEntry && !/<html\b|<!doctype\s+html/i.test(text)) throw new Error('runtime entry did not return an HTML document');
          for (const found of collectHtmlReferences(text, response.finalUrl)) enqueue(found);
        } else if (contentType.includes('text/css') || assetTextExtension(ref.url) === '.css') {
          for (const found of collectCssReferences(decodedForDetection.toString('utf8'), response.finalUrl)) enqueue(found);
        } else if (contentType.includes('javascript') || ['.js', '.mjs', '.cjs'].includes(assetTextExtension(ref.url))) {
          for (const found of collectQuotedStaticReferences(decodedForDetection.toString('utf8'), response.finalUrl)) enqueue(found);
        } else if (isUnityMetadata(ref.url, contentType) || assetTextExtension(ref.url) === '.json') {
          for (const found of collectQuotedStaticReferences(decodedForDetection.toString('utf8'), response.finalUrl, true)) enqueue(found);
          for (const found of collectJsonAssetReferences(decodedForDetection, response.finalUrl)) enqueue(found);
        }
        const previous = sourceFiles.get(assignedPath);
        const sourceSha256 = sha256(bytes);
        if (previous && previous.sourceSha256 !== sourceSha256) throw new Error(`Source path collision with different bytes: ${assignedPath}`);
        sourceFiles.set(assignedPath, { path: assignedPath, url: ref.url, sourceSha256, sourceSize: bytes.length, contentType, contentEncoding: wireContentEncoding, wireContentEncoding, required: Boolean(ref.required), evidence: ref.evidence, finalUrl: response.finalUrl, wireSha256: sha256(response.bytes), wireSize: response.bytes.length });
        const cachePath = path.join(CACHE_ROOT, pkg.slug, ...assignedPath.split('/'));
        inside(path.join(CACHE_ROOT, pkg.slug), cachePath, 'cache');
        await mkdir(path.dirname(cachePath), { recursive: true });
        await writeFile(cachePath, bytes);
        if (sourceFiles.size % 25 === 0) console.log(`[record:${pkg.slug}] ${sourceFiles.size} files, ${sourceBytes} bytes`);
      } catch (error) {
        const description = `${ref.url}: ${error.message}`;
        if (ref.required) {
          firstRequiredFailure = new Error(`Required source asset failed for ${pkg.slug}: ${description}`);
          errors.push(description);
        } else warnings.push(`Optional asset skipped: ${description}`);
      }
    }
  }
  function enqueue(reference) {
    markUniqueRef(refs, reference);
    if (!queued.has(reference.url) && !visited.has(reference.url)) {
      queued.add(reference.url);
      pending.push(reference.url);
    }
  }
  await Promise.all(Array.from({ length: ASSET_CONCURRENCY }, worker));
  if (firstRequiredFailure) errors.unshift(firstRequiredFailure.message);
  const files = [...sourceFiles.values()].sort((a, b) => a.path.localeCompare(b.path));
  return { files, sourceBytes, errors, warnings, modifications };
}

function isUnityMetadata(url, contentType) {
  return /(?:\.json|\.manifest|\.dmanifest|\.projectc|\.dmloader)(?:\.(?:br|gz))?$/i.test(new URL(url).pathname) || /json|manifest|text\/plain/i.test(contentType);
}

function collectJsonAssetReferences(bytes, baseUrl) {
  const text = bytes.toString('utf8');
  if (text.length > 2_000_000) return [];
  try {
    const parsed = JSON.parse(text);
    const refs = [];
    const visit = value => {
      if (typeof value === 'string') {
        if (/\.(?:wasm|data|unityweb|br|gz|arcd|arci|projectc|dmloader|dmwasm|glb|gltf|ktx2?|basis|hdr|env|opus)(?:[?#].*)?$/i.test(value)) {
          const url = resolveReference(value, baseUrl);
          if (url && isAllowedStaticUrl(url.href) && !isBlockedAdOrAnalyticsUrl(url.href)) refs.push({ url: stripFragment(url).href, required: true, evidence: 'unity-or-offline-json-config' });
        }
      } else if (Array.isArray(value)) value.forEach(visit);
      else if (isPlainObject(value)) Object.values(value).forEach(visit);
    };
    visit(parsed);
    return refs;
  } catch { return []; }
}

function looksLikeHttpErrorPage(html) {
  return /<title[^>]*>\s*(?:404|not found|access denied|error|page unavailable)/i.test(html) || /(?:requested URL was not found|error 404|page not found)/i.test(html);
}

function looksLikeHtml(bytes) {
  return /^\s*(?:<!doctype\s+html|<html\b|<head\b|<\?xml[^>]*>\s*<html\b)/i.test(bytes.subarray(0, 4096).toString('utf8'));
}

function mimeEncodingForContent(encoding) {
  const value = (encoding || 'identity').toLowerCase();
  if (value === 'identity') return { sourceContentEncoding: value, artifactContentEncoding: value };
  return { sourceContentEncoding: value, artifactContentEncoding: value };
}

function makeArtifactTransforms(pkg, file, bytes, bridgeBytes, localBySourceUrl, allFiles) {
  const warnings = [];
  const mods = [];
  const type = file.contentType || mimeFor(file.url);
  let transformed = bytes;
  const extension = assetTextExtension(file.path);
  if (TEXT_EXTENSIONS.has(extension)) {
    const contentEncoding = file.contentEncoding || 'identity';
    const entityBytes = contentEncoding !== 'identity' ? decodeContentEncoding(transformed, contentEncoding) : transformed;
    const textBytes = normalizeCloudflareAnalytics(entityBytes, type);
    if (!textBytes.equals(entityBytes)) mods.push('Normalized per-request Cloudflare analytics beacon tags before artifact generation.');
    let text = textBytes.toString('utf8');
    if ((extension === '.html' || extension === '.htm') && file.path === requiredEntryPath(pkg) && pkg.removeShellRedirectScriptUrl) {
      const result = shellRedirectRemoved(text, pkg.removeShellRedirectScriptUrl);
      text = result.html;
      if (result.removed) mods.push(`Removed the documented one-script source-shell redirect: ${pkg.removeShellRedirectScriptUrl}`);
    }
    const fileUrl = file.finalUrl || file.url;
    const resolveLocalUrl = (value, baseValue, options = {}) => {
      const normalized = normalizeReference(value).replace(/\\u002[fF]/g, '/').replace(/\\x2[fF]/g, '/');
      const ref = resolveReference(normalized, baseValue);
      if (!ref) return null;
      const hash = ref.hash;
      const query = ref.search;
      ref.hash = '';
      ref.search = '';
      const sourceKey = canonicalSourceUrl(ref.href);
      const mappedPath = localBySourceUrl.get(sourceKey);
      if (!mappedPath) return null;
      if (options.onlyStatic && !isAllowedStaticUrl(ref.href)) return null;
      const local = path.posix.relative(path.posix.dirname(file.path), mappedPath) || path.posix.basename(mappedPath);
      const prefix = local.startsWith('.') ? local : `./${local}`;
      return `${encodeLocalPath(prefix)}${query}${hash}`;
    };
    if (extension === '.html' || extension === '.htm') {
      text = htmlTagAttributeRewrite(text, fileUrl, resolveLocalUrl);
      text = text.replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi, (all, attrs, css) => `<style${attrs}>${rewriteTextReferences(css, '.css', fileUrl, resolveLocalUrl)}</style>`);
      text = text.replace(/<script\b(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script\s*>/gi, (all, attrs, script) => {
        const type = /\btype\s*=\s*(["'])(.*?)\1/i.exec(attrs)?.[2]?.toLowerCase() || '';
        const scriptExt = /json/.test(type) ? '.json' : '.js';
        return `<script${attrs}>${rewriteTextReferences(script, scriptExt, fileUrl, resolveLocalUrl)}</script>`;
      });
      const bridgeLocal = path.posix.relative(path.posix.dirname(file.path), 'bridge.js') || 'bridge.js';
      const bridgeRef = bridgeLocal.startsWith('.') ? bridgeLocal : `./${bridgeLocal}`;
      if (/<head\b[^>]*>/i.test(text)) {
        text = text.replace(/<head\b[^>]*>/i, head => `${head}\n<script src="${encodeLocalPath(bridgeRef)}"></script>`);
        mods.push(`Injected local arcade/audio bridge before game scripts in ${file.path}.`);
      } else if (file.path === requiredEntryPath(pkg)) {
        throw new Error(`Required HTML has no <head> for bridge injection: ${pkg.slug}/${file.path}`);
      } else mods.push(`Preserved non-entry HTML without head: ${file.path}`);
    } else text = rewriteTextReferences(text, extension, fileUrl, resolveLocalUrl);
    transformed = encodeContentEncoding(Buffer.from(text, 'utf8'), contentEncoding);
  } else {
    transformed = normalizeCloudflareAnalytics(bytes, type);
    if (!transformed.equals(bytes)) mods.push('Normalized per-request Cloudflare analytics beacon tags before artifact generation.');
  }
  if (file.path.endsWith('.br') || file.path.endsWith('.gz') || file.path.endsWith('.unityweb')) {
    const encoding = (file.contentEncoding || 'identity').toLowerCase();
    if (encoding !== 'identity') warnings.push(`Raw compressed transfer bytes were pinned; preserve response Content-Encoding: ${encoding} for ${file.path}.`);
  }
  if (file.required && transformed.length === 0) throw new Error(`Required source file is empty: ${pkg.slug}/${file.path}`);
  const outputFile = { ...file, sha256: sha256(transformed), size: transformed.length, appliedChanges: mods, headers: mimeEncodingForContent(file.contentEncoding) };
  return { bytes: transformed, outputFile, warnings, mods };
}

function canonicalSourceUrl(value) {
  const url = new URL(value);
  url.search = '';
  url.hash = '';
  return url.href;
}

function encodeLocalPath(value) {
  return value.split('/').map((part, index) => index === 0 && part.startsWith('.') ? part : encodeURIComponent(part)).join('/');
}

async function cachedOriginal(pkg, file) {
  const target = path.join(CACHE_ROOT, pkg.slug, ...file.path.split('/'));
  inside(path.join(CACHE_ROOT, pkg.slug), target, 'cache');
  try {
    const bytes = await readFile(target);
    if (bytes.length !== file.sourceSize || sha256(bytes) !== file.sourceSha256) return null;
    return bytes;
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function downloadPinnedFile(pkg, file) {
  const cached = await cachedOriginal(pkg, file);
  if (cached) return cached;
  const response = await fetchRaw(file.url);
  if (response.status < 200 || response.status >= 300) throw new Error(`Pinned download failed for ${pkg.slug}/${file.path}: HTTP ${response.status}`);
  const actualWireEncoding = String(response.headers['content-encoding'] || 'identity').toLowerCase();
  const normalized = canonicalizeSourceResponse(response.bytes, actualWireEncoding, file.contentType, file.contentEncoding || 'identity').pinnedBytes;
  const sourceSha = sha256(normalized);
  if (normalized.length !== file.sourceSize || sourceSha !== file.sourceSha256) throw new Error(`Source pin mismatch for ${pkg.slug}/${file.path}: expected ${file.sourceSize}/${file.sourceSha256}, got ${normalized.length}/${sourceSha}`);
  const target = path.join(CACHE_ROOT, pkg.slug, ...file.path.split('/'));
  inside(path.join(CACHE_ROOT, pkg.slug), target, 'cache');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, normalized);
  return normalized;
}

function packageMeta(manifest, pkg, files, warnings, errors, modifications) {
  return {
    title: pkg.title,
    slug: pkg.slug,
    reference: pkg.reference || null,
    entryUrl: pkg.entryUrl,
    assetBaseUrl: pkg.assetBaseUrl || pkg.entryUrl,
    source: pkg.source || null,
    revision: pkg.revision || null,
    authorization: pkg.authorization || manifest.authorization || 'Owner-reported authorization to use supplied content; source notices and terms are preserved where present.',
    sourceFiles: files.length,
    sourceBytes: files.reduce((sum, file) => sum + file.sourceSize, 0),
    artifactFiles: files.length + 1,
    artifactBytes: files.reduce((sum, file) => sum + file.size, 0),
    sourceNotices: pkg.sourceNotices || [],
    externalDependencies: pkg.externalDependencies || [],
    runtimeAudit: pkg.runtimeAudit || null,
    warnings,
    errors,
    appliedChanges: modifications,
    gameplayQa: 'Not performed; manual gameplay QA is left to the user.',
  };
}

async function ensurePackageOutputAllowed(pkg) {
  const target = path.join(OUTPUT_ROOT, pkg.slug);
  inside(OUTPUT_ROOT, target, 'output');
  try {
    const existing = JSON.parse(await readFile(path.join(target, 'source-manifest.json'), 'utf8'));
    if (existing.slug !== pkg.slug || existing.referencePackageManifest !== true) throw new Error(`Refusing to replace unmarked archive directory: ${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    try { await stat(target); throw new Error(`Refusing to replace unmarked archive directory: ${target}`); }
    catch (statError) { if (statError.code !== 'ENOENT') throw statError; }
  }
  return target;
}

async function recordMode() {
  const manifest = await readJson(SOURCE_FILE);
  if (!Array.isArray(manifest.packages)) manifest.packages = [];
  manifest.audit ||= path.relative(ROOT, AUDIT_FALLBACK);
  const auditPath = path.resolve(ROOT, manifest.audit);
  let audit;
  try { audit = await readJson(auditPath); }
  catch (error) { throw new Error(`Cannot read runtime audit ${auditPath}: ${error.message}`); }
  trustAudit(audit);
  const seeds = chooseAuditPackageSeeds(audit, manifest.omissions || []);
  if (seeds.length) {
    const existing = new Map(manifest.packages.map(pkg => [pkg.slug, pkg]));
    for (const seed of seeds) {
      const prior = existing.get(seed.slug);
      if (!prior) {
        manifest.packages.push(seed);
        existing.set(seed.slug, seed);
      } else {
        if (prior.entryUrl && prior.entryUrl !== seed.entryUrl) throw new Error(`Pinned entry URL no longer matches the runtime audit for ${seed.slug}.`);
        Object.assign(prior, { ...seed, ...prior, runtimeAudit: { ...(prior.runtimeAudit || {}), ...(seed.runtimeAudit || {}) } });
      }
    }
  }
  if (!manifest.packages.length) throw new Error('No local package sources are configured in scripts/reference-package-sources.json or the runtime audit.');
  if (manifest.packages.length !== manifest.expectedPackageCount) throw new Error(`Runtime audit produced ${seeds.length} eligible packages and ${manifest.packages.length} total pins; expected ${manifest.expectedPackageCount}. Review the audit/exclusion list before downloading.`);
  manifest.maxTotalBytes = Number(manifest.maxTotalBytes) || 3_000_000_000;
  manifest.maxFileBytes = Number(manifest.maxFileBytes) || 200_000_000;
  manifest.rewriteVersion = REWRITE_VERSION;
  manifest.cacheRoot = path.relative(ROOT, CACHE_ROOT);
  manifest.outputRoot = path.relative(ROOT, OUTPUT_ROOT);
  manifest.unityAssets = Array.isArray(audit.unityAssets) ? audit.unityAssets : manifest.unityAssets || [];
  if (manifest.unityAssetAudit) {
    try {
      const unityAudit = await readJson(path.resolve(ROOT, manifest.unityAssetAudit));
      manifest.unityAssets = unityAudit.records || unityAudit.assets || unityAudit;
      trustAudit(null, unityAudit);
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Cannot read Unity asset audit: ${error.message}`);
    }
  }
  if (Array.isArray(manifest.unityAssets)) {
    const unityBySlug = new Map(manifest.unityAssets.filter(isPlainObject).map(item => [item.slug, item]));
    for (const pkg of manifest.packages) {
      const unity = unityBySlug.get(pkg.slug);
      if (unity && !pkg.unity) pkg.unity = unity;
    }
  }
  const byAudit = new Map(seeds.map(pkg => [pkg.slug, pkg]));
  for (const pkg of manifest.packages) {
    const audited = byAudit.get(pkg.slug);
    if (audited) Object.assign(pkg, { ...audited, ...pkg });
  }
  await atomicJson(SOURCE_FILE, manifest);
  const validReady = new Set();
  for (const pkg of manifest.packages) {
    if (!pkg.ready || !Array.isArray(pkg.files) || !pkg.files.length) continue;
    let valid = true;
    for (const file of pkg.files) {
      if (!safeRelative(file.path) || !/^[a-f0-9]{64}$/i.test(file.sourceSha256 || '') || !Number.isSafeInteger(file.sourceSize) || !/^[a-f0-9]{64}$/i.test(file.sha256 || '') || !Number.isSafeInteger(file.size)) { valid = false; break; }
    }
    const sourceSizeTotal = pkg.files.reduce((sum, file) => sum + file.sourceSize, 0);
    const uniquePaths = new Set(pkg.files.map(file => file.path));
    if (valid && pkg.files.length === pkg.totalFiles && sourceSizeTotal === pkg.totalSourceBytes && uniquePaths.size === pkg.files.length && pkg.files.some(file => file.path === requiredEntryPath(pkg))) validReady.add(pkg.slug);
  }
  let checkpoint = Promise.resolve();
  const totalUsed = { value: manifest.packages.filter(pkg => validReady.has(pkg.slug)).reduce((sum, pkg) => sum + (pkg.totalSourceBytes || pkg.files.reduce((n, file) => n + file.sourceSize, 0)), 0) };
  const pending = manifest.packages.filter(pkg => !validReady.has(pkg.slug));
  await mapLimit(pending, PACKAGE_CONCURRENCY, async pkg => {
    console.log(`[record:${pkg.slug}] starting ${pkg.entryUrl}`);
    try {
      const result = await scanPackage(pkg, totalUsed);
      pkg.files = result.files.map(file => ({ ...file, sha256: file.sourceSha256, size: file.sourceSize, appliedChanges: [] }));
      pkg.totalFiles = pkg.files.length;
      pkg.totalSourceBytes = result.sourceBytes;
      pkg.ready = result.errors.length === 0 && pkg.files.some(file => file.path === requiredEntryPath(pkg));
      pkg.errors = result.errors;
      pkg.warnings = result.warnings;
      pkg.appliedChanges = result.modifications;
      pkg.auditRef = manifest.audit;
      if (pkg.ready) console.log(`[record:${pkg.slug}] pinned ${pkg.totalFiles} files / ${pkg.totalSourceBytes} bytes`);
      else console.error(`[record:${pkg.slug}] not ready: ${result.errors[0] || 'entry page missing'}`);
      checkpoint = checkpoint.then(() => atomicJson(SOURCE_FILE, manifest));
      await checkpoint;
      if (!pkg.ready) return;
    } catch (error) {
      pkg.ready = false;
      if (!pkg.errors?.includes(error.message)) pkg.errors = [...(pkg.errors || []), error.message];
      checkpoint = checkpoint.then(() => atomicJson(SOURCE_FILE, manifest));
      await checkpoint;
      console.error(`[record:${pkg.slug}] not ready: ${error.message}`);
    }
  });
  manifest.totalFiles = manifest.packages.reduce((sum, pkg) => sum + (pkg.files?.length || 0), 0);
  manifest.totalBytes = manifest.packages.reduce((sum, pkg) => sum + (pkg.totalSourceBytes || 0), 0);
  await atomicJson(SOURCE_FILE, manifest);
  const readyCount = manifest.packages.filter(pkg => pkg.ready).length;
  console.log(`Recorded ${readyCount}/${manifest.packages.length} reference packages (${manifest.totalFiles} files, ${manifest.totalBytes} bytes).`);
  if (readyCount !== manifest.expectedPackageCount) throw new Error(`${manifest.packages.length - readyCount} required reference packages are not ready; inspect per-package errors in the checkpoint.`);
}

async function buildMode(selectedSlugs = null) {
  const fullManifest = await readJson(SOURCE_FILE);
  // An explicitly selected batch can ship independently of other incomplete records.
  const manifest = selectedSlugs
    ? { ...fullManifest, packages: fullManifest.packages.filter(pkg => selectedSlugs.includes(pkg.slug)) }
    : fullManifest;
  assertSourceManifest(manifest);
  trustManifestSourceUrls(manifest);
  const selected = selectedSlugs ? new Set(selectedSlugs) : null;
  if (selected && (selected.size !== selectedSlugs.length || ![...selected].every(safeSlug))) throw new Error('Invalid or duplicate selected package slugs.');
  const ready = manifest.packages.filter(pkg => pkg.ready && (!selected || selected.has(pkg.slug)));
  if (selected && ready.length !== selected.size) throw new Error(`Only ${ready.length}/${selected.size} selected packages are pinned and ready.`);
  if (!selected && (ready.length !== manifest.expectedPackageCount || manifest.packages.length !== manifest.expectedPackageCount)) throw new Error(`Only ${ready.length}/${manifest.expectedPackageCount} reference packages are pinned and ready.`);
  if (!ready.length) throw new Error('No ready pinned reference packages are available to build.');
  const totalBytes = ready.reduce((sum, pkg) => sum + pkg.files.reduce((n, file) => n + file.sourceSize, 0), 0);
  if (totalBytes > manifest.maxTotalBytes) throw new Error(`Aggregate source payload ${totalBytes} exceeds ${manifest.maxTotalBytes} bytes.`);
  const bridgeBytes = await readFile(BRIDGE_FILE);
  if (!bridgeBytes.length) throw new Error('Local arcade bridge is empty.');
  const bridgeSha256 = sha256(bridgeBytes);
  const summary = [];
  for (let offset = 0; offset < ready.length; offset += PACKAGE_CONCURRENCY) {
    const batch = ready.slice(offset, offset + PACKAGE_CONCURRENCY);
    await Promise.all(batch.map(async pkg => {
      const originalByPath = new Map();
      const localBySourceUrl = new Map();
      for (const file of pkg.files) {
        if (!file.required && ['.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.json'].includes(path.posix.extname(file.path).toLowerCase())) {
          // optional text assets are still fetched and rewritten; requirement status controls only record failures.
        }
        const bytes = await downloadPinnedFile(pkg, file);
        originalByPath.set(file.path, bytes);
        localBySourceUrl.set(canonicalSourceUrl(file.url), file.path);
        if (file.finalUrl) localBySourceUrl.set(canonicalSourceUrl(file.finalUrl), file.path);
      }
      const targetRoot = await ensurePackageOutputAllowed(pkg);
      const staging = `${targetRoot}.staging-${process.pid}`;
      await rm(staging, { recursive: true, force: true });
      await mkdir(staging, { recursive: true });
      const artifacts = [];
      const warnings = [...(pkg.warnings || [])];
      const changes = [];
      for (const file of pkg.files) {
        const transformed = makeArtifactTransforms(pkg, file, originalByPath.get(file.path), bridgeBytes, localBySourceUrl, pkg.files);
        warnings.push(...transformed.warnings);
        changes.push(...transformed.mods);
        const target = path.join(staging, ...file.path.split('/'));
        inside(staging, target, 'package output');
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, transformed.bytes);
        const verify = await readFile(target);
        if (verify.length !== transformed.outputFile.size || sha256(verify) !== transformed.outputFile.sha256) throw new Error(`Artifact hash mismatch after write: ${pkg.slug}/${file.path}`);
        artifacts.push(transformed.outputFile);
      }
      await copyFile(BRIDGE_FILE, path.join(staging, 'bridge.js'));
      if (sha256(await readFile(path.join(staging, 'bridge.js'))) !== bridgeSha256) throw new Error(`Arcade bridge copy hash mismatch: ${pkg.slug}`);
      const entry = artifacts.find(file => file.path === requiredEntryPath(pkg));
      if (!entry) throw new Error(`Required entry missing from ready package ${pkg.slug}`);
      const metadata = {
        referencePackageManifest: true,
        ...packageMeta(manifest, pkg, artifacts, warnings, [], changes),
        sourceEntry: entry.path,
        sourceEntryUrl: pkg.entryUrl,
        sourceEntrySha256: entry.sourceSha256,
        bridge: { path: 'bridge.js', sha256: bridgeSha256, copied: true },
        runtimeSecurity: { hostCsp: 'Archive-host CSP restricts script/connect/image/media to same-origin plus data/blob; no visitor-side package downloads or remote asset proxy.', advertisingAnalytics: 'Known advertising/analytics scripts and Cloudflare per-request beacon tags are removed/normalized; remaining external connections are blocked by archive CSP.', externalRuntimeServices: pkg.externalDependencies || [] },
        contentHeaders: artifacts.filter(file => file.contentEncoding && file.contentEncoding !== 'identity').map(file => ({ path: file.path, contentType: file.contentType, contentEncoding: file.contentEncoding })),
        files: artifacts,
      };
      await writeFile(path.join(staging, 'source-manifest.json'), `${JSON.stringify(metadata, null, 2)}\n`);
      await rm(targetRoot, { recursive: true, force: true });
      await rename(staging, targetRoot);
      summary.push({ slug: pkg.slug, files: artifacts.length, sourceBytes: pkg.totalSourceBytes, artifactBytes: artifacts.reduce((sum, file) => sum + file.size, 0), warnings: warnings.length });
    }));
  }
  console.log(JSON.stringify({ packages: summary.sort((a, b) => a.slug.localeCompare(b.slug)), sourceFiles: ready.reduce((sum, pkg) => sum + pkg.files.length, 0), sourceBytes: totalBytes, cache: CACHE_ROOT, output: OUTPUT_ROOT }, null, 2));
}

async function encodingSelfCheck() {
  const sourceUrl = 'https://watchdocumentaries.com/wp-content/uploads/games/check/index.html';
  const markup = '<!doctype html><html><head><script data-cf-beacon="ray-alpha"></script></head><body><main>fixture</main></body></html>';
  const changedRequestMarkup = markup.replace('ray-alpha', 'ray-beta');
  const pinned = canonicalizeSourceResponse(gzipSync(Buffer.from(markup), { mtime: 0 }), 'gzip', 'text/html', 'gzip').pinnedBytes;
  const cleanFetchPin = canonicalizeSourceResponse(gzipSync(Buffer.from(changedRequestMarkup), { mtime: 0 }), 'gzip', 'text/html', 'gzip').pinnedBytes;
  if (sha256(pinned) !== sha256(cleanFetchPin) || pinned.length !== cleanFetchPin.length) throw new Error('Clean-cache compressed source normalization did not reproduce the source pin.');
  const pkg = { slug: 'encoding-self-check', entryPath: 'index.html' };
  const file = { path: 'index.html', url: sourceUrl, finalUrl: sourceUrl, sourceSha256: sha256(pinned), sourceSize: pinned.length, contentType: 'text/html', contentEncoding: 'gzip', wireContentEncoding: 'gzip', required: true };
  const bridge = Buffer.from('window.__sidequestBridgeFixture=true;');
  const artifact = makeArtifactTransforms(pkg, file, cleanFetchPin, bridge, new Map(), []).bytes;
  const decodedArtifact = gunzipSync(artifact).toString('utf8');
  if (!decodedArtifact.includes('src="./bridge.js"') || decodedArtifact.includes('data-cf-beacon')) throw new Error('Compressed HTML artifact transform did not preserve bridge injection and beacon normalization.');
  const brotliPin = canonicalizeSourceResponse(brotliCompressSync(Buffer.from(markup)), 'br', 'text/html', 'br').pinnedBytes;
  const brotliRefetch = canonicalizeSourceResponse(brotliCompressSync(Buffer.from(changedRequestMarkup)), 'br', 'text/html', 'br').pinnedBytes;
  if (sha256(brotliPin) !== sha256(brotliRefetch)) throw new Error('Clean-cache Brotli source normalization did not reproduce the source pin.');
  const brotliFile = { ...file, sourceSha256: sha256(brotliPin), sourceSize: brotliPin.length, contentEncoding: 'br', wireContentEncoding: 'br' };
  const brotliArtifact = makeArtifactTransforms(pkg, brotliFile, brotliRefetch, bridge, new Map(), []).bytes;
  if (!brotliDecompressSync(brotliArtifact).toString('utf8').includes('src="./bridge.js"')) throw new Error('Brotli HTML artifact bridge rewrite failed.');
  const packageRoot = { slug: 'encoding-self-check', entryPath: 'index.html', files: [file] };
  const jsUrl = 'https://watchdocumentaries.com/wp-content/uploads/games/check/Build/loader.js';
  const dataUrl = 'https://watchdocumentaries.com/wp-content/uploads/games/check/Build/game.data';
  const jsSource = 'const dataURL="game.data";';
  const jsPin = canonicalizeSourceResponse(gzipSync(Buffer.from(jsSource), { mtime: 0 }), 'gzip', 'text/javascript', 'gzip').pinnedBytes;
  const jsFile = { path: 'Build/loader.js', url: jsUrl, finalUrl: jsUrl, sourceSha256: sha256(jsPin), sourceSize: jsPin.length, contentType: 'text/javascript', contentEncoding: 'gzip', wireContentEncoding: 'gzip', required: true };
  const urls = new Map([[canonicalSourceUrl(dataUrl), 'Build/game.data']]);
  const jsArtifact = makeArtifactTransforms(packageRoot, jsFile, jsPin, bridge, urls, []).bytes;
  if (!gunzipSync(jsArtifact).toString('utf8').includes('./game.data')) throw new Error('Compressed JavaScript local URL rewrite did not survive source decode and artifact re-encoding.');
  if (isPublicIp('::ffff:7f00:1') || !isPublicIp('::ffff:808:808')) throw new Error('IPv4-mapped IPv6 public/private validation failed.');
  if (resolveReference('//', sourceUrl) !== null || resolveReference('///', sourceUrl) !== null) throw new Error('Malformed protocol-relative asset URL must be ignored.');
  console.log(JSON.stringify({ check: 'compressed-source-pin-and-artifact-rewrite', encodings: ['gzip', 'br'], mappedIpGuard: 'passed', normalizedSourceSha256: sha256(pinned), htmlArtifactSha256: sha256(artifact), brotliHtmlArtifactSha256: sha256(brotliArtifact), javascriptArtifactSha256: sha256(jsArtifact) }, null, 2));
}

async function mapLimit(items, limit, callback) {
  let cursor = 0;
  const errors = [];
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { await callback(items[index]); }
      catch (error) { errors.push(error); return; }
    }
  }));
  if (errors.length) throw errors[0];
}

const arg = process.argv[2];
if (arg === '--record') await recordMode();
else if (arg === undefined || arg === '--build') await buildMode();
else if (arg === '--build-selected') {
  if (!process.argv[3]) throw new Error('Pass comma-separated pinned game slugs for --build-selected.');
  await buildMode(process.argv[3].split(','));
}
else if (arg === '--self-check') await encodingSelfCheck();
else throw new Error(`Usage: node scripts/prepare-reference-packages.mjs [--record|--build]`);
