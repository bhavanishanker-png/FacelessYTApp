/**
 * GET /api/ai/model
 *
 * Reports which LLM is currently serving generations, so the UI can show it.
 * Weekdays → Claude, weekends → Groq (see lib/ai/provider.ts).
 *
 * Returns: { success: true, data: ActiveModelInfo }
 */

import { NextResponse } from "next/server";
import { activeModel } from "@/lib/ai";

// Depends on the current day, so it must not be statically cached.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ success: true, data: activeModel() }, { status: 200 });
}
