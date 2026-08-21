/**
 * Promote or demote a Customer to/from the ADMIN role.
 *
 * Admin access is granted purely by Customer.role, checked server-side against
 * the Supabase session. There are no static admin credentials anywhere.
 *
 * Usage:
 *   node scripts/grant-admin.mjs                      list all customers and roles
 *   node scripts/grant-admin.mjs <email>              promote to ADMIN
 *   node scripts/grant-admin.mjs <email> --revoke     demote to USER
 */
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const [email] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const revoke = process.argv.includes("--revoke");

if (!email) {
  const { rows } = await pool.query(
    'select email, name, role, ("supabaseId" is not null) as linked from "Customer" order by role desc, "createdAt"'
  );
  console.table(rows);
  console.log("\nPromote with:  node scripts/grant-admin.mjs <email>");
  await pool.end();
  process.exit(0);
}

const nextRole = revoke ? "USER" : "ADMIN";
const { rows } = await pool.query(
  'update "Customer" set role = $1, "updatedAt" = now() where lower(email) = lower($2) returning email, name, role',
  [nextRole, email]
);

if (rows.length === 0) {
  console.error(`No Customer found with email "${email}".`);
  console.error("The user must sign up through Supabase Auth at least once first.");
  await pool.end();
  process.exit(1);
}

console.log(`${rows[0].email} is now ${rows[0].role}.`);
await pool.end();
