import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const [rows]: any = await db.query('SELECT * FROM transactions ORDER BY id DESC');
    const totalOmset = rows
      .filter((t: any) => t.status === 'Selesai')
      .reduce((sum: number, trx: any) => sum + trx.total, 0);

    return NextResponse.json({
      status: 'success',
      summary: { total_transaksi: rows.length, total_omset: totalOmset },
      data: rows
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { pelanggan, total, metode } = await req.json();
    const id_transaksi = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    await db.query(
      'INSERT INTO transactions (id_transaksi, pelanggan, total, metode, status, waktu) VALUES (?, ?, ?, ?, ?, ?)',
      [id_transaksi, pelanggan, Number(total), metode, 'Selesai', waktu]
    );

    return NextResponse.json({ status: 'success', message: 'Transaksi berhasil dicatat!' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}