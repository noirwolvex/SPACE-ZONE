import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;
(async() => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        console.log('Adding missing columns to public.book (safe) ...');
        const sql = `ALTER TABLE IF EXISTS public.book
            ADD COLUMN IF NOT EXISTS title TEXT,
            ADD COLUMN IF NOT EXISTS author TEXT,
            ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
            ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
            ADD COLUMN IF NOT EXISTS "targetAge" TEXT,
            ADD COLUMN IF NOT EXISTS category TEXT,
            ADD COLUMN IF NOT EXISTS summary TEXT;

        ALTER TABLE IF EXISTS public.book
            ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL;

        ALTER TABLE IF EXISTS public.book
            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL;`;
        await client.query(sql);
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='book' ORDER BY ordinal_position;");
        console.log('Updated columns:', res.rows);
    } catch (err) {
        console.error('Error running ALTER TABLE:', err);
    } finally {
        await client.end();
    }
})();