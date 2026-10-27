import {classicGameEntrypoints} from './classic-sources';

export type TrustedPublisher = {
  name: 'Y8' | 'Famobi' | 'CarlWalks';
  privacyUrl: string;
  disclosure: string;
  externalOnly?: boolean;
};

const publishers = new Map<string, TrustedPublisher>([
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

const approvedOriginals=new Set(Object.values(classicGameEntrypoints));
export function getTrustedPublisher(url: string): TrustedPublisher | null {
  if(approvedOriginals.has(url))return {
    name:'CarlWalks',
    privacyUrl:'https://www.carlwalks.com/',
    disclosure:'This game loads its original, standalone browser build hosted by CarlWalks. Game assets come from that site.',
  };
  return publishers.get(url) ?? null;
}

export function isAllowedEmbedUrl(url: string, configuredHosts = process.env.EMBED_ALLOWED_HOSTS ?? ''): boolean {
  if (getTrustedPublisher(url)) return true;
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
  return getTrustedPublisher(url) ? publisherSandbox : isolatedSandbox;
}
