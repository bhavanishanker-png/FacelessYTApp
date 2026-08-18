/**
 * GET /api/cron/leetcode
 * Triggered by Vercel Cron at 01:00 UTC daily.
 */

import { NextResponse } from "next/server";
import { runLeetCodePipeline } from "@/lib/leetcode/pipeline";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botUserId = process.env.LEETCODE_BOT_USER_ID;
  const baseUrl = process.env.NEXTAUTH_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!botUserId || !baseUrl || !cronSecret) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const log: string[] = [];
  try {
    const result = await runLeetCodePipeline(botUserId, baseUrl, cronSecret, (msg) => {
      console.log(`[LC Cron] ${msg}`);
      log.push(msg);
    });
    return NextResponse.json({ success: true, ...result, log });
  } catch (err: any) {
    console.error("[LC Cron] Fatal:", err);
    return NextResponse.json({ error: err.message, log }, { status: 500 });
  }
}
