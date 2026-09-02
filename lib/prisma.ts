import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type WorkerEnv = {
  HYPERDRIVE?: { connectionString: string };
};

type PrismaGlobal = typeof globalThis & {
  __spaceZonePrisma?: PrismaClient;
  __spaceZonePrismaConnectionString?: string;
};

const globalForPrisma = globalThis as PrismaGlobal;

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

async function getPrismaClient() {
  const connectionString = await getConnectionString();

  if (
    globalForPrisma.__spaceZonePrisma &&
    globalForPrisma.__spaceZonePrismaConnectionString === connectionString
  ) {
    return globalForPrisma.__spaceZonePrisma;
  }

  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.PRISMA_POOL_MAX || 5),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const client = new PrismaClient({ adapter });
  globalForPrisma.__spaceZonePrisma = client;
  globalForPrisma.__spaceZonePrismaConnectionString = connectionString;
  return client;
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
              const client = await getPrismaClient();
              let context: any = client;

              for (let index = 0; index < path.length - 1; index += 1) {
                context = context[path[index]];
              }

              const method = context[path[path.length - 1]];
              if (typeof method !== "function") {
                throw new TypeError(`Prisma property ${path.join(".")} is not callable`);
              }

              return method.apply(context, args);
            })();
          },
        });

      return buildPath([String(property)]);
    },
  }
) as unknown as PrismaClient;

export const prisma = lazyPrismaClient;
