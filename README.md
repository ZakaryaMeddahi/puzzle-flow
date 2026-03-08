# KDP Puzzle Platform — Claude Code Reference

> **This README is written for Claude Code.**
> Read this entire file before touching any code. Do not make assumptions
> about structure, patterns, or conventions — everything is specified here.

---

## What This Project Is

A SaaS platform that lets KDP (Kindle Direct Publishing) publishers generate
unique, print-ready Sudoku puzzle books as PDFs. The core value proposition
is a **uniqueness engine** that guarantees no two puzzles are the same —
within a book, across a user's books, or across the entire platform.

Publishers upload nothing. They configure a book (difficulty, page count,
trim size), pay, and download a KDP-ready PDF with an answer key.

---

## Monorepo Structure

```
kdp-platform/
├── apps/
│   ├── web/                  → Next.js 14 (App Router) — user-facing frontend
│   ├── api/                  → NestJS — REST API
│   └── workers/              → BullMQ workers — puzzle generation + PDF rendering
├── packages/
│   ├── shared/               → Shared types, enums, Prisma client, constants
│   ├── puzzle-core/          → Sudoku generation logic (used by workers + api)
│   └── pdf-templates/        → KDP PDF layout logic (used by workers)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json              → Root package.json with workspace scripts
└── .env                      → Root env (DATABASE_URL for Prisma CLI only)
```

**Rule:** Never put business logic in `apps/`. Logic lives in `packages/`.
Apps only wire things together — routes, controllers, UI components.

---

## Tech Stack

| Layer         | Technology                  | Version |
| ------------- | --------------------------- | ------- |
| Frontend      | Next.js (App Router)        | 14+     |
| Backend       | NestJS                      | 10+     |
| Workers       | BullMQ                      | 5+      |
| Database ORM  | Prisma                      | 5+      |
| Database      | PostgreSQL                  | 15+     |
| Cache / Queue | Redis                       | 7+      |
| Monorepo      | Turborepo + pnpm workspaces | latest  |
| Payments      | LemonSqueezy                | —       |
| PDF           | pdf-lib                     | latest  |
| Language      | TypeScript everywhere       | 5+      |

---

## Package Details

### `packages/shared`

**Purpose:** Single source of truth for types, enums, and the Prisma client.
Both `apps/api` and `apps/workers` import from here.

**Exports:**

- All Prisma models (re-exported from `@prisma/client`)
- Shared TypeScript types and interfaces
- Shared enums (Difficulty, PuzzleStatus, BookStatus, UniquenessLevel)
- Constants (PUZZLE_POOL_TARGET, RESERVATION_TTL_MINUTES, etc.)

**Key rule:** The Prisma schema lives here at `packages/shared/prisma/schema.prisma`.
Never create a second Prisma schema elsewhere.

```typescript
// Example import in apps/api or apps/workers:
import { PrismaClient, Difficulty, PuzzleStatus } from "@kdp/shared";
import type { CreateBookDto } from "@kdp/shared";
```

### `packages/puzzle-core`

**Purpose:** All Sudoku puzzle generation logic. No database calls, no HTTP,
no side effects. Pure functions only.

**Exports:**

- `generatePuzzle(seed: bigint, difficulty: Difficulty): PuzzleResult`
- `normalizePuzzle(puzzle: string): string` — produces canonical 81-char string
- `hashPuzzle(normalized: string): string` — SHA-256 hex digest
- `validatePuzzle(puzzle: string): boolean` — confirms unique solution exists
- `seedToMetadata(seed: bigint): SeedMetadata` — decodes difficulty + sequence from seed

**Key rule:** This package has zero external dependencies except the Node.js
built-ins (`crypto` for SHA-256). No Prisma, no Redis, no HTTP clients.
It must be testable with plain Jest with no mocking.

### `packages/pdf-templates`

**Purpose:** KDP-valid PDF generation. Takes an array of puzzles and book
metadata and returns a `Uint8Array` PDF buffer.

**Exports:**

- `generateBookPdf(book: BookPdfInput): Promise<Uint8Array>`
- `generatePreviewPdf(puzzles: PuzzleResult[]): Promise<Uint8Array>` — low-res, watermarked

