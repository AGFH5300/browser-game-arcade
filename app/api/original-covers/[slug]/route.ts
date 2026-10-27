import {originalCovers,referenceCovers} from '@/lib/carlwalks-covers';

// Only fixed upstream game cover URLs are fetchable: no visitor-controlled URL,
// redirects, or arbitrary host lookup.
export const runtime='nodejs';
export const revalidate=604800;

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!Object.hasOwn(originalCovers,slug)&&!Object.hasOwn(referenceCovers,slug))return new Response('Not found',{status:404});
  const cover=originalCovers[slug]??referenceCovers[slug];
  try{
    const response=await fetch(cover.url,{redirect:'error',next:{revalidate:604800},headers:{'Accept':'image/avif,image/webp,image/png,image/jpeg;q=0.9'}});
    if(!response.ok)return new Response('Image unavailable',{status:502});
    const mime=response.headers.get('content-type')?.split(';')[0]||'';
    if(mime!==cover.mime)return new Response('Unexpected image type',{status:502});
    const size=Number(response.headers.get('content-length')||0);
    if(size>2_000_000)return new Response('Image too large',{status:502});
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>2_000_000)return new Response('Image too large',{status:502});
    return new Response(bytes,{headers:{
      'Content-Type':cover.mime,
      'Cache-Control':'public,max-age=86400,s-maxage=604800,stale-while-revalidate=2592000',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'none'; sandbox"
    }});
  }catch{return new Response('Image temporarily unavailable',{status:502})}
}

