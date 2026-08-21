#!/usr/bin/env node

/**
 * Create Admin Account
 * 
 * Creates a new admin user in Supabase Auth and sets their role to ADMIN
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin(email, password) {
    console.log(`\n🔐 Creating Admin Account: ${email}\n`);

    try {
        // 1. Create user in Supabase Auth
        console.log("1️⃣  Creating Supabase Auth user...");
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            console.error("❌ Auth creation failed:", authError.message);
            if (authError.message.includes("already")) {
                console.log("   User already exists in Supabase Auth");
            } else {
                await pool.end();
                process.exit(1);
            }
        } else {
            console.log(`✓ Auth user created: ${authData.user.id}`);
        }

        const supabaseId = authData && authData.user ? authData.user.id : null;

        // 2. Create or update Customer in database
        console.log("\n2️⃣  Creating/updating Customer in database...");

        if (supabaseId) {
            // If user was just created
            const { rows: customerRows } = await pool.query(
                `INSERT INTO "Customer" (email, name, "supabaseId", role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("supabaseId") DO UPDATE
         SET email = $1, role = $4
         RETURNING id, email, role`, [email, "Admin User", supabaseId, "ADMIN"]
            );

            console.log(`✓ Customer record created/updated:`);
            console.log(`  - ID: ${customerRows[0].id}`);
            console.log(`  - Email: ${customerRows[0].email}`);
            console.log(`  - Role: ${customerRows[0].role}`);
        } else {
            // User already existed, just update their role
            const { rows: customerRows } = await pool.query(
                `UPDATE "Customer" SET role = 'ADMIN', "updatedAt" = now()
         WHERE lower(email) = lower($1)
         RETURNING id, email, role`, [email]
            );

            if (customerRows.length === 0) {
                console.error("❌ Customer not found. User may need to sign up first.");
                await pool.end();
                process.exit(1);
            }

            console.log(`✓ Customer role updated:`);
            console.log(`  - ID: ${customerRows[0].id}`);
            console.log(`  - Email: ${customerRows[0].email}`);
            console.log(`  - Role: ${customerRows[0].role}`);
        }

        console.log("\n✅ Admin account created successfully!");
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log("\n🚀 Admin can now log in at the login page!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Get email and password from command line or use defaults
const email = process.argv[2] || "admin@gmail.com";
const password = process.argv[3] || "ADMIN26";

createAdmin(email, password);