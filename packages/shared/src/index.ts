// enums & constants
export * from "./enums";

// shared TypeScript types / DTOs
export * from "./types";

// prisma client singleton
export { prisma } from "./prisma";

// re-export generated Prisma types and utilities
export type {
  PrismaClient,
  User,
  Book,
  PuzzleRegistry,
  SeedCounter,
} from "./generated/prisma/client";

// prisma namespace: gives access to Prisma.sql, Prisma.Sql, etc. for raw queries
export { Prisma } from "./generated/prisma/client";