**KDP requirements this package must enforce:**

- Trim sizes: 6×9, 8×10, 8.5×11 inches
- Margins: minimum 0.25" all sides, 0.5" gutter on bound edge
- Resolution: 300 DPI equivalent for print
- Fonts: embedded, not subset-only
- Answer key section always at the back of the book

---

## Database Schema (Prisma)

Located at `packages/shared/prisma/schema.prisma`.

### Key Models

```prisma
model SeedCounter {
  difficulty String @id          // "easy" | "medium" | "hard" | "expert"
  nextSeed   BigInt @default(1)
}

model PuzzleRegistry {
  id         String    @id @default(uuid())
  seed       BigInt    @unique
  hash       String    @unique @db.Char(64)  // SHA-256 of normalized puzzle
  difficulty String
  status     String    @default("available") // available | pending | confirmed | expired
  userId     String?
  bookId     String?
  reservedAt DateTime?
  createdAt  DateTime  @default(now())
}

model Book {
  id         String    @id @default(uuid())
  userId     String
  title      String?
  trimSize   String    // "6x9" | "8x10" | "8.5x11"
  difficulty String
  pageCount  Int
  status     String    @default("draft") // draft | pending | ready | expired
  pdfPath    String?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

---

## Seed Architecture

Seeds are `BigInt` values with encoded metadata:

```
Bit layout (64-bit):
  Bits 63-62 → Difficulty  (00=easy, 01=medium, 10=hard, 11=expert)
  Bits 61-54 → Shard       (reserved for future sharding, default 0)
  Bits 53-0  → Sequence    (auto-increment counter per difficulty)
```

The `SeedCounter` table tracks the next sequence number per difficulty.
Incrementing the seed counter must be done atomically using a Prisma
transaction or `UPDATE ... RETURNING`.

---

## Uniqueness Engine

This is the most critical system. Read carefully.

### Three Levels

| Level    | Scope                                 | Implementation              |
| -------- | ------------------------------------- | --------------------------- |
| `book`   | No duplicates within one book         | Filter by `bookId` in batch |
| `user`   | No duplicates across all user's books | Filter by `userId` in query |
| `global` | No duplicates across entire platform  | `status = 'available'` only |

### Flow for Reserving Puzzles

```
1. Receive request: N puzzles, difficulty D, uniqueness level L, userId U
2. Query puzzle_registry using FOR UPDATE SKIP LOCKED:
   - WHERE status = 'available'
   - AND difficulty = D
   - AND (if user-level) id NOT IN (user's confirmed puzzles)
   - LIMIT N
3. UPDATE status = 'pending', reservedAt = NOW(), userId = U
4. Return reserved puzzle hashes + seeds
5. On book confirmation → UPDATE status = 'confirmed', bookId = B
6. On cancellation / TTL expiry → UPDATE status = 'available'
```

### Stale Reservation Cleanup

A BullMQ repeatable job runs every 5 minutes:

```sql
UPDATE puzzle_registry
SET status = 'available', userId = NULL, reservedAt = NULL
WHERE status = 'pending'
AND reservedAt < NOW() - INTERVAL '30 minutes';
```

### Pre-Generation

Workers continuously pre-generate puzzles into the pool.

- Target pool per difficulty: 100,000 puzzles
- Trigger: pool drops below 20,000 for any difficulty
- Batch size: 5,000 puzzles per job

---

## API Structure (NestJS — `apps/api`)

```
src/
├── auth/                 → JWT + Google OAuth (Passport.js)
├── books/                → Book CRUD, generation trigger
├── puzzles/              → Puzzle reservation, history
├── payments/             → LemonSqueezy webhooks
├── users/                → User profile
└── app.module.ts
```

### Key Endpoints

```
POST   /auth/google              → Google OAuth callback
POST   /auth/refresh             → Refresh JWT
GET    /books                    → List user's books
POST   /books                    → Create + reserve puzzles for a book
GET    /books/:id                → Get book status + download link
DELETE /books/:id                → Cancel pending book, release puzzles
POST   /payments/webhook         → LemonSqueezy webhook handler
GET    /puzzles/history          → User's puzzle history (hashes)
```

### Auth

- JWT-based, access token 15 minutes, refresh token 7 days
- Google OAuth via Passport.js
- All routes except `/auth/*` and `/payments/webhook` require JWT guard

---

## Worker Structure (BullMQ — `apps/workers`)

```
src/
├── queues/
│   ├── puzzle-generation.queue.ts   → Pre-generates puzzle pool
│   ├── pdf-generation.queue.ts      → Renders KDP PDF for a book
│   └── cleanup.queue.ts             → Releases stale reservations
└── main.ts
```

### Queue Names (use these exact strings)

```typescript
export const QUEUES = {
  PUZZLE_GENERATION: "puzzle-generation",
  PDF_GENERATION: "pdf-generation",
  CLEANUP: "cleanup",
} as const;
```

### Job Payloads

```typescript
// puzzle-generation job
interface PuzzleGenerationJob {
  difficulty: Difficulty;
  batchSize: number;
}

// pdf-generation job
interface PdfGenerationJob {
  bookId: string;
  userId: string;
}

// cleanup job (no payload, runs on schedule)
```

---

## Frontend Structure (Next.js — `apps/web`)

```
src/
├── app/
│   ├── (marketing)/          → Landing page, pricing, blog
│   │   ├── page.tsx          → Home / landing page
│   │   └── blog/
│   ├── (app)/                → Authenticated app
│   │   ├── dashboard/        → Book history, downloads
│   │   ├── generate/         → Book builder (step-by-step)
│   │   └── preview/[bookId]/ → Low-res preview before purchase
│   └── api/                  → Next.js API routes (auth callbacks only)
├── components/
│   ├── ui/                   → Reusable UI primitives
│   ├── book-builder/         → Multi-step book creation form
│   └── sudoku-preview/       → In-browser puzzle preview component
└── lib/
    ├── api.ts                → Typed API client (fetches from NestJS)
    └── auth.ts               → Auth helpers
```

---

## Environment Variables

### `apps/api/.env`

```
DATABASE_URL=postgresql://user:pass@localhost:5432/kdp_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
PORT=3001
```

### `apps/web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### `apps/workers/.env`

```
DATABASE_URL=postgresql://user:pass@localhost:5432/kdp_platform
REDIS_URL=redis://localhost:6379
PDF_STORAGE_PATH=./storage/pdfs
```

---

## Shared Enums and Constants

Define these in `packages/shared/src/enums.ts` and use them everywhere.
Never use raw strings for these values.

```typescript
export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  EXPERT = "expert",
}

export enum PuzzleStatus {
  AVAILABLE = "available",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  EXPIRED = "expired",
}

export enum BookStatus {
  DRAFT = "draft",
  PENDING = "pending",
  READY = "ready",
  EXPIRED = "expired",
}

export enum UniquenessLevel {
  BOOK = "book",
  USER = "user",
  GLOBAL = "global",
}

export enum TrimSize {
  SIX_BY_NINE = "6x9",
  EIGHT_BY_TEN = "8x10",
  EIGHT_HALF_BY_ELEVEN = "8.5x11",
}

export const CONSTANTS = {
  PUZZLE_POOL_TARGET: 100_000,
  PUZZLE_POOL_REFILL_THRESHOLD: 20_000,
  PUZZLE_BATCH_SIZE: 5_000,
  RESERVATION_TTL_MINUTES: 30,
  PDF_EXPIRY_DAYS: 7,
  CLUES_BY_DIFFICULTY: {
    [Difficulty.EASY]: { min: 36, max: 45 },
    [Difficulty.MEDIUM]: { min: 27, max: 35 },
    [Difficulty.HARD]: { min: 22, max: 26 },
    [Difficulty.EXPERT]: { min: 17, max: 21 },
  },
} as const;
```

---

## Coding Conventions

### TypeScript

- Strict mode enabled everywhere (`"strict": true` in all tsconfigs)
- No `any` types — use `unknown` and narrow properly
- All async functions return typed Promises
- DTOs use `class-validator` decorators in NestJS
- Interfaces for data shapes, types for unions/intersections

### NestJS

- One module per feature (auth, books, puzzles, payments, users)
- Services contain business logic, controllers only handle HTTP concerns
- Use `@Injectable()` services, never instantiate classes directly
- Guards for auth, interceptors for logging, pipes for validation
- All database calls go through Prisma service, never raw SQL except
  for the `FOR UPDATE SKIP LOCKED` reservation query

### React / Next.js

- Server Components by default — only use `'use client'` when necessary
- Fetch data in Server Components, pass to Client Components as props
- No `useEffect` for data fetching — use Server Components or SWR
- Tailwind for all styling — no CSS modules, no inline styles
- Component files named with PascalCase, utility files with camelCase

### Error Handling

- NestJS: use built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Workers: failed jobs retry 3 times with exponential backoff, then move to dead letter queue
- Frontend: error boundaries for async components, toast notifications for user errors

### Testing

- `packages/puzzle-core`: 100% unit test coverage required — it's pure functions
- `apps/api`: integration tests for all endpoints using `supertest`
- `apps/workers`: unit tests for job processors using mocked Prisma + Redis

---

## What NOT To Do

- **Never** import from `apps/*` into `packages/*` — packages must not depend on apps
- **Never** call the database directly from `packages/puzzle-core` — pure functions only
- **Never** hardcode difficulty strings — use the `Difficulty` enum from `@kdp/shared`
- **Never** generate a puzzle without registering its hash — uniqueness breaks silently
- **Never** skip the `FOR UPDATE SKIP LOCKED` on reservation queries — race conditions
- **Never** store the full puzzle solution in the PDF — only in the answer key section
- **Never** commit `.env` files — they are gitignored
- **Never** create a second `prisma/schema.prisma` — only one exists in `packages/shared`

---

## Running the Project

```bash
# Install all dependencies
pnpm install

# Generate Prisma client (run after any schema change)
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start everything in dev mode
pnpm dev

# Individual apps
pnpm --filter @kdp/web dev         # Next.js on :3000
pnpm --filter @kdp/api dev         # NestJS on :3001
pnpm --filter @kdp/workers dev     # BullMQ workers

# Run tests
pnpm --filter @kdp/puzzle-core test

# Open Prisma Studio
pnpm db:studio
```

---

## Current Build Status

| Package / App            | Status        | Notes                                       |
| ------------------------ | ------------- | ------------------------------------------- |
| `packages/shared`        | Scaffold only | Types and enums defined, Prisma schema done |
| `packages/puzzle-core`   | Not started   | Implement first                             |
| `packages/pdf-templates` | Not started   | Implement after puzzle-core                 |
| `apps/api`               | Scaffold only | NestJS project created, no modules yet      |
| `apps/workers`           | Scaffold only | BullMQ setup pending                        |
| `apps/web`               | Scaffold only | Next.js created, no pages yet               |

---

## Implementation Order

Follow this order strictly. Each step depends on the previous.

1. `packages/shared` — finalize all types, enums, constants, Prisma client export
2. `packages/puzzle-core` — Sudoku generator, hash normalization, tests
3. `apps/api` — Auth module (JWT + Google OAuth)
4. `apps/api` — Puzzle reservation service (with SKIP LOCKED)
5. `apps/workers` — BullMQ setup + puzzle pre-generation worker
6. `apps/workers` — Cleanup worker (stale reservations)
7. `packages/pdf-templates` — KDP PDF layout + answer key
8. `apps/workers` — PDF generation worker
9. `apps/api` — Books module + LemonSqueezy payment webhook
10. `apps/web` — Auth pages (login, Google callback)
11. `apps/web` — Dashboard (book history, download links)
12. `apps/web` — Book builder (multi-step form + low-res preview)

---

## Questions Claude Code Should Ask Before Starting Any Task

1. Which package or app does this belong in?
2. Does a type or enum for this already exist in `@kdp/shared`?
3. Will this function need database access? (If yes, it does not belong in `packages/puzzle-core`)
4. Is there an existing service or module this should be added to?
5. What is the test strategy for this code?
