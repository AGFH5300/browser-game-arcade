import { z } from 'zod';
const text=(max:number)=>z.string().trim().max(max);
export const gameSchema=z.object({
 title:text(120).min(1), slug:text(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description:text(10000), shortDescription:text(280),
 categories:z.array(text(40).min(1)).max(12), tags:z.array(text(40).min(1)).max(24), developer:text(120), engine:z.enum(['html5','iframe','flash']),
 gameUrl:text(2048).min(1), sourceUrl:text(2048), license:text(120), licenseNotes:text(3000), mobile:z.boolean(), controls:text(2000), instructions:text(5000),
 featured:z.boolean(), published:z.boolean(), displayOrder:z.number().int().min(0).max(100000), thumbnailId:z.union([z.string().uuid(),z.string().regex(/^\/covers\/[a-z0-9-]+\.svg$/)]).nullable().optional()
}).superRefine((g,ctx)=>{
 const url=g.gameUrl;
 if (url.startsWith('/play/')) { if (url.includes('..') || /[\\\u0000-\u001f]/.test(url)) ctx.addIssue({code:'custom',path:['gameUrl'],message:'Invalid local game path'}); }
 else { try { const parsed=new URL(url); const hosts=(process.env.EMBED_ALLOWED_HOSTS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean); if(parsed.protocol!=='https:' || !hosts.includes(parsed.hostname.toLowerCase())) ctx.addIssue({code:'custom',path:['gameUrl'],message:'External game URL must use an allowed HTTPS host'}); } catch {ctx.addIssue({code:'custom',path:['gameUrl'],message:'Game URL must be local or an allowed HTTPS URL'});} }
 if(g.published && (!g.license.trim() || !g.licenseNotes.trim())) ctx.addIssue({code:'custom',path:['licenseNotes'],message:'License and license notes are required to publish'});
 if(g.published && g.engine==='flash') ctx.addIssue({code:'custom',path:['engine'],message:'Flash publishing is unavailable until a licensed Ruffle runtime is integrated'});
 if(g.sourceUrl){try{const source=new URL(g.sourceUrl);if(source.protocol!=='https:'&&source.protocol!=='http:')throw new Error();}catch{ctx.addIssue({code:'custom',path:['sourceUrl'],message:'Source URL must use HTTP or HTTPS'});}}
});
export const loginSchema=z.object({username:z.string().min(1).max(100),password:z.string().min(1).max(256)});
export const changePasswordSchema=z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(12).max(256)});
export type GameInput=z.infer<typeof gameSchema>;
