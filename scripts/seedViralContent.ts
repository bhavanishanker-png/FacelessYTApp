import { connectDB } from "../lib/db";
import ViralContent from "../models/ViralContent";
import { VIRAL_CONTENT } from "../lib/rag/viralContentSeed";

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB. Seeding viral content knowledge base...\n");

  let inserted = 0;
  let skipped = 0;

  for (const entry of VIRAL_CONTENT) {
    const exists = await ViralContent.findOne({ id: entry.id });
    if (exists) {
      console.log(`  ⏭  Skipping (exists): ${entry.id}`);
      skipped++;
      continue;
    }

    await ViralContent.create(entry);
    console.log(`  ✅ Inserted: ${entry.id} — "${entry.title.slice(0, 60)}..."`);
    inserted++;
  }

  console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
