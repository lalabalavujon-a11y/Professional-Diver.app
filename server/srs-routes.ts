import type { Express } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "./db";
import {
  isAdminRole,
  requireAuth,
  type AuthenticatedRequest,
} from "./middleware/auth";

type EnvMode = "development" | "production" | "test";

function getEnvMode(): EnvMode {
  return (process.env.NODE_ENV as EnvMode | undefined) ?? "development";
}

function isSQLiteDev(): boolean {
  return getEnvMode() === "development";
}

function nowMs(): number {
  return Date.now();
}

function dayMs(days: number): number {
  return Math.round(days * 24 * 60 * 60 * 1000);
}

function generateId(): string {
  return randomBytes(16).toString("hex");
}

function resolveUserId(req: AuthenticatedRequest, requestedUserId: string): string | null {
  const authUser = req.user;
  if (!authUser) return null;
  if (authUser.id === requestedUserId || isAdminRole(authUser.role)) {
    return requestedUserId;
  }
  return null;
}

async function ensureSrsTables(): Promise<void> {
  // Decks + content
  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_decks (
      id text PRIMARY KEY NOT NULL,
      title text NOT NULL,
      description text,
      created_at integer NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_deck_options (
      deck_id text PRIMARY KEY NOT NULL,
      new_per_day integer NOT NULL DEFAULT 10,
      reviews_per_day integer NOT NULL DEFAULT 50,
      learning_steps_minutes text NOT NULL DEFAULT '[10,1440]',
      relearn_steps_minutes text NOT NULL DEFAULT '[10,1440]',
      leech_threshold integer NOT NULL DEFAULT 8,
      bury_siblings integer NOT NULL DEFAULT 1,
      updated_at integer NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES srs_decks(id) ON UPDATE no action ON DELETE cascade
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_cards (
      id text PRIMARY KEY NOT NULL,
      deck_id text NOT NULL,
      front text NOT NULL,
      back text NOT NULL,
      source_type text NOT NULL DEFAULT 'manual',
      source_id text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES srs_decks(id) ON UPDATE no action ON DELETE cascade
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_tags (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL UNIQUE,
      created_at integer NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_card_tags (
      card_id text NOT NULL,
      tag_id text NOT NULL,
      PRIMARY KEY (card_id, tag_id),
      FOREIGN KEY (card_id) REFERENCES srs_cards(id) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (tag_id) REFERENCES srs_tags(id) ON UPDATE no action ON DELETE cascade
    );
  `);

  // Scheduling state + event log
  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_card_states (
      user_id text NOT NULL,
      card_id text NOT NULL,
      state text NOT NULL, -- new|learning|review|relearning
      due_at integer NOT NULL,
      interval_days real NOT NULL,
      ease real NOT NULL,
      reps integer NOT NULL,
      lapses integer NOT NULL,
      suspended integer NOT NULL DEFAULT 0,
      last_reviewed_at integer,
      updated_at integer NOT NULL,
      PRIMARY KEY (user_id, card_id),
      FOREIGN KEY (card_id) REFERENCES srs_cards(id) ON UPDATE no action ON DELETE cascade
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS srs_review_events (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      deck_id text NOT NULL,
      card_id text NOT NULL,
      grade integer NOT NULL, -- 0=again,1=hard,2=good,3=easy
      confidence integer, -- 0..3 optional
      reviewed_at integer NOT NULL,
      prev_state text,
      next_state text,
      prev_due_at integer,
      next_due_at integer,
      prev_interval_days real,
      next_interval_days real,
      prev_ease real,
      next_ease real,
      created_at integer NOT NULL,
      FOREIGN KEY (deck_id) REFERENCES srs_decks(id) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (card_id) REFERENCES srs_cards(id) ON UPDATE no action ON DELETE cascade
    );
  `);

  // Helpful indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_srs_states_due ON srs_card_states(user_id, due_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_srs_cards_deck ON srs_cards(deck_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_srs_review_events_user_time ON srs_review_events(user_id, reviewed_at);`);
}

type DeckOptions = {
  newPerDay: number;
  reviewsPerDay: number;
  learningStepsMinutes: number[];
  relearnStepsMinutes: number[];
  leechThreshold: number;
  burySiblings: boolean;
};

async function getDeckOptions(deckId: string): Promise<DeckOptions> {
  const rows = await db.execute(
    `SELECT
      new_per_day,
      reviews_per_day,
      learning_steps_minutes,
      relearn_steps_minutes,
      leech_threshold,
      bury_siblings
     FROM srs_deck_options
     WHERE deck_id = $1
     LIMIT 1`,
    [deckId],
  );

  if (rows.rows.length === 0) {
    const defaults: DeckOptions = {
      newPerDay: 10,
      reviewsPerDay: 50,
      learningStepsMinutes: [10, 1440],
      relearnStepsMinutes: [10, 1440],
      leechThreshold: 8,
      burySiblings: true,
    };
    await db.execute(
      `INSERT INTO srs_deck_options
        (deck_id, new_per_day, reviews_per_day, learning_steps_minutes, relearn_steps_minutes, leech_threshold, bury_siblings, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        deckId,
        defaults.newPerDay,
        defaults.reviewsPerDay,
        JSON.stringify(defaults.learningStepsMinutes),
        JSON.stringify(defaults.relearnStepsMinutes),
        defaults.leechThreshold,
        defaults.burySiblings ? 1 : 0,
        nowMs(),
      ],
    );
    return defaults;
  }

  const r = rows.rows[0] as any;
  const parseSteps = (value: unknown, fallback: number[]) => {
    if (typeof value !== "string") return fallback;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((n) => Number.isFinite(n))) return parsed as number[];
      return fallback;
    } catch {
      return fallback;
    }
  };

  return {
    newPerDay: Number(r.new_per_day ?? 10),
    reviewsPerDay: Number(r.reviews_per_day ?? 50),
    learningStepsMinutes: parseSteps(r.learning_steps_minutes, [10, 1440]),
    relearnStepsMinutes: parseSteps(r.relearn_steps_minutes, [10, 1440]),
    leechThreshold: Number(r.leech_threshold ?? 8),
    burySiblings: Number(r.bury_siblings ?? 1) === 1,
  };
}

type CardStateRow = {
  userId: string;
  cardId: string;
  state: "new" | "learning" | "review" | "relearning";
  dueAt: number;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  suspended: boolean;
  lastReviewedAt: number | null;
};

function normalizeGrade(input: number): 0 | 1 | 2 | 3 {
  if (input <= 0) return 0;
  if (input === 1) return 1;
  if (input === 2) return 2;
  return 3;
}

function toSm2Quality(grade: 0 | 1 | 2 | 3): number {
  // SM-2 quality is 0..5. We map:
  // again=0, hard=3, good=4, easy=5.
  if (grade === 0) return 0;
  if (grade === 1) return 3;
  if (grade === 2) return 4;
  return 5;
}

function updateEase(prevEase: number, quality0to5: number): number {
  const q = quality0to5;
  const next = prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(1.3, Math.min(3.0, next));
}

function computeNextIntervalDays(params: {
  prevIntervalDays: number;
  nextEase: number;
  grade: 0 | 1 | 2 | 3;
  repsAfter: number;
}): number {
  const { prevIntervalDays, nextEase, grade, repsAfter } = params;

  if (repsAfter <= 1) return 1;
  if (repsAfter === 2) return 6;

  if (grade === 1) {
    // Hard: small bump.
    return Math.max(1, Math.round(prevIntervalDays * 1.2));
  }
  if (grade === 3) {
    // Easy: bigger bump.
    return Math.max(1, Math.round(prevIntervalDays * nextEase * 1.3));
  }
  // Good:
  return Math.max(1, Math.round(prevIntervalDays * nextEase));
}

async function getOrCreateCardState(userId: string, cardId: string): Promise<CardStateRow> {
  const rows = await db.execute(
    `SELECT user_id, card_id, state, due_at, interval_days, ease, reps, lapses, suspended, last_reviewed_at
     FROM srs_card_states
     WHERE user_id = $1 AND card_id = $2
     LIMIT 1`,
    [userId, cardId],
  );

  if (rows.rows.length > 0) {
    const r = rows.rows[0] as any;
    return {
      userId: String(r.user_id),
      cardId: String(r.card_id),
      state: (r.state as CardStateRow["state"]) ?? "new",
      dueAt: Number(r.due_at ?? nowMs()),
      intervalDays: Number(r.interval_days ?? 0),
      ease: Number(r.ease ?? 2.5),
      reps: Number(r.reps ?? 0),
      lapses: Number(r.lapses ?? 0),
      suspended: Number(r.suspended ?? 0) === 1,
      lastReviewedAt: r.last_reviewed_at === null || r.last_reviewed_at === undefined ? null : Number(r.last_reviewed_at),
    };
  }

  const created: CardStateRow = {
    userId,
    cardId,
    state: "new",
    dueAt: nowMs(),
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    suspended: false,
    lastReviewedAt: null,
  };

  await db.execute(
    `INSERT INTO srs_card_states
      (user_id, card_id, state, due_at, interval_days, ease, reps, lapses, suspended, last_reviewed_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      created.userId,
      created.cardId,
      created.state,
      created.dueAt,
      created.intervalDays,
      created.ease,
      created.reps,
      created.lapses,
      0,
      null,
      nowMs(),
    ],
  );

  return created;
}

export function registerSrsRoutes(app: Express): void {
  // Phase 2–4 endpoints are currently implemented for SQLite dev.
  // Production support will require Postgres schema + migrations.

  app.get("/api/srs/decks", requireAuth, async (_req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const decks = await db.execute(
        `SELECT d.id, d.title, d.description, d.created_at
         FROM srs_decks d
         ORDER BY d.created_at DESC`,
      );

      res.json(decks.rows);
    } catch (error) {
      console.error("SRS decks list error:", error);
      res.status(500).json({ error: "Failed to list SRS decks" });
    }
  });

  app.post("/api/srs/decks", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const input = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const id = generateId();
      const createdAt = nowMs();

      await db.execute(
        `INSERT INTO srs_decks (id, title, description, created_at)
         VALUES ($1, $2, $3, $4)`,
        [id, parsed.title, parsed.description ?? null, createdAt],
      );

      // Ensure default options row exists
      await getDeckOptions(id);

      res.status(201).json({ id, ...parsed, createdAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS deck create error:", error);
      res.status(500).json({ error: "Failed to create SRS deck" });
    }
  });

  app.get("/api/srs/decks/:deckId/options", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();
      const { deckId } = req.params;
      const options = await getDeckOptions(deckId);
      res.json(options);
    } catch (error) {
      console.error("SRS deck options get error:", error);
      res.status(500).json({ error: "Failed to fetch deck options" });
    }
  });

  app.put("/api/srs/decks/:deckId/options", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const { deckId } = req.params;
      const input = z.object({
        newPerDay: z.number().int().min(0).optional(),
        reviewsPerDay: z.number().int().min(0).optional(),
        learningStepsMinutes: z.array(z.number().int().min(1)).min(1).optional(),
        relearnStepsMinutes: z.array(z.number().int().min(1)).min(1).optional(),
        leechThreshold: z.number().int().min(1).optional(),
        burySiblings: z.boolean().optional(),
      });

      const parsed = input.parse(req.body);
      const current = await getDeckOptions(deckId);
      const next: DeckOptions = {
        newPerDay: parsed.newPerDay ?? current.newPerDay,
        reviewsPerDay: parsed.reviewsPerDay ?? current.reviewsPerDay,
        learningStepsMinutes: parsed.learningStepsMinutes ?? current.learningStepsMinutes,
        relearnStepsMinutes: parsed.relearnStepsMinutes ?? current.relearnStepsMinutes,
        leechThreshold: parsed.leechThreshold ?? current.leechThreshold,
        burySiblings: parsed.burySiblings ?? current.burySiblings,
      };

      await db.execute(
        `INSERT INTO srs_deck_options
          (deck_id, new_per_day, reviews_per_day, learning_steps_minutes, relearn_steps_minutes, leech_threshold, bury_siblings, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT(deck_id) DO UPDATE SET
           new_per_day = excluded.new_per_day,
           reviews_per_day = excluded.reviews_per_day,
           learning_steps_minutes = excluded.learning_steps_minutes,
           relearn_steps_minutes = excluded.relearn_steps_minutes,
           leech_threshold = excluded.leech_threshold,
           bury_siblings = excluded.bury_siblings,
           updated_at = excluded.updated_at`,
        [
          deckId,
          next.newPerDay,
          next.reviewsPerDay,
          JSON.stringify(next.learningStepsMinutes),
          JSON.stringify(next.relearnStepsMinutes),
          next.leechThreshold,
          next.burySiblings ? 1 : 0,
          nowMs(),
        ],
      );

      res.json(next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS deck options update error:", error);
      res.status(500).json({ error: "Failed to update deck options" });
    }
  });

  app.get("/api/srs/tags", requireAuth, async (_req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();
      const tags = await db.execute(`SELECT id, name, created_at FROM srs_tags ORDER BY name ASC`);
      res.json(tags.rows);
    } catch (error) {
      console.error("SRS tags list error:", error);
      res.status(500).json({ error: "Failed to list tags" });
    }
  });

  app.post("/api/srs/tags", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const input = z.object({ name: z.string().min(1).max(64) });
      const parsed = input.parse(req.body);
      const id = generateId();
      const createdAt = nowMs();

      await db.execute(`INSERT INTO srs_tags (id, name, created_at) VALUES ($1,$2,$3)`, [
        id,
        parsed.name.trim(),
        createdAt,
      ]);

      res.status(201).json({ id, name: parsed.name.trim(), createdAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS tag create error:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  app.get("/api/srs/decks/:deckId/cards", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const { deckId } = req.params;
      const cards = await db.execute(
        `SELECT c.id, c.deck_id, c.front, c.back, c.source_type, c.source_id, c.created_at, c.updated_at
         FROM srs_cards c
         WHERE c.deck_id = $1
         ORDER BY c.created_at DESC`,
        [deckId],
      );
      res.json(cards.rows);
    } catch (error) {
      console.error("SRS deck cards list error:", error);
      res.status(500).json({ error: "Failed to list deck cards" });
    }
  });

  app.post("/api/srs/cards", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const input = z.object({
        deckId: z.string().min(1),
        front: z.string().min(1),
        back: z.string().min(1),
        sourceType: z.string().optional(),
        sourceId: z.string().optional(),
        tagIds: z.array(z.string().min(1)).optional(),
      });
      const parsed = input.parse(req.body);

      const id = generateId();
      const createdAt = nowMs();
      await db.execute(
        `INSERT INTO srs_cards (id, deck_id, front, back, source_type, source_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          parsed.deckId,
          parsed.front,
          parsed.back,
          parsed.sourceType ?? "manual",
          parsed.sourceId ?? null,
          createdAt,
          createdAt,
        ],
      );

      const tagIds = parsed.tagIds ?? [];
      for (const tagId of tagIds) {
        await db.execute(`INSERT OR IGNORE INTO srs_card_tags (card_id, tag_id) VALUES ($1,$2)`, [id, tagId]);
      }

      res.status(201).json({ id, deckId: parsed.deckId, createdAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS card create error:", error);
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  app.get("/api/srs/due", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const query = z.object({
        userId: z.string().min(1),
        deckId: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(100).optional(),
      });
      const { userId, deckId, limit } = query.parse(req.query);
      const scopedUserId = resolveUserId(req as AuthenticatedRequest, userId);
      if (!scopedUserId) {
        return res.status(403).json({ error: "Not authorized to access this user" });
      }
      const opts = await getDeckOptions(deckId);
      const max = limit ?? 20;

      const now = nowMs();

      // Due reviews (including learning/relearning steps)
      const due = await db.execute(
        `SELECT
           c.id as card_id,
           c.deck_id,
           c.front,
           c.back,
           s.state,
           s.due_at,
           s.interval_days,
           s.ease,
           s.reps,
           s.lapses,
           s.suspended
         FROM srs_cards c
         INNER JOIN srs_card_states s ON s.card_id = c.id AND s.user_id = $1
         WHERE c.deck_id = $2
           AND s.suspended = 0
           AND s.due_at <= $3
         ORDER BY s.due_at ASC
         LIMIT $4`,
        [scopedUserId, deckId, now, max],
      );

      const dueCards = due.rows as any[];
      const remainingSlots = Math.max(0, max - dueCards.length);

      // New cards = no state row yet for user. Cap by deck options.
      const newLimit = Math.min(remainingSlots, opts.newPerDay);
      let newCards: any[] = [];
      if (newLimit > 0) {
        const rows = await db.execute(
          `SELECT c.id as card_id, c.deck_id, c.front, c.back, 'new' as state, $3 as due_at
           FROM srs_cards c
           LEFT JOIN srs_card_states s
             ON s.card_id = c.id AND s.user_id = $1
           WHERE c.deck_id = $2
             AND s.card_id IS NULL
           ORDER BY c.created_at ASC
           LIMIT $4`,
          [scopedUserId, deckId, now, newLimit],
        );
        newCards = rows.rows as any[];
      }

      res.json({
        deckId,
        now,
        options: opts,
        items: [...dueCards, ...newCards],
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS due queue error:", error);
      res.status(500).json({ error: "Failed to get due queue" });
    }
  });

  app.post("/api/srs/review", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const input = z.object({
        userId: z.string().min(1),
        deckId: z.string().min(1),
        cardId: z.string().min(1),
        grade: z.number().int().min(0).max(3),
        confidence: z.number().int().min(0).max(3).optional(),
      });

      const parsed = input.parse(req.body);
      const scopedUserId = resolveUserId(req as AuthenticatedRequest, parsed.userId);
      if (!scopedUserId) {
        return res.status(403).json({ error: "Not authorized to review for this user" });
      }
      const opts = await getDeckOptions(parsed.deckId);
      const state = await getOrCreateCardState(scopedUserId, parsed.cardId);

      if (state.suspended) {
        return res.status(409).json({ error: "Card is suspended (leech)" });
      }

      const grade = normalizeGrade(parsed.grade);
      const quality = toSm2Quality(grade);
      const reviewedAt = nowMs();

      const prev = { ...state };

      let nextState: CardStateRow["state"] = prev.state;
      let nextDueAt = prev.dueAt;
      let nextIntervalDays = prev.intervalDays;
      let nextEase = prev.ease;
      let nextReps = prev.reps;
      let nextLapses = prev.lapses;
      let suspended = prev.suspended;

      const scheduleInMinutes = (minutes: number) => reviewedAt + minutes * 60 * 1000;

      if (grade === 0) {
        // Failed recall => relearning and increment lapses.
        nextLapses = prev.lapses + 1;
        nextReps = 0;
        nextIntervalDays = 0;
        nextEase = updateEase(prev.ease, quality);
        nextState = "relearning";
        nextDueAt = scheduleInMinutes(opts.relearnStepsMinutes[0] ?? 10);
      } else if (prev.state === "new") {
        // New card: if pass => learning step or graduate quickly.
        nextEase = updateEase(prev.ease, quality);
        nextReps = prev.reps + 1;
        if (opts.learningStepsMinutes.length > 1 && grade === 1) {
          nextState = "learning";
          nextDueAt = scheduleInMinutes(opts.learningStepsMinutes[0] ?? 10);
        } else {
          // Graduate to review next day.
          nextState = "review";
          nextIntervalDays = 1;
          nextDueAt = reviewedAt + dayMs(nextIntervalDays);
        }
      } else if (prev.state === "learning" || prev.state === "relearning") {
        nextEase = updateEase(prev.ease, quality);
        nextReps = prev.reps + 1;
        // Advance learning steps; for simplicity we graduate if good/easy.
        if (grade >= 2) {
          nextState = "review";
          nextIntervalDays = 1;
          nextDueAt = reviewedAt + dayMs(nextIntervalDays);
        } else {
          nextState = prev.state;
          nextDueAt = scheduleInMinutes((prev.state === "learning" ? opts.learningStepsMinutes[0] : opts.relearnStepsMinutes[0]) ?? 10);
        }
      } else {
        // Review card
        nextEase = updateEase(prev.ease, quality);
        nextReps = prev.reps + 1;
        nextState = "review";
        nextIntervalDays = computeNextIntervalDays({
          prevIntervalDays: Math.max(1, prev.intervalDays || 1),
          nextEase,
          grade,
          repsAfter: nextReps,
        });
        nextDueAt = reviewedAt + dayMs(nextIntervalDays);
      }

      if (nextLapses >= opts.leechThreshold) {
        suspended = true;
      }

      await db.execute(
        `INSERT INTO srs_card_states
          (user_id, card_id, state, due_at, interval_days, ease, reps, lapses, suspended, last_reviewed_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT(user_id, card_id) DO UPDATE SET
           state = excluded.state,
           due_at = excluded.due_at,
           interval_days = excluded.interval_days,
           ease = excluded.ease,
           reps = excluded.reps,
           lapses = excluded.lapses,
           suspended = excluded.suspended,
           last_reviewed_at = excluded.last_reviewed_at,
           updated_at = excluded.updated_at`,
        [
          scopedUserId,
          parsed.cardId,
          nextState,
          nextDueAt,
          nextIntervalDays,
          nextEase,
          nextReps,
          nextLapses,
          suspended ? 1 : 0,
          reviewedAt,
          reviewedAt,
        ],
      );

      const eventId = generateId();
      await db.execute(
        `INSERT INTO srs_review_events
          (id, user_id, deck_id, card_id, grade, confidence, reviewed_at, prev_state, next_state,
           prev_due_at, next_due_at, prev_interval_days, next_interval_days, prev_ease, next_ease, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          eventId,
          scopedUserId,
          parsed.deckId,
          parsed.cardId,
          grade,
          parsed.confidence ?? null,
          reviewedAt,
          prev.state,
          nextState,
          prev.dueAt,
          nextDueAt,
          prev.intervalDays,
          nextIntervalDays,
          prev.ease,
          nextEase,
          reviewedAt,
        ],
      );

      res.json({
        eventId,
        cardId: parsed.cardId,
        grade,
        suspended,
        next: {
          state: nextState,
          dueAt: nextDueAt,
          intervalDays: nextIntervalDays,
          ease: nextEase,
          reps: nextReps,
          lapses: nextLapses,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS review error:", error);
      res.status(500).json({ error: "Failed to record review" });
    }
  });

  // Filtered sessions (Phase 2): tag-based queue for targeted study
  app.get("/api/srs/filtered", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const query = z.object({
        userId: z.string().min(1),
        deckId: z.string().min(1),
        tagId: z.string().min(1).optional(),
        dueOnly: z.coerce.boolean().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
      });
      const { userId, deckId, tagId, dueOnly, limit } = query.parse(req.query);
      const scopedUserId = resolveUserId(req as AuthenticatedRequest, userId);
      if (!scopedUserId) {
        return res.status(403).json({ error: "Not authorized to access this user" });
      }
      const now = nowMs();
      const max = limit ?? 50;

      const rows = await db.execute(
        `
        SELECT
          c.id as card_id,
          c.deck_id,
          c.front,
          c.back,
          COALESCE(s.state, 'new') as state,
          COALESCE(s.due_at, $4) as due_at,
          COALESCE(s.suspended, 0) as suspended
        FROM srs_cards c
        LEFT JOIN srs_card_states s
          ON s.card_id = c.id AND s.user_id = $1
        ${tagId ? "INNER JOIN srs_card_tags ct ON ct.card_id = c.id AND ct.tag_id = $3" : ""}
        WHERE c.deck_id = $2
          AND COALESCE(s.suspended, 0) = 0
          ${dueOnly ? "AND COALESCE(s.due_at, $4) <= $4" : ""}
        ORDER BY COALESCE(s.due_at, $4) ASC, c.created_at ASC
        LIMIT $5
        `,
        tagId ? [scopedUserId, deckId, tagId, now, max] : [scopedUserId, deckId, now, max],
      );

      res.json({ items: rows.rows, now });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS filtered queue error:", error);
      res.status(500).json({ error: "Failed to get filtered queue" });
    }
  });

  // Phase 4 groundwork: pull/push review events (for offline/cross-device later)
  app.get("/api/srs/sync/pull", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS not enabled for production yet" });
      await ensureSrsTables();

      const query = z.object({
        userId: z.string().min(1),
        since: z.coerce.number().int().min(0).optional(),
      });
      const { userId, since } = query.parse(req.query);
      const scopedUserId = resolveUserId(req as AuthenticatedRequest, userId);
      if (!scopedUserId) {
        return res.status(403).json({ error: "Not authorized to sync this user" });
      }
      const cursor = since ?? 0;

      const events = await db.execute(
        `SELECT *
         FROM srs_review_events
         WHERE user_id = $1 AND reviewed_at > $2
         ORDER BY reviewed_at ASC
         LIMIT 1000`,
        [scopedUserId, cursor],
      );

      const states = await db.execute(
        `SELECT *
         FROM srs_card_states
         WHERE user_id = $1 AND updated_at > $2
         ORDER BY updated_at ASC
         LIMIT 2000`,
        [scopedUserId, cursor],
      );

      const nextCursor = Math.max(
        cursor,
        ...events.rows.map((r: any) => Number(r.reviewed_at ?? 0)),
        ...states.rows.map((r: any) => Number(r.updated_at ?? 0)),
      );

      res.json({ since: cursor, nextCursor, events: events.rows, states: states.rows });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS sync pull error:", error);
      res.status(500).json({ error: "Failed to sync pull" });
    }
  });

  // Phase 2 analytics: SRS deck stats + recent reviews (near real-time)
  app.get("/api/analytics/srs", requireAuth, async (req, res) => {
    try {
      if (!isSQLiteDev()) return res.status(501).json({ error: "SRS analytics not enabled for production yet" });
      await ensureSrsTables();

      const query = z.object({
        userId: z.string().min(1),
      });
      const { userId } = query.parse(req.query);
      const scopedUserId = resolveUserId(req as AuthenticatedRequest, userId);
      if (!scopedUserId) {
        return res.status(403).json({ error: "Not authorized to view analytics for this user" });
      }
      const now = nowMs();
      const since7d = now - 7 * 24 * 60 * 60 * 1000;

      const deckStats = await db.execute(
        `
        SELECT
          d.id,
          d.title,
          COUNT(DISTINCT c.id) as total_cards,
          SUM(CASE WHEN s.suspended = 1 THEN 1 ELSE 0 END) as suspended_cards,
          SUM(CASE WHEN s.suspended = 0 AND s.due_at <= $2 THEN 1 ELSE 0 END) as due_now
        FROM srs_decks d
        LEFT JOIN srs_cards c ON c.deck_id = d.id
        LEFT JOIN srs_card_states s ON s.card_id = c.id AND s.user_id = $1
        GROUP BY d.id, d.title
        ORDER BY d.created_at DESC
        `,
        [scopedUserId, now],
      );

      const recentReviews = await db.execute(
        `
        SELECT
          e.id,
          e.deck_id,
          d.title as deck_title,
          e.card_id,
          e.grade,
          e.reviewed_at
        FROM srs_review_events e
        LEFT JOIN srs_decks d ON d.id = e.deck_id
        WHERE e.user_id = $1
        ORDER BY e.reviewed_at DESC
        LIMIT 50
        `,
        [scopedUserId],
      );

      const reviewStats7d = await db.execute(
        `
        SELECT
          e.deck_id,
          COUNT(*) as reviews_7d,
          SUM(CASE WHEN e.grade >= 2 THEN 1 ELSE 0 END) as passes_7d
        FROM srs_review_events e
        WHERE e.user_id = $1 AND e.reviewed_at >= $2
        GROUP BY e.deck_id
        `,
        [scopedUserId, since7d],
      );

      // Handle drizzle results - SQLite returns array directly, PostgreSQL returns .rows
      const deckStatsData = Array.isArray(deckStats) ? deckStats : (deckStats.rows || []);
      const recentReviewsData = Array.isArray(recentReviews) ? recentReviews : (recentReviews.rows || []);
      const reviewStats7dData = Array.isArray(reviewStats7d) ? reviewStats7d : (reviewStats7d.rows || []);

      res.json({
        now,
        deckStats: deckStatsData,
        recentReviews: recentReviewsData,
        reviewStats7d: reviewStats7dData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("SRS analytics error:", error);
      res.status(500).json({ error: "Failed to fetch SRS analytics" });
    }
  });
}

