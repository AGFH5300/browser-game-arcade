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
  ['https://skribbl.io/', {
    name: 'Skribbl.io', privacyUrl: 'https://skribbl.io/', externalOnly: true,
    disclosure: 'Official third-party multiplayer or geography game; Sidequest opens the creator website in a new tab without embedding or copying its content.',
  }],
  ['https://poki.com/en/g/tag', {
    name: 'Poki', privacyUrl: 'https://poki.com/en/g/tag', externalOnly: true,
    disclosure: 'Official third-party multiplayer or geography game; Sidequest opens the creator website in a new tab without embedding or copying its content.',
  }],
  ['https://www.worldguessr.com/', {
    name: 'WorldGuessr', privacyUrl: 'https://www.worldguessr.com/', externalOnly: true,
    disclosure: 'Official third-party multiplayer or geography game; Sidequest opens the creator website in a new tab without embedding or copying its content.',
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
  return getTrustedPublisher(url)||isSidequestArchive(url) ? publisherSandbox : isolatedSandbox;
}

