/**
 * GET /api/leetcode/daily
 *
 * Proxy to LeetCode's public GraphQL API.
 * Returns today's daily challenge with HTML stripped for clean AI prompts.
 * No API key required — LeetCode's GraphQL is public.
 */

import { NextResponse } from "next/server";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const DAILY_CHALLENGE_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      link
      question {
        title
        titleSlug
        difficulty
        content
        exampleTestcases
        topicTags { name slug }
        hints
        acRate
      }
    }
  }
`;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function GET() {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; VeloraAI/1.0)",
        "Referer": "https://leetcode.com",
      },
      body: JSON.stringify({ query: DAILY_CHALLENGE_QUERY }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const challenge = json?.data?.activeDailyCodingChallengeQuestion;

    if (!challenge) {
      return NextResponse.json({ error: "No daily challenge found in LeetCode response" }, { status: 404 });
    }

    const q = challenge.question;

    return NextResponse.json({
      success: true,
      problem: {
        date: challenge.date,
        url: `https://leetcode.com${challenge.link}`,
        title: q.title,
        slug: q.titleSlug,
        difficulty: q.difficulty,
        content: stripHtml(q.content ?? ""),
        examples: q.exampleTestcases ?? "",
        tags: (q.topicTags ?? []).map((t: any) => t.name),
        hints: q.hints ?? [],
        acceptanceRate: q.acRate ?? null,
      },
    });
  } catch (err: any) {
    console.error("[LeetCode Daily]", err.message);
    return NextResponse.json(
      { error: `Failed to fetch LeetCode daily problem: ${err.message}` },
      { status: 500 }
    );
  }
}
