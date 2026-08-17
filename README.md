# Velora AI — Faceless YouTube Automation SaaS

An end-to-end AI pipeline that turns a niche topic into a fully rendered, ready-to-publish YouTube video — no camera, no editing software required.

## What it does

The pipeline runs as an 11-step progressive workflow:

1. **Idea Generation** — RAG retrieves 30 curated viral content examples from MongoDB (TF-IDF cosine similarity), injects them as context, and generates 10 niche-specific video ideas scored by virality.
2. **Hook Writing** — TF-IDF retrieval over 25 proven hook formulas injects psychological triggers into the prompt. Output passes through the **Critic-Refiner agent loop** before returning.
3. **Script Writing** — Full narration script generated for the selected hook and format (shorts/long). Also runs the **Critic-Refiner agent loop** to self-improve before returning.
4. **Scene Breakdown** — Script is decomposed into 10–15 visual scenes, each with narration text, a visual description, an AI image prompt, duration, and transition type.
5. **Image Generation** — Async batch image generation via HuggingFace SD3 (`router.huggingface.co`) → Pollinations fallback. Fire-and-forget with real-time per-scene progress polling.
6. **Animation** — Ken Burns / pan animation preset selection applied during render.
7. **Voice / Audio** — Deepgram Aura TTS narration generated from the script. Audio stored on Cloudinary.
8. **Subtitles** — Groq Whisper transcribes the audio into timed word-level captions, chunked into 5-word / 3-second segments.
9. **Composition** — Asset validation gate: checks that audio, images, subtitles, and scene timeline are all present before render is allowed.
10. **Editor** — Inline subtitle text editor with scene thumbnail scrubbing.
11. **Render** — FFmpeg composites images (Ken Burns), mixes audio, burns subtitles (ASS format), and uploads the final video to Cloudinary. Supports cancel mid-render. Direct YouTube upload or scheduled publish via YouTube Data API.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Database | MongoDB + Mongoose |
| Auth | NextAuth v4 (Credentials + Google OAuth) |
| LLM | Claude Opus 5 (weekdays) · Groq GPT-OSS 120B (weekends) |
| Agentic AI | Critic-Refiner loop (`lib/ai/criticRefiner.ts`) |
| RAG | TF-IDF cosine similarity — zero dependencies, no vector DB |
| Image Gen | HuggingFace SD3 via `router.huggingface.co` → Pollinations fallback |
| TTS | Deepgram Aura |
| Subtitles | Groq Whisper (via OpenAI-compatible API) |
| Storage | Cloudinary |
| Video | FFmpeg |

## Getting started

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local

# Seed the RAG knowledge bases
npm run seed:hooks      # 25 hook formula templates
npm run seed:viral      # 30 viral content examples across 11 niches

# Start the dev server (always port 3000)
npm run dev
```

## Environment variables

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Database
MONGODB_URI=

# LLM — weekdays use Claude, weekends use Groq (set AI_PROVIDER to override)
ANTHROPIC_API_KEY=
GROQ_API_KEY=                # also used for Whisper subtitle transcription

# Image generation — free at huggingface.co/settings/tokens (Read access)
# Both vars hold the same token; HF_TOKEN is HuggingFace's canonical name
HUGGINGFACE_API_KEY=
HF_TOKEN=

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth (NextAuth + YouTube)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Cloud TTS service account (YouTube Data API access)
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=

# TTS
DEEPGRAM_API_KEY=

# Optional overrides
CRON_SECRET=        # bearer token that secures the YouTube cron upload route
AI_PROVIDER=        # force "anthropic" or "groq" (default: auto by weekday)
AI_SCHEDULE_TZ=     # e.g. "Asia/Kolkata" — pins weekday boundary to a timezone
AI_FALLBACK=        # set to "off" to disable Claude → Groq automatic fallback
```

## Project structure

```
app/
  api/
    ai/
      ideas/          # RAG-enhanced viral idea generation
      hooks/          # RAG hook retrieval + Critic-Refiner loop
      script/         # Script generation + Critic-Refiner loop
      scenes/         # Scene breakdown from script
      images/         # Async batch image gen (HF SD3 → Pollinations fallback)
      voice/          # Deepgram Aura TTS narration
      subtitles/      # Groq Whisper transcription → timed captions
      render/         # FFmpeg video composition (async + cancel)
      render/status/  # Render job progress polling
      model/          # Reports currently active LLM provider
    project/
      route.ts        # List projects
      create/         # Create project
      [id]/           # Get / rename / delete project
      update-step/    # Advance workflow step with validation
      duplicate/      # Clone project
    youtube/
      auth/           # Initiate YouTube OAuth
      callback/       # Receive YouTube OAuth tokens
      channels/       # List connected channels
      upload/         # Upload video immediately
      schedule/       # Schedule upload for later
      analytics/      # YouTube Analytics API
      best-times/     # Optimal posting time heuristic
    auth/
      [...nextauth]/  # NextAuth (Google OAuth + Credentials)
      register/       # Email/password registration
    cron/youtube/     # Cron job — uploads all scheduled-and-due projects
    health/           # DB connectivity health check
  dashboard/          # Project list + library
  project/[id]/       # Multi-step workspace

components/
  ProjectWorkspace        # Workspace shell — routes between step panels
  StepperNavigation       # 11-step left sidebar nav
  IdeaStepPanel           # Step 1 — idea selection
  HookStepPanel           # Step 2 — hook generation + editor
  ScriptStepPanel         # Step 3 — script generation + inline rewrite
  ScenesStepPanel         # Step 4 — scene breakdown editor
  ImagesStepPanel         # Step 5 — image generation + progress polling
  AnimationStepPanel      # Step 6 — animation preset selector
  VoiceStepPanel          # Step 7 — TTS voice selection + generation
  SubtitlesStepPanel      # Step 8 — subtitle generation + preview
  CompositionStepPanel    # Step 9 — asset validation gate
  EditorStepPanel         # Step 10 — subtitle text editor
  RenderStepPanel         # Step 11 — render trigger + progress + YouTube publish

lib/
  ai/
    index.ts              # Public API — re-exports everything
    provider.ts           # LLM dispatcher (Claude weekdays / Groq weekends + fallback)
    prompts.ts            # All system prompts (writer + critic)
    types.ts              # Shared output types for every pipeline step
    criticRefiner.ts      # Critic-Refiner agent loop
  rag/
    retriever.ts              # Hook formula TF-IDF retriever
    viralContentRetriever.ts  # Viral content TF-IDF retriever
    hookFormulas.ts           # 25 hook formula seed data (seed script only)
    viralContentSeed.ts       # 30 viral content seed entries (seed script only)
  cloudinary.ts         # Cloudinary client singleton
  storage.ts            # uploadBufferToCloudinary helper
  db.ts                 # Mongoose connection singleton
  rateLimit.ts          # MongoDB-backed sliding-window rate limiter
  renderStore.ts        # In-memory FFmpeg process registry

models/
  User.ts               # User schema (auth + YouTube channel tokens)
  Project.ts            # Full 11-step pipeline state per project
  HookFormula.ts        # RAG hook formula corpus
  ViralContent.ts       # RAG viral content knowledge base

scripts/
  seedHookFormulas.ts   # npm run seed:hooks
  seedViralContent.ts   # npm run seed:viral
```

## RAG knowledge bases

### Viral Content Knowledge Base (`npm run seed:viral`)
30 curated high-performing video examples across 11 niches: Finance, Fitness, Tech/AI, Self-improvement, Business, True Crime, History, Science, Psychology, Motivation, and Philosophy. Each entry captures the hook, storytelling pattern, content structure, key insight, and viral factor. Retrieved by TF-IDF cosine similarity against the user's niche + platform query and injected into the idea-generation prompt.

### Hook Formula Library (`npm run seed:hooks`)
25 proven hook formulas categorised by psychological trigger (curiosity gap, social proof, fear/urgency, etc.). Retrieved by TF-IDF and injected into the hook-generation prompt.

## Rate limits (per user, per minute)

| Endpoint | Limit |
|---|---|
| `/api/ai/ideas` | 10 |
| `/api/ai/hooks` | 10 |
| `/api/ai/script` | 5 |
| `/api/ai/scenes` | 5 |
| `/api/ai/voice` | 3 |
| `/api/ai/images` | 5 |
| `/api/ai/subtitles` | 5 |
| `/api/ai/render` | 3 |

Rate limits are enforced by a MongoDB TTL index acting as a sliding-window counter — no Redis required, works across serverless instances.

## Agentic AI: Critic-Refiner loop

Hooks and scripts run through a two-agent loop before the response is returned:

```
Writer Agent  →  first draft
     ↓
Critic Agent  →  scores 1-10, lists weaknesses + exact rewrite instructions
     ↓ (if score < 7)
Refiner Agent →  rewrites guided by the critique
     ↓
Critic Agent  →  re-scores (max 2 iterations total)
     ↓
Return best version + agentMeta { score, iterations, improved, strengths, weaknesses }
```

Every response from `/api/ai/hooks` and `/api/ai/script` includes an `agentMeta` field:

```json
{
  "agentMeta": {
    "score": 8,
    "iterations": 2,
    "improved": true,
    "strengths": ["strong curiosity gap in hook 1", "varied styles across all 5"],
    "weaknesses": ["hook 3 exceeded 40 words"]
  }
}
```

The loop is capped at 2 iterations to control API cost. The threshold is 7/10 — anything below triggers an automatic rewrite.

## Key architectural decisions

- **Critic-Refiner agent loop** — hooks and scripts self-improve via a Critic → Refiner → Critic cycle before the response is returned; see `lib/ai/criticRefiner.ts`.
- **LLM schedule** — Claude Opus 5 on weekdays, Groq GPT-OSS 120B on weekends. Automatic Groq fallback if Claude fails. Override with `AI_PROVIDER=anthropic|groq`.
- **Image gen fallback chain** — HuggingFace SD3 (`router.huggingface.co`) is tried first; on network error or rate limit it falls back to Pollinations automatically with no config change needed.
- **Async image generation** — batch image jobs fire and forget; client polls `GET /api/ai/images?projectId=` for per-scene progress updated atomically in MongoDB.
- **FFmpeg cancel** — render processes are tracked in an in-memory Map; `DELETE /api/ai/render?jobId=` sends SIGTERM and resets project state.
- **Orphaned render recovery** — on status poll, if MongoDB shows `rendering` but no in-memory job exists (server restarted), the status is automatically reset to `failed` so users aren't stuck.
- **Zero-dependency RAG** — TF-IDF cosine similarity in pure TypeScript; no embedding API, no vector database, no extra cost.
