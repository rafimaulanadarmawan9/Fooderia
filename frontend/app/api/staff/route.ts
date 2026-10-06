import { NextResponse } from 'next/server';
import db from "@/app/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM staff');
    return NextResponse.json({ status: 'success', data: rows });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}