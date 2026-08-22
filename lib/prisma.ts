import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env as workerEnv } from "cloudflare:workers";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type HyperdriveBinding = {
  connectionString?: string;
};

function getConnectionString() {
  const hyperdrive = (workerEnv as typeof workerEnv & { HYPERDRIVE?: HyperdriveBinding }).HYPERDRIVE;
  const hyperdriveConnectionString = hyperdrive?.connectionString;

  if (hyperdriveConnectionString) {
    return hyperdriveConnectionString;
  }

  const localHyperdriveConnectionString = process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE;
  if (localHyperdriveConnectionString) {
    return localHyperdriveConnectionString;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or HYPERDRIVE connection is not configured");
  }

  return connectionString;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getConnectionString(),
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
