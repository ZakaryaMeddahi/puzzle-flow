// enums & constants
export * from "./enums";

// shared TypeScript types / DTOs
export * from "./types";

// page schema (definitions, element types, FrontMatterConfig)
export * from "./page-schema";

// layout constants (zones, font sizes - shared between PDF and React preview)
export * from "./layout-constants";

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
