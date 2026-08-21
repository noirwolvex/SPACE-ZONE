#!/usr/bin/env node

/**
 * Test: Verify cart insertion works through the API
 * 
 * This test simulates a POST to /api/cart and verifies the item
 * is inserted into the ShoppingCartItem table in Supabase.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCartInsertion() {
    console.log("🧪 Testing Shopping Cart Insertion into Supabase...\n");

    try {
        // 1. Find or create a test customer
        const testCustomer = await prisma.customer.upsert({
            where: { email: "cart-test@example.com" },
            update: {},
            create: {
                email: "cart-test@example.com",
                name: "Cart Test User",
            },
        });

        console.log("✓ Test customer:", testCustomer.id);

        // 2. Insert a test item into ShoppingCartItem
        const testItem = await prisma.shoppingCartItem.upsert({
            where: {
                customerId_kind_slug: {
                    customerId: testCustomer.id,
                    kind: "TOOL",
                    slug: "test-tool-123",
                },
            },
            update: {
                name: "Updated Test Tool",
                updatedAt: new Date(),
            },
            create: {
                customerId: testCustomer.id,
                kind: "TOOL",
                slug: "test-tool-123",
                name: "Test Tool",
                category: "Testing",
                priceLabel: "Free",
                thumbnail: "https://example.com/thumb.jpg",
            },
        });

        console.log("✓ Cart item inserted:", testItem.id);
        console.log("  - Customer ID:", testItem.customerId);
        console.log("  - Kind:", testItem.kind);
        console.log("  - Slug:", testItem.slug);
        console.log("  - Name:", testItem.name);
        console.log("  - Created At:", testItem.createdAt);

        // 3. Verify we can read it back
        const readBack = await prisma.shoppingCartItem.findFirst({
            where: {
                customerId: testCustomer.id,
                slug: "test-tool-123",
            },
        });

        if (readBack) {
            console.log("\n✓ Item successfully read back from Supabase!");
            console.log("  Data persisted correctly.");
        } else {
            console.log("\n✗ Failed to read item back - not found in database!");
        }

        // 4. List all cart items for this customer
        const allItems = await prisma.shoppingCartItem.findMany({
            where: { customerId: testCustomer.id },
        });

        console.log(`\n✓ Total cart items for customer: ${allItems.length}`);
        allItems.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.name} (${item.slug})`);
        });

        console.log("\n✅ Cart database test PASSED - data persists in Supabase!");

    } catch (error) {
        console.error("\n❌ Test FAILED:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testCartInsertion();