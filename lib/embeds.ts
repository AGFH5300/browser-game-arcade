import referenceEntrypoints from '../data/reference-entrypoints.json';
import {isSidequestArchive} from './game-archives';
export type TrustedPublisher = {
  name:string;
  privacyUrl: string;
  disclosure: string;
  externalOnly?: boolean;
};

const carlwalksGamePaths = [
  'polytrack-0.3.1',
  'moto-x3m',
  'slope',
  'moto-x3m-2',
  'moto-x3m-3',
  'crossy-road',
  'fnaf',
] as const;

/** Fixed game entrypoints, not arbitrary CarlWalks pages or redirect URLs. */
export const carlwalksGameUrls = carlwalksGamePaths.map(
  path => `https://carlwalks.com/build_engine/root/${path}/index.html`
);
const archivedGames: [string, TrustedPublisher][] = carlwalksGameUrls.map(url => [url, {
  name: 'CarlWalks archive',
  privacyUrl: 'https://www.carlwalks.com/',
  disclosure: 'The original game build is loaded inside this page from the CarlWalks game archive.',
}]);

const publishers = new Map<string, TrustedPublisher>([
  // These exact paths are listed as public iframe embed URLs on each Miniplay game page.
  // Do not allow arbitrary paths/query strings or silently proxy their traffic.
  ...([
    ['https://www.miniplay.com/embed/skribbl-io','Skribbl.io'],
    ['https://www.miniplay.com/embed/tag','TAG'],
  ] as const).map(([url,title]):[string,TrustedPublisher]=>[url,{
    name: 'Miniplay',
    privacyUrl: 'https://www.miniplay.com/privacy',
    disclosure: title+' is loaded from the reviewed Miniplay iframe endpoint. Network filtering or provider changes may prevent it from loading; the original creator link remains available.',
  }]),

  ['https://skribbl.io/', {
    name: 'Skribbl.io', privacyUrl: 'https://skribbl.io/', externalOnly: true,
    disclosure: 'Official third-party multiplayer or geography game; Sidequest opens the creator website in a new tab without embedding or copying its content.',
  }],
  ['https://poki.com/en/g/tag', {
    name: 'Poki', privacyUrl: 'https://poki.com/en/g/tag', externalOnly: true,
    disclosure: 'Official third-party multiplayer or geography game; Sidequest opens the creator website in a new tab without embedding or copying its content.',
  }],
  ['https://www.worldguessr.com/', {
    name: 'WorldGuessr', privacyUrl: 'https://www.worldguessr.com/privacy',
    // The user reports publisher permission. This host currently returns no
    // X-Frame-Options / frame-ancestors restriction; keep it publisher-hosted.
    disclosure: 'The user reports permission to embed the publisher-hosted WorldGuessr game; accounts, maps, daily rounds and multiplayer remain with WorldGuessr.',
  }],
  ['https://krillion.io/', {
    name: 'Krillion', privacyUrl: 'https://krillion.io/privacy',
    externalOnly: true,
    disclosure: 'The original Krillion creator disallows third-party embedding. Open its official site in a new tab; Krillion manages scoring, accounts, progress and optional purchases.',
  }],

  ...archivedGames,
  ...referenceEntrypoints.map((url):[string,TrustedPublisher]=>[url,{
    name:url.includes('miniplay.com')?'MiniPlay':url.includes('dashnet.org')?'DashNet / Orteil':'Game provider',privacyUrl:new URL(url).origin,
    // Orteil sends X-Frame-Options: SAMEORIGIN for Cookie Clicker. A blank
    // iframe cannot be repaired by Sidequest or an iframe sandbox setting.
    externalOnly:url==='https://orteil.dashnet.org/cookieclicker/',
    disclosure:url==='https://orteil.dashnet.org/cookieclicker/'
      ? 'The creator restricts cross-site embedding; open the official game in a separate tab.'
      : 'This game runs here through its external provider. The provider controls availability, cookies and in-game advertising.',
  }]),
  ['https://y8.com/embed/slope', {
    name: 'Y8', privacyUrl: 'https://www.y8.com/cookie-policy',
    disclosure: 'This game is provided by Y8. The publisher may use cookies and show ads.',
  }],
  ['https://y8.com/embed/moto_x3m_2', {
    name: 'Y8', privacyUrl: 'https://www.y8.com/cookie-policy',
    disclosure: 'This game is provided by Y8. The publisher may use cookies and show ads.',
  }],
  ['https://y8.com/embed/moto_x3m_3', {
    name: 'Y8', privacyUrl: 'https://www.y8.com/cookie-policy',
    disclosure: 'This game is provided by Y8. The publisher may use cookies and show ads.',
  }],
  ['https://play.famobi.com/moto-x3m/A1000-11', {
    externalOnly: true, name: 'Famobi', privacyUrl: 'https://famobi.com/privacy/?locale=en',
    disclosure: 'This game is provided by Famobi. The publisher may use cookies and display ads.',
  }],
]);

export function getTrustedPublisher(url: string): TrustedPublisher | null {
  return publishers.get(url) ?? null;
}

export function isAllowedEmbedUrl(url: string, configuredHosts = process.env.EMBED_ALLOWED_HOSTS ?? ''): boolean {
  if(url==='/play/deep-dive/index.html'||url==='/play/deep-dive/index-arcade.html'||url==='/play/deep-dive/index-public-art.html')return true;
  if (getTrustedPublisher(url)||isSidequestArchive(url)) return true;
  try {
    const parsed = new URL(url);
    const hosts = configuredHosts.split(',').map(host => host.trim().toLowerCase()).filter(Boolean);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && hosts.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

const isolatedSandbox = 'allow-scripts allow-pointer-lock';
const publisherSandbox = `${isolatedSandbox} allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms`;

export function getEmbedSandbox(url: string): string {
  // Our own native Deep Dive game needs same-origin access to its private
  // Sidequest multiplayer API and browser-local save data. Do not grant this
  // privilege to external, unknown, or user-provided game URLs.
  if(url==='/play/deep-dive/index.html'||url==='/play/deep-dive/index-arcade.html'||url==='/play/deep-dive/index-public-art.html')return publisherSandbox;
  return getTrustedPublisher(url)||isSidequestArchive(url) ? publisherSandbox : isolatedSandbox;
}

