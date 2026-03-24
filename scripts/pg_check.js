import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  try {
    const version = await pool.query('select version() as v');
    console.log('connected:', String(version.rows[0].v).split('\n')[0]);

    const tables = await pool.query(
      "select table_name from information_schema.tables where table_schema='public' order by table_name",
    );
    const names = tables.rows.map((r) => r.table_name);
    console.log('tables:', names.length ? names.join(', ') : '(none)');

    const cols = await pool.query(
      "select column_name, data_type from information_schema.columns where table_schema='public' and table_name='users' order by ordinal_position",
    );
    if (cols.rows.length) {
      console.log(
        'users columns:',
        cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(', '),
      );
    } else {
      console.log('users columns: (none)');
    }

    try {
      const usersCount = await pool.query('select count(*)::int as n from users');
      console.log('users count:', usersCount.rows[0].n);
    } catch (err) {
      console.error('users query failed:', err.message);
      if (err.code) console.error('code:', err.code);
      if (err.detail) console.error('detail:', err.detail);
    }

    try {
      const testEmail = process.env.PG_CHECK_EMAIL || 'parent@example.com';
      const q = await pool.query('select uid from users where email = $1 limit 1', [testEmail]);
      console.log(`select uid by email (${testEmail}):`, q.rows.length ? q.rows[0].uid : '(no row)');
    } catch (err) {
      console.error('select uid by email failed:', err.message);
      if (err.code) console.error('code:', err.code);
      if (err.detail) console.error('detail:', err.detail);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('PG CHECK FAILED:', err?.message || err);
  process.exit(1);
});
