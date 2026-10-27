import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
export async function GET(){if(!(await isAdmin()))return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({ok:true});}
