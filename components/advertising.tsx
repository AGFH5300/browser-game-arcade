import Script from 'next/script';
export function Advertising({position}:{position:'left'|'right'|'bottom'}){
 const enabled=process.env.AD_PLACEHOLDERS!=='false'&&process.env[`AD_${position.toUpperCase()}_ENABLED`]!=='false';
 if(!enabled||process.env.ADSENSE_ENABLED==='true')return null;
 return <aside className={`advertisement ad-${position}`} aria-label={`${position} advertisement`}><span>ADVERTISEMENT</span><div>{position==='bottom'?'728 × 90':'160 × 600'}</div><small>Advertising space</small></aside>;
}
export function AdsenseScript(){
 const client=process.env.ADSENSE_CLIENT;
 if(process.env.ADSENSE_ENABLED!=='true'||process.env.ADSENSE_CMP_READY!=='true'||!client||!/^ca-pub-\d{16}$/.test(client))return null;
 return <Script id="sidequest-adsense" async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}/>;
}
