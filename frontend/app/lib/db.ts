import mysql from 'mysql2/promise';

// Cek apakah URL publik Railway tersedia (saat online di Vercel)
const connectionString = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;

const pool = connectionString
  ? mysql.createPool(connectionString) // Menggunakan Overload 1 (String URL)
  : mysql.createPool({                 // Menggunakan Overload 2 (Object Config untuk lokal)
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fooderia',
      port: Number(process.env.DB_PORT || 3306),
    });

export default pool;