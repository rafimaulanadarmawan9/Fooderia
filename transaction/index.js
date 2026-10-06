const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fooderia_db'
});

app.get('/api/transaksi', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transactions');
    const totalOmset = rows
      .filter(t => t.status === 'Selesai')
      .reduce((sum, trx) => sum + trx.total, 0);

    res.json({
      status: 'success',
      summary: { total_transaksi: rows.length, total_omset: totalOmset },
      data: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('✅ Transaction berjalan di http://localhost:3002');
});