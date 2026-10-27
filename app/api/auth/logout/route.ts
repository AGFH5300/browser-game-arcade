import { NextResponse } from 'next/server'; import { sameOrigin } from '@/lib/auth';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const r=NextResponse.json({ok:true});r.cookies.set('arcade_admin','',{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:0});return r;}
