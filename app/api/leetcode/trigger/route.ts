/**
 * POST /api/leetcode/trigger
 *
 * Session-protected, streams pipeline progress as Server-Sent Events.
 * Each step emits a `data: {"log":"..."}` line so the dashboard can show
 * live updates without polling.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { runLeetCodePipeline } from "@/lib/leetcode/pipeline";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Use the logged-in user's own ID — no need for LEETCODE_BOT_USER_ID on triggered runs
  const botUserId = (session.user as any).id as string;
  const cronSecret = process.env.CRON_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!cronSecret || !baseUrl) {
    return new Response(
      JSON.stringify({ error: "Missing CRON_SECRET or NEXTAUTH_URL" }),
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch { /* client disconnected */ }
      };

      try {
        const result = await runLeetCodePipeline(
          botUserId,
          baseUrl,
          cronSecret,
          (msg) => emit({ log: msg }),
          request.signal
        );
        emit({ done: true, ...result });
      } catch (err: any) {
        emit({ error: err.message ?? "Pipeline failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
