import {NextRequest,NextResponse} from 'next/server';
const archiveHost='browser-game-arcade-dxbavg-7923s-projects.vercel.app';
export function proxy(req:NextRequest){
 if(req.nextUrl.hostname===archiveHost && !req.nextUrl.pathname.startsWith('/play/archives/') && req.nextUrl.pathname!=='/play/arcade-bridge.js')return new NextResponse('Game assets only',{status:404});
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image).*)']};
