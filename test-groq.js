require("dotenv").config({ path: ".env.local" });
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const prompt = `You are an elite YouTube growth strategist who has studied thousands of viral faceless channels across every niche.

Given a niche and platform type (shorts or long), generate exactly 10 viral video ideas.

Return a JSON object with this exact shape:
{
  "ideas": [
    {
      "title": "string — punchy, click-worthy title optimised for the platform",
      "category": "string — content category (e.g. Listicle, Story, Myth-Busting, Comparison, How-To, Shocking Facts, Emotional, Contrarian, Tutorial, Trend)",
      "viralityScore": number (1-100, based on trend potential, curiosity gap, emotional pull, and shareability),
      "reason": "string — one concise sentence explaining WHY this idea would go viral"
    }
  ],
  "niche": "string — echo back the niche",
  "platform": "shorts" | "long"
}

Rules for SHORTS ideas:
- Titles must be ultra-punchy, under 50 characters when possible
- Ideas should deliver a single powerful insight or twist in under 60 seconds
- Prioritise shock value, curiosity gaps, and emotional hooks
- Think TikTok-brain: instant dopamine, no slow burns

Rules for LONG-FORM ideas:
- Titles can be up to 70 characters, optimised for YouTube search
- Ideas should sustain 8-15 minutes of engaging content
- Include narrative arcs, deep dives, or list formats that build momentum
- Think binge-worthy: "I can't stop watching" energy

Universal rules:
- Every title must create an irresistible curiosity gap
- Avoid generic clickbait — be specific and bold
- Mix categories: don't repeat the same format twice in a row
- At least 3 ideas must score 80+ virality
- Reason must reference a specific psychological trigger (curiosity, FOMO, outrage, awe, nostalgia, etc.)
- Sort ideas by viralityScore descending (highest first)

CRITICAL FORMATTING RULES:
- Respond ONLY with valid JSON. No markdown, no code fences, no explanation.
- Do NOT wrap the response in \`\`\`json blocks.
- The response must parse with JSON.parse() without any preprocessing.`;

async function main() {
  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Niche: finance\nPlatform: shorts\nGenerate 10 viral ideas." }
    ],
    response_format: { type: "json_object" } // Add this!
  });
  console.log(response.choices[0].message.content);
}
main();
