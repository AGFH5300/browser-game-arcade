export const archiveOrigin='https://browser-game-arcade-dxbavg-7923s-projects.vercel.app';
export const archivePaths=['/play/archives/moto-x3m-2/index.html'] as const;
export function isSidequestArchive(url:string){try{const parsed=new URL(url);return parsed.origin===archiveOrigin&&!parsed.search&&!parsed.hash&&archivePaths.some(path=>path===parsed.pathname)}catch{return false}}
