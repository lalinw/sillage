import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

// Reuse one client across hot reloads in dev so we don't exhaust connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const NO_CONNECTION_MESSAGE =
  "No connection to database, failed to save.";

// Codes for failing to reach, log in to, or stay connected to the database.
// The socket codes can arrive raw: on localhost, Node reports a refused connection
// as an AggregateError that Prisma doesn't translate.
const CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1010",
  "P1011",
  "P1017",
  "P2024",
  "P2037",
]);

export function isConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && CONNECTION_ERROR_CODES.has(code);
}

// Lists show as empty when the database can't be reached, instead of crashing the page.
export async function queryOrEmpty<T>(query: () => Promise<T[]>): Promise<T[]> {
  try {
    return await query();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Database query failed, showing no rows: ${reason}`);
    return [];
  }
}
