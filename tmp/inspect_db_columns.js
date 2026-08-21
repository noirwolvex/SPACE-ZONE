import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;
(async() => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='Book' OR table_name='book' ORDER BY ordinal_position;`);
    console.log('columns:', res.rows);
    await client.end();
})();