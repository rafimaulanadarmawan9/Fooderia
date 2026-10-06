import { NextResponse } from 'next/server';
import db from "@/app/lib/db";
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const [rows]: any = await db.query('SELECT * FROM staff WHERE username = ?', [username]);

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Username tidak ditemukan!' }, { status: 401 });
    }

    const user = rows[0];
    
    // Pengecekan langsung secara aman untuk uji coba lokal
    if (password !== user.password) {
      return NextResponse.json({ status: 'error', message: 'Password salah!' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'success',
      user: { id: user.id, nama: user.nama, role: user.role }
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}