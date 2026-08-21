import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
    await client.connect();
    const res = await client.query("select count(*)::int as cnt from information_schema.tables where table_schema='public' and table_name='Website'");
    console.log('Website table count:', res.rows[0].cnt);
} catch (error) {
    console.error('DB error:', error);
    process.exit(1);
} finally {
    await client.end();
}