# KDP Puzzle Platform

A SaaS platform that lets KDP (Kindle Direct Publishing) publishers generate
unique, print-ready Sudoku puzzle books as PDFs.

The core of the system is a **uniqueness engine** that guarantees no two
puzzles are repeated: within a book, across all of a user's books, or across
the entire platform. Publishers configure a book (difficulty, page count, trim
size), pay, and download a KDP-ready PDF with an answer key.

---

## Highlights

- **Monorepo architecture** (Turborepo + pnpm workspaces). Business logic lives in
  framework-agnostic packages, and the apps only handle wiring (HTTP, queues, UI).
- **Concurrency-safe puzzle reservation** using PostgreSQL
  `SELECT ... FOR UPDATE SKIP LOCKED`, so many concurrent book requests can draw
  from the same pool without collisions or lock contention.
- **Deterministic generation** from 64-bit seeds that encode difficulty and a
  per-difficulty sequence, so any puzzle can be reproduced from its seed.
- **Background processing** with BullMQ: pool pre-generation, PDF rendering, and
  scheduled cleanup of stale reservations.
- **Print-ready PDF output** that follows KDP trim size, margin, and gutter
  requirements, with an answer key at the back of the book.
- **Payments & subscriptions** through LemonSqueezy webhooks.

---

## Tech Stack

| Layer         | Technology                  |
| ------------- | --------------------------- |
| Frontend      | Next.js (App Router), React |
| Backend       | NestJS                      |
| Workers       | BullMQ                      |
| Database ORM  | Prisma                      |
| Database      | PostgreSQL                  |
| Cache / Queue | Redis                       |
| Monorepo      | Turborepo + pnpm workspaces |
| Payments      | LemonSqueezy                |
| PDF           | pdf-lib                     |
| Language      | TypeScript (strict)         |

---

## Repository Layout

```text
apps/
├── client/          Next.js frontend (landing, pricing, dashboard, book builder)
├── server/          NestJS REST API (auth, books, puzzles, payments, users)
└── workers/         BullMQ workers (puzzle generation, PDF generation, cleanup)
packages/
├── shared/          Prisma schema + client, shared types, enums, constants
├── puzzle-core/     Pure Sudoku generation, solving, hashing (no I/O)
└── pdf-templates/   KDP-compliant PDF layout and rendering
docs/                Design notes (domain model, database, subscriptions, ...)
```

Packages never depend on apps. `puzzle-core` has no dependencies beyond
Node's built-in `crypto`, which keeps it fully unit-testable without mocks.

---

## Packages

### `@kdp/shared`

Single source of truth for the Prisma schema and client, shared types, enums
(`Difficulty`, `PuzzleStatus`, `BookStatus`, `UniquenessLevel`, `TrimSize`), and
constants. Used by both the API and the workers.

### `@kdp/puzzle-core`

Pure functions for Sudoku generation:

- `generatePuzzle(seed, difficulty)`: deterministic puzzle generation from a seed
- `normalizePuzzle(puzzle)`: canonical 81-character representation
- `hashPuzzle(normalized)`: SHA-256 digest used for uniqueness checks
- `validatePuzzle(puzzle)`: confirms the puzzle has exactly one solution
- `seedToMetadata(seed)`: decodes difficulty and sequence from a seed

The solver uses bitmask constraints (rows, columns, and boxes as 9-bit
integers) with a minimum-remaining-values heuristic.

### `@kdp/pdf-templates`

Takes puzzles plus book metadata and returns a PDF buffer. Supports 6×9, 8×10,
and 8.5×11 inch trim sizes with KDP-compliant margins and gutters, and places
the answer key at the back of the book.

---

## Seed Architecture

Seeds are 64-bit `BigInt` values with encoded metadata:

```text
Bits 63-62 → Difficulty  (00=easy, 01=medium, 10=hard, 11=expert)
Bits 61-54 → Shard       (reserved for future sharding, default 0)
Bits 53-0  → Sequence    (auto-increment counter per difficulty)
```

A `SeedCounter` table tracks the next sequence per difficulty and is
incremented atomically.

---

## Uniqueness Engine

| Level    | Scope                                      |
| -------- | ------------------------------------------ |
| `book`   | No duplicates within a single book         |
| `user`   | No duplicates across all of a user's books |
| `global` | No duplicates across the entire platform   |

### Reservation flow

1. A request arrives for N puzzles of difficulty D at uniqueness level L for user U.
2. Rows are selected from `puzzle_registry` with `FOR UPDATE SKIP LOCKED`,
   filtered by status, difficulty, and (for user-level) the user's history.
3. The selected rows are marked `pending` with the user and a reservation timestamp.
4. When the book is confirmed, the puzzles become `confirmed` and linked to the book.
5. On cancellation or TTL expiry, they go back to `available`.

### Stale reservation cleanup

A repeatable BullMQ job runs every 5 minutes and releases reservations that have
been pending for more than 30 minutes.

### Pool pre-generation

Workers keep a pool of pre-generated puzzles per difficulty and refill it in
batches when it falls below a threshold, so book creation never waits on
generation.

---

## API Overview

```text
GET    /auth/google              Start Google OAuth
GET    /auth/google/callback     OAuth callback
POST   /auth/magic-link          Send a passwordless sign-in link
GET    /auth/magic-link/verify   Verify a magic link
POST   /auth/refresh             Refresh access token
GET    /users/me                 Current user profile
GET    /books                    List the user's books
POST   /books                    Create a book and reserve its puzzles
GET    /books/:id                Book status
POST   /books/:id/checkout       Start checkout for a book
GET    /books/:id/download       Download the generated PDF
DELETE /books/:id                Cancel a pending book and release its puzzles
POST   /preview/page             Render a page preview
GET    /puzzles/history          The user's puzzle history
POST   /webhooks/lemonsqueezy    Payment / subscription webhook
POST   /support                  Submit a support request
```

Authentication supports Google OAuth and magic links, using short-lived JWT
access tokens with refresh tokens. A global
guard protects every route except explicitly public ones (auth and webhooks).

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9
- PostgreSQL
- Redis

### Environment

Copy the example env files and fill in the values:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/workers/.env.example apps/workers/.env
```

The server needs `DATABASE_URL`, `REDIS_URL`, JWT secrets, Google OAuth
credentials, and LemonSqueezy keys. The client needs `NEXT_PUBLIC_API_URL` in
`apps/client/.env.local`.

### Run

```bash
pnpm install          # install dependencies
pnpm db:generate      # generate the Prisma client
pnpm db:migrate       # apply database migrations
pnpm dev              # start client, API, and workers

# Individually
pnpm --filter client dev           # Next.js on :3000
pnpm --filter @kdp/api dev         # NestJS on :5000
pnpm --filter @kdp/workers dev     # BullMQ workers

# Tests
pnpm --filter @kdp/puzzle-core test

# Prisma Studio
pnpm db:studio
```

---

## Further Reading

See [`docs/`](docs) for detailed notes on the domain model, database design,
subscriptions, book generation, and the uniqueness engine.
