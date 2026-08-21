#!/usr/bin/env node

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin(email, password) {
    console.log(`\n🔐 Setting up Admin Account: ${email}\n`);

    try {
        // 1. Get existing user or create new
        console.log("1️⃣  Checking Supabase Auth...");

        let supabaseId = null;
        let userExists = false;

        // Try to get existing user
        const { data: userData } = await supabase.auth.admin.listUsers();
        const existingUser = userData && userData.users ? userData.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) : null;

        if (existingUser) {
            supabaseId = existingUser.id;
            userExists = true;
            console.log(`✓ User found in Supabase Auth: ${supabaseId}`);
        } else {
            // Create new user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (authError) {
                console.error("❌ Failed to create auth user:", authError.message);
                await pool.end();
                process.exit(1);
            }

            supabaseId = authData.user.id;
            console.log(`✓ New user created in Supabase Auth: ${supabaseId}`);
        }

        // 2. Create or update Customer
        console.log("\n2️⃣  Setting up Customer in database...");

        try {
            const { rows } = await pool.query(
                `INSERT INTO "Customer" (id, email, name, "supabaseId", role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
         RETURNING id, email, role`, [email, "Admin User", supabaseId, "ADMIN"]
            );
            console.log(`✓ Customer created: ${rows[0].email} (Role: ${rows[0].role})`);
        } catch (err) {
            // If insert fails, try update by supabaseId
            const { rows: updateRows } = await pool.query(
                `UPDATE "Customer" SET role = $2, "updatedAt" = now()
         WHERE "supabaseId" = $1
         RETURNING id, email, role`, [supabaseId, "ADMIN"]
            );

            if (updateRows.length === 0) {
                // Try by email
                const { rows: emailRows } = await pool.query(
                    `UPDATE "Customer" SET "supabaseId" = $1, role = $2, "updatedAt" = now()
           WHERE lower(email) = lower($3)
           RETURNING id, email, role`, [supabaseId, "ADMIN", email]
                );

                if (emailRows.length === 0) {
                    throw new Error("Could not create or update customer");
                }
                console.log(`✓ Customer updated: ${emailRows[0].email} (Role: ${emailRows[0].role})`);
            } else {
                console.log(`✓ Customer updated: ${updateRows[0].email} (Role: ${updateRows[0].role})`);
            }
        }

        console.log("\n✅ Admin account setup complete!");
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log("\n🚀 You can now log in as admin!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

const email = process.argv[2] || "admin@gmail.com";
const password = process.argv[3] || "ADMIN26";

createAdmin(email, password);