import './globals.css';
import type { Metadata } from 'next';
import {Header,Footer} from '@/components/shell';
const origin=process.env.APP_URL||'https://browser-game-arcade-dxbavg-7923s-projects.vercel.app';
export const metadata: Metadata={metadataBase:new URL(origin),title:{default:'Sidequest — Free Browser Games',template:'%s · Sidequest'},description:'Find your next little obsession. Play free browser games instantly.',icons:{icon:'/icon.svg'},openGraph:{type:'website',title:'Sidequest — Free Browser Games',description:'A little break. A new high score.',images:['/og.png']},alternates:{canonical:'/'}};
const themeScript=`try{let t=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;matchMedia('(prefers-color-scheme: light)').addEventListener('change',e=>{if(localStorage.getItem('theme')==='system')document.documentElement.dataset.theme=e.matches?'light':'dark'})}catch{}`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-theme="dark" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:themeScript}}/><a className="skip-link" href="#content">Skip to content</a><Header/><div id="content">{children}</div><Footer/></body></html>}
