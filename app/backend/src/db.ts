// src/db.ts
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// 接続確認用
pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('DB Connection Error:', err);
    else console.log('DB Connected at:', res.rows[0].now);
});