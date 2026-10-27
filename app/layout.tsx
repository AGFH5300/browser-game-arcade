import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'Sidequest — Free Browser Games',description:'Find your next little obsession. Play free browser games instantly.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
