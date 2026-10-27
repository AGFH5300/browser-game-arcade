import referenceCoverData from '../data/reference-covers.json';
export const referenceCovers=referenceCoverData as Record<string,{url:string;mime:'image/jpeg'|'image/png';localPath?:string}>;
// Screenshot covers are mapped to their exact CarlWalks card titles, not guessed.
// The site owner has stated permission to reuse these covers. We avoid hotlinking
// in the browser by serving the fixed, source-verified images through our endpoint.
export const originalCovers: Record<string,{url:string;mime:'image/jpeg'|'image/png'}>={
  'polytrack':{url:'https://www.carlwalks.com/gallery_gen/870615022183e0a8e829a6672ec4adc1_782x440_fit.jpg?ts=1741971497',mime:'image/jpeg'},
  'moto-x3m':{url:'https://www.carlwalks.com/gallery_gen/77bf4798f907faefcc7c11c0fd6df895_782x440_fit.jpg?ts=1741971497',mime:'image/jpeg'},
  'slope':{url:'https://www.carlwalks.com/gallery_gen/beb677f119c12f48b32432e4fd91c0bf_782x440_fit.png?ts=1741971497',mime:'image/png'},
  'crossy-road':{url:'https://www.carlwalks.com/gallery_gen/5bb76c924993f7791d43a7224f864102_782x440_fit.jpg?ts=1741971497',mime:'image/jpeg'},
  'fnaf':{url:'https://www.carlwalks.com/gallery_gen/1491d5f7d705c161db09312f7fdc9a79_782x440_fit.jpg?ts=1741971498',mime:'image/jpeg'},
  'moto-x3m-2':{url:'https://www.carlwalks.com/gallery_gen/0566be869ad30dc80b3397d59f07738a_782x440_fit.jpg?ts=1741971498',mime:'image/jpeg'},
  'hextris':{url:'https://www.carlwalks.com/gallery_gen/baf633649945d0bff31bd201c6be788c_782x440_fit.png?ts=1741971498',mime:'image/png'},
  'stack':{url:'https://www.carlwalks.com/gallery_gen/537d440ec372b33b2bfc4c916415b2f6_782x440_fit.png?ts=1741971498',mime:'image/png'},
  'moto-x3m-3':{url:'https://www.carlwalks.com/gallery_gen/37d38607fbfb56606bcc8137d923ff4f_782x440_fit.jpg?ts=1741971499',mime:'image/jpeg'}
};

export function getDisplayCover(slug:string, fallback:string|null):string|null{
  if(Object.hasOwn(originalCovers,slug))return `/api/original-covers/${slug}`;
  return Object.hasOwn(referenceCovers,slug)?referenceCovers[slug].localPath??`/api/original-covers/${slug}`:fallback;
}

