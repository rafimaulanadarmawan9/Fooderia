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

app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menus');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { nama, kategori, harga, stok, status, icon } = req.body;
    const [result] = await db.query(
      'INSERT INTO menus (nama, kategori, harga, stok, status, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, kategori, Number(harga), Number(stok), status, icon]
    );
    res.json({ status: 'success', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('✅ Menu berjalan di http://localhost:3001');
});