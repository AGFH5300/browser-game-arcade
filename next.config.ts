import type {NextConfig} from 'next';
const common=[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}];
const preview=process.env.VERCEL_URL&&/^[a-z0-9.-]+$/.test(process.env.VERCEL_URL)?` https://${process.env.VERCEL_URL}`:'';
const config:NextConfig={poweredByHeader:false,async headers(){return [
 {source:'/:path((?!play/archives/).*)',headers:[...common,{key:'X-Frame-Options',value:'SAMEORIGIN'}]},
 {source:'/play/:path((?!archives/).*)',headers:[{key:'Cache-Control',value:'public, max-age=86400'},{key:'Access-Control-Allow-Origin',value:'*'},{key:'Content-Security-Policy',value:"frame-ancestors 'self'; object-src 'none'; base-uri 'self'"}]},
 {source:'/play/archives/:path*',headers:[...common,{key:'Cache-Control',value:'public, max-age=3600'},{key:'Access-Control-Allow-Origin',value:'*'},{key:'Content-Security-Policy',value:`default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://browser-game-arcade.vercel.app${preview}`}]}
 ]}};export default config;
