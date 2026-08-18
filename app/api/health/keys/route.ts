import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type CheckResult = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

async function checkAnthropic(): Promise<CheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { key: "anthropic", label: "Anthropic (Claude)", ok: false, detail: "ANTHROPIC_API_KEY not set" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const count = data.data?.length ?? "?";
      return { key: "anthropic", label: "Anthropic (Claude)", ok: true, detail: `${count} models available` };
    }
    const body = await res.json().catch(() => ({}));
    return { key: "anthropic", label: "Anthropic (Claude)", ok: false, detail: body.error?.message ?? `HTTP ${res.status}` };
  } catch (e: any) {
    return { key: "anthropic", label: "Anthropic (Claude)", ok: false, detail: e.message };
  }
}

async function checkGroq(): Promise<CheckResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return [
      { key: "groq_llm", label: "Groq LLM", ok: false, detail: "GROQ_API_KEY not set" },
      { key: "groq_whisper", label: "Groq Whisper", ok: false, detail: "GROQ_API_KEY not set" },
    ];
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error?.message ?? `HTTP ${res.status}`;
      return [
        { key: "groq_llm", label: "Groq LLM", ok: false, detail: msg },
        { key: "groq_whisper", label: "Groq Whisper", ok: false, detail: msg },
      ];
    }
    const data = await res.json();
    const models: string[] = data.data?.map((m: any) => m.id) ?? [];
    const hasLLM = models.some((m) => m.includes("gpt") || m.includes("llama") || m.includes("mixtral"));
    const hasWhisper = models.some((m) => m.includes("whisper"));
    return [
      { key: "groq_llm", label: "Groq LLM", ok: hasLLM, detail: hasLLM ? `${models.filter(m => !m.includes("whisper")).length} models` : "No LLM models found" },
      { key: "groq_whisper", label: "Groq Whisper", ok: hasWhisper, detail: hasWhisper ? "whisper-large-v3 available" : "Whisper not available on this key" },
    ];
  } catch (e: any) {
    return [
      { key: "groq_llm", label: "Groq LLM", ok: false, detail: e.message },
      { key: "groq_whisper", label: "Groq Whisper", ok: false, detail: e.message },
    ];
  }
}

async function checkDeepgram(): Promise<CheckResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) return { key: "deepgram", label: "Deepgram TTS", ok: false, detail: "DEEPGRAM_API_KEY not set" };
  try {
    const res = await fetch("https://api.deepgram.com/v1/projects", {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const count = data.projects?.length ?? 0;
      return { key: "deepgram", label: "Deepgram TTS", ok: true, detail: `${count} project(s) on account` };
    }
    return { key: "deepgram", label: "Deepgram TTS", ok: false, detail: `HTTP ${res.status}` };
  } catch (e: any) {
    return { key: "deepgram", label: "Deepgram TTS", ok: false, detail: e.message };
  }
}

async function checkHuggingFace(): Promise<CheckResult> {
  const apiKey = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return { key: "huggingface", label: "HuggingFace (SD3)", ok: false, detail: "HF_TOKEN not set" };
  try {
    const res = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return { key: "huggingface", label: "HuggingFace (SD3)", ok: true, detail: `Logged in as ${data.name ?? data.fullname ?? "user"}` };
    }
    return { key: "huggingface", label: "HuggingFace (SD3)", ok: false, detail: `HTTP ${res.status} — invalid token` };
  } catch (e: any) {
    return { key: "huggingface", label: "HuggingFace (SD3)", ok: false, detail: e.message };
  }
}

async function checkCloudinary(): Promise<CheckResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { key: "cloudinary", label: "Cloudinary (Storage)", ok: false, detail: "Missing CLOUDINARY_* env vars" };
  }
  try {
    const creds = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: { Authorization: `Basic ${creds}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const usedGB = ((data.storage?.usage ?? 0) / (1024 ** 3)).toFixed(2);
      return { key: "cloudinary", label: "Cloudinary (Storage)", ok: true, detail: `${usedGB} GB used · cloud: ${cloudName}` };
    }
    return { key: "cloudinary", label: "Cloudinary (Storage)", ok: false, detail: `HTTP ${res.status}` };
  } catch (e: any) {
    return { key: "cloudinary", label: "Cloudinary (Storage)", ok: false, detail: e.message };
  }
}

async function checkMongoDB(): Promise<CheckResult> {
  try {
    const { connectDB } = await import("@/lib/db");
    await connectDB();
    return { key: "mongodb", label: "MongoDB", ok: true, detail: "Connected to cluster" };
  } catch (e: any) {
    return { key: "mongodb", label: "MongoDB", ok: false, detail: e.message };
  }
}

async function checkPollinations(): Promise<CheckResult> {
  try {
    const res = await fetch("https://image.pollinations.ai/models", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { key: "pollinations", label: "Pollinations (Image fallback)", ok: true, detail: "Free tier reachable" };
    return { key: "pollinations", label: "Pollinations (Image fallback)", ok: false, detail: `HTTP ${res.status}` };
  } catch (e: any) {
    return { key: "pollinations", label: "Pollinations (Image fallback)", ok: false, detail: e.message };
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [anthropic, groq, deepgram, huggingface, cloudinary, mongodb, pollinations] = await Promise.all([
    checkAnthropic(),
    checkGroq(),
    checkDeepgram(),
    checkHuggingFace(),
    checkCloudinary(),
    checkMongoDB(),
    checkPollinations(),
  ]);

  const results: CheckResult[] = [
    anthropic,
    ...groq,
    deepgram,
    huggingface,
    cloudinary,
    mongodb,
    pollinations,
  ];

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ results, allOk });
}
