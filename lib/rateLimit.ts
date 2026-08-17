import mongoose, { Schema, Model } from "mongoose";
import { connectDB } from "./db";

// ─── Model ────────────────────────────────────────────────────

interface IRateLimit {
  key: string;       // "{userId}:{endpoint}"
  count: number;
  windowStart: Date;
  expireAt: Date;    // TTL index — MongoDB auto-deletes stale docs
}

const RateLimitSchema = new Schema<IRateLimit>({
  key:         { type: String, required: true, unique: true },
  count:       { type: Number, default: 1 },
  windowStart: { type: Date, required: true },
  expireAt:    { type: Date, required: true },
});

RateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

// ─── Checker ──────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Sliding-window rate limiter backed by MongoDB.
 * Safe across multiple serverless instances and server restarts.
 *
 * @param userId   - Scoped per authenticated user
 * @param endpoint - Short name for the endpoint (e.g. "hooks")
 * @param limit    - Max requests allowed per window
 * @param windowMs - Window size in milliseconds (default 60 000 = 1 min)
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowMs = 60_000
): Promise<RateLimitResult> {
  await connectDB();

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const expireAt = new Date(now.getTime() + windowMs);
  const key = `${userId}:${endpoint}`;

  try {
    // Atomically find-or-create and increment within the current window.
    // If the doc is older than windowStart it won't match — we'll upsert a fresh one.
    const doc = await RateLimit.findOneAndUpdate(
      { key, windowStart: { $gte: windowStart } },
      {
        $inc: { count: 1 },
        $setOnInsert: { key, windowStart: now, expireAt },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const count = doc?.count ?? 1;
    const remaining = Math.max(0, limit - count);
    const resetInMs = doc
      ? Math.max(0, doc.windowStart.getTime() + windowMs - now.getTime())
      : windowMs;

    return { allowed: count <= limit, remaining, resetInMs };
  } catch (err: any) {
    // Duplicate key on concurrent upsert — harmless, just re-read
    if (err.code === 11000) {
      const doc = await RateLimit.findOne({ key, windowStart: { $gte: windowStart } });
      if (doc) {
        return {
          allowed: doc.count <= limit,
          remaining: Math.max(0, limit - doc.count),
          resetInMs: Math.max(0, doc.windowStart.getTime() + windowMs - now.getTime()),
        };
      }
    }
    // On unexpected errors, fail open so users aren't blocked by DB issues
    console.error("[RateLimit] Error:", err.message);
    return { allowed: true, remaining: limit, resetInMs: windowMs };
  }
}
