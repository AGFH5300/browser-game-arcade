import type {NextConfig} from 'next';

// Archived game scripts need their original origin for storage and asset fetches.
// They are embedded from a separate Sidequest-owned Vercel hostname, never the
// administration hostname. Only this static archive path can be framed cross-origin.
const securityHeaders=[
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}
];
const config:NextConfig={
 poweredByHeader:false,
 async headers(){return [
  {source:'/:path((?!play/archives/).*)',headers:[...securityHeaders,{key:'X-Frame-Options',value:'SAMEORIGIN'}]},
  {source:'/play/:path*',headers:[
    {key:'Cache-Control',value:'public, max-age=86400'},
    {key:'Access-Control-Allow-Origin',value:'*'},
    {key:'Content-Security-Policy',value:"frame-ancestors 'self'; object-src 'none'; base-uri 'self'"}
  ]},
  {source:'/play/archives/:path*',headers:[
    ...securityHeaders,
    {key:'Content-Security-Policy',value:"frame-ancestors https://browser-game-arcade.vercel.app https://*.dxbavg-7923s-projects.vercel.app; object-src 'none'; base-uri 'self'"}
  ]}
 ]}
};
export default config;
