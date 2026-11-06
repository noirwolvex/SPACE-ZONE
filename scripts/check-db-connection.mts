import { loadEnvConfig } from "@next/env";
import { prisma } from "../lib/prisma";

// Load the same local environment files used by Next.js (including .env.local).
loadEnvConfig(process.cwd(), true);

function getRootErrorMessage(error: unknown, depth = 0): string {
  if (depth > 5 || !error || typeof error !== "object") {
    return String(error);
  }

  const value = error as { message?: unknown; cause?: unknown };
  if (value.cause) return getRootErrorMessage(value.cause, depth + 1);
  return typeof value.message === "string" ? value.message : String(error);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is missing. Check .env.local and .env.");
    process.exitCode = 1;
    return;
  }

  let target: URL;
  try {
    target = new URL(connectionString);
  } catch {
    console.error("DATABASE_URL is not a valid PostgreSQL connection URL.");
    process.exitCode = 1;
    return;
  }

  // Deliberately never print the password or the complete connection string.
  console.info("Checking PostgreSQL connection:");
  console.info(`  host: ${target.hostname}`);
  console.info(`  port: ${target.port || "(default)"}`);
  console.info(`  user: ${decodeURIComponent(target.username)}`);
  console.info(`  database: ${decodeURIComponent(target.pathname.replace(/^\\//, ""))}`);

  try {
    await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 AS result`;
    console.info("Database connection: OK");
  } catch (error) {
    const message = getRootErrorMessage(error);
    console.error("Database connection: FAILED");
    console.error(message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
