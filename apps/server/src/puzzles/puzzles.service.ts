import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  Difficulty,
  UniquenessLevel,
  PuzzleReservation,
} from '@kdp/shared';
import { PrismaService } from '../prisma/prisma.service';

/** row shape returned by the raw reservation SELECT */
interface ReservedRow {
  id: string;
  seed: string; // pg returns BIGINT as string
  hash: string;
  difficulty: string;
}

/** shape returned by getHistory */
export interface PuzzleHistoryItem {
  hash: string;
  difficulty: string;
  createdAt: Date;
}

@Injectable()
export class PuzzlesService {
  constructor(private readonly prisma: PrismaService) {}

  // reservation

  /**
   * atomically reserve `count` available puzzles for a user.
   *
   * uses FOR UPDATE SKIP LOCKED so concurrent requests never double-reserve
   * the same puzzle row.
   *
   * uniqueness levels:
   *   book   – no extra filter (duplicates within a single batch are impossible)
   *   user   – excludes puzzles already confirmed for this user
   *   global – only status='available' rows considered (default; confirmed rows
   *            are permanently out of the pool)
   */
  async reservePuzzles(
    difficulty: Difficulty,
    count: number,
    uniquenessLevel: UniquenessLevel,
    userId: string,
  ): Promise<PuzzleReservation[]> {
    const reserved = await this.prisma.db.$transaction(async (tx) => {
      // build parameterized SELECT query
      const params: Array<string | number> = [];

      let sql =
        "SELECT id, seed, hash, difficulty FROM puzzle_registry WHERE status = 'available'";

      params.push(difficulty);
      sql += ` AND difficulty = $${params.length}`;

      if (uniquenessLevel === 'user') {
        params.push(userId);
        sql += ` AND id NOT IN (
          SELECT id FROM puzzle_registry
          WHERE user_id = $${params.length} AND status = 'confirmed'
        )`;
      }

      params.push(count);
      sql += ` ORDER BY id LIMIT $${params.length} FOR UPDATE SKIP LOCKED`;

      const rows = await tx.$queryRawUnsafe<ReservedRow[]>(sql, ...params);

      if (rows.length < count) {
        throw new ServiceUnavailableException(
          `Insufficient puzzles in pool for difficulty "${difficulty}". ` +
            `Requested ${count}, available ${rows.length}.`,
        );
      }

      // update status to 'pending' ───────────────────────────────────────
      const ids = rows.map((r) => r.id);

      await tx.$executeRawUnsafe(
        `UPDATE puzzle_registry
         SET status = 'pending', user_id = $1, reserved_at = NOW()
         WHERE id = ANY($2::text[])`,
        userId,
        ids,
      );

      return rows;
    });

    return reserved.map((r) => ({
      id: r.id,
      seed: BigInt(r.seed),
      hash: r.hash,
      difficulty: r.difficulty as Difficulty,
    }));
  }

  // lifecycle helpers (called by BooksService)

  /**
   * mark all pending puzzles for a book as confirmed (after successful payment).
   */
  async confirmPuzzles(bookId: string): Promise<void> {
    await this.prisma.db.puzzleRegistry.updateMany({
      where: { bookId, status: 'pending' },
      data: { status: 'confirmed' },
    });
  }

  /**
   * release all pending puzzles for a book back to the available pool
   * (on cancellation or TTL expiry).
   */
  async releasePuzzles(bookId: string): Promise<void> {
    await this.prisma.db.puzzleRegistry.updateMany({
      where: { bookId, status: 'pending' },
      data: {
        status: 'available',
        userId: null,
        bookId: null,
        reservedAt: null,
      },
    });
  }

  // query

  /** return all confirmed/pending puzzle hashes for the authenticated user. */
  async getHistory(userId: string): Promise<PuzzleHistoryItem[]> {
    return this.prisma.db.puzzleRegistry.findMany({
      where: {
        userId,
        status: { in: ['confirmed', 'pending'] },
      },
      select: {
        hash: true,
        difficulty: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
