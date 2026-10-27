import paths from './archive-paths.json';
export const archiveOrigin='https://browser-game-arcade-dxbavg-7923s-projects.vercel.app';
export const archivePaths:readonly string[]=paths;
export function isSidequestArchive(url:string){try{const parsed=new URL(url);return parsed.origin===archiveOrigin&&!parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash&&archivePaths.some(path=>path===parsed.pathname)}catch{return false}}
