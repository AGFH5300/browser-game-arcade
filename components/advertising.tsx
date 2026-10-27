import Script from 'next/script';

// AdSense Auto ads supplies the real approved side rails and bottom anchor.
// Never render empty advertising placeholders on the public website.
export function Advertising({position}:{position:'left'|'right'|'bottom'}){
  // Optional preview of ad geometry for the developer, never in production.
  const preview=process.env.NODE_ENV!=='production'&&process.env.AD_PREVIEW_PLACEHOLDERS==='true';
  if(!preview||process.env[`AD_${position.toUpperCase()}_ENABLED`]==='false')return null;
  return <aside className={`advertisement ad-${position}`} aria-label={`${position} advertising preview`}><span>ADVERTISEMENT PREVIEW</span><div>{position==='bottom'?'728 × 90':'160 × 600'}</div></aside>;
}
export function AdsenseScript(){
  const client=process.env.ADSENSE_CLIENT;
  if(process.env.ADSENSE_ENABLED!=='true'||process.env.ADSENSE_CMP_READY!=='true'||!client||!/^ca-pub-\d{16}$/.test(client))return null;
  return <Script id="sidequest-adsense" async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}/>;
}
