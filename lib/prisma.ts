import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type WorkerEnv = {
  HYPERDRIVE?: { connectionString: string };
};

async function getConnectionString() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const hyperdrive = (env as unknown as WorkerEnv).HYPERDRIVE;
    if (hyperdrive?.connectionString) return hyperdrive.connectionString;
  } catch {
    // Standard Next.js/Node execution and build-time evaluation use DATABASE_URL.
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return connectionString;
}

async function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: await getConnectionString(),
    maxUses: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return new PrismaClient({ adapter });
}

const lazyPrismaClient = new Proxy(
  {},
  {
    get(_target, property) {
      const buildPath = (path: string[]): any =>
        new Proxy(() => undefined, {
          get(_value, nestedProperty) {
            return buildPath([...path, String(nestedProperty)]);
          },
          apply(_value, _thisArg, args) {
            return (async () => {
              const client = await createPrismaClient();
              let value: any = client;
              for (const key of path) value = value[key];
              return value(...args);
            })();
          },
        });

      return buildPath([String(property)]);
    },
  }
) as unknown as PrismaClient;

export const prisma = lazyPrismaClient;
