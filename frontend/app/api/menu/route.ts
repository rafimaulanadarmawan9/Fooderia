import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM menus');
    return NextResponse.json({ status: 'success', data: rows });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nama, kategori, harga, stok, status, icon } = await req.json();
    const [result]: any = await db.query(
      'INSERT INTO menus (nama, kategori, harga, stok, status, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, kategori, Number(harga), Number(stok), status, icon || '🍔']
    );
    return NextResponse.json({ status: 'success', id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}