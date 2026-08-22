import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env as workerEnv } from "cloudflare:workers";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type WorkerEnv = {
  HYPERDRIVE?: { connectionString: string };
};

function getConnectionString() {
  const hyperdrive = (workerEnv as unknown as WorkerEnv | undefined)?.HYPERDRIVE;
  if (hyperdrive?.connectionString) return hyperdrive.connectionString;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return connectionString;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getConnectionString(),
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
