import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
export const dynamic='force-dynamic';
type Message={id:string;name:string;email:string;message:string;created_at:string};
export default async function AdminMessages(){if(!(await isAdmin()))redirect('/admin');const rows=await getDb()`SELECT id,name,email,message,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 50`;return <main className="admin-shell"><header><div><p>ARCADE / CONTROL ROOM</p><h1>Contact inbox</h1><p>Latest 50 messages</p></div><a href="/admin">Back to games</a></header><section className="admin-list">{rows.length===0?<p>No messages yet.</p>:rows.map(row=>{const m=row as Message;return <article className="contact-message" key={m.id}><div><strong>{m.name||'Anonymous'}</strong>{m.email&&<p><a href={`mailto:${m.email}`}>{m.email}</a></p>}<p>{new Date(m.created_at).toLocaleString()}</p><p className="contact-message-body">{m.message}</p></div></article>;})}</section></main>}
