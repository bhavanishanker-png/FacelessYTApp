/**
 * One-time seed script — populates the HookFormula collection.
 * Run with:  npx tsx scripts/seedHookFormulas.ts
 *
 * Safe to re-run: skips formulas that already exist by `id`.
 */

import { connectDB } from "../lib/db";
import HookFormula from "../models/HookFormula";
import { HOOK_FORMULAS } from "../lib/rag/hookFormulas";

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB.");

  let inserted = 0;
  let skipped = 0;

  for (const formula of HOOK_FORMULAS) {
    const exists = await HookFormula.exists({ id: formula.id });
    if (exists) {
      skipped++;
      continue;
    }
    await HookFormula.create(formula);
    inserted++;
    console.log(`  + inserted: ${formula.id}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
