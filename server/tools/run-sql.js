import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
dotenv.config();
import { pool } from '../db.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node tools/run-sql.js <path-to-sql-file>');
  const sqlPath = path.resolve(__dirname, '..', '..', file);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Executed SQL from', file);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
