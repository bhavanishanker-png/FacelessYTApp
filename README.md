# Velora AI — Faceless YouTube Automation SaaS

An end-to-end AI pipeline that turns a niche topic into a fully rendered, ready-to-publish YouTube video — no camera, no editing software required.

## What it does

1. **Idea Generation** — RAG-powered idea engine retrieves high-performing viral content examples from a MongoDB knowledge base, then feeds them to an LLM to generate niche-specific, clickable video ideas.
2. **Hook Writing** — TF-IDF retrieval over 25 proven hook formulas injects the most relevant psychological triggers into the LLM prompt.
3. **Script Writing** — Full narration script generated and stored per project.
4. **Voice / Audio** — Text-to-speech narration with subtitle generation.
5. **Scene Images** — Async batch image generation via Pollinations.ai (flux / flux-realism / flux-anime), uploaded to Cloudinary, with real-time polling progress.
6. **Composition** — Asset validation step that checks audio, images, subtitles, and scene timeline before proceeding.
7. **Editor** — Inline subtitle editor with scene thumbnail scrubbing.
8. **Render** — FFmpeg-powered video composition with cancel support, stored in Cloudinary.
9. **Publish** — Direct YouTube upload or scheduled publish via YouTube Data API.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Database | MongoDB + Mongoose |
| Auth | NextAuth v4 (Credentials + Google OAuth) |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Image Gen | Pollinations.ai (free, no API key) |
| Storage | Cloudinary |
| TTS | Google Cloud TTS / Deepgram |
| Video | FFmpeg |
| RAG | TF-IDF cosine similarity (zero dependencies) |

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
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GROQ_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CRON_SECRET=          # optional — secures the YouTube cron route
```

## Project structure

```
app/
  api/
    ai/               # Core AI pipeline endpoints
      ideas/          # RAG-enhanced idea generation
      hooks/          # RAG hook formula retrieval
      script/         # LLM script generation
      voice/          # TTS + subtitle generation
      images/         # Async image generation (fire-and-forget + polling)
      render/         # FFmpeg render with cancel support
      render/status/  # Render progress polling
    project/          # Project CRUD (create, list, get, update-step, duplicate)
    youtube/          # OAuth, upload, schedule, best-times
    auth/             # NextAuth + registration
  dashboard/          # Project list + library
  project/[id]/       # Multi-step workspace

components/
  IdeaStepPanel       # Idea selection UI
  HookStepPanel       # Hook generation UI
  ScriptStepPanel     # Script editor
  VoiceStepPanel      # TTS controls
  ScenesStepPanel     # Scene builder
  ImagesStepPanel     # Image generation with real-time progress
  CompositionStepPanel# Asset validation
  EditorStepPanel     # Subtitle editor + scene thumbnails
  RenderStepPanel     # Render controls with cancel
  VideoStepPanel      # Final video + YouTube publish

lib/
  rag/
    retriever.ts              # Hook formula TF-IDF retriever
    viralContentRetriever.ts  # Viral content TF-IDF retriever
    hookFormulas.ts           # 25 hook formula seed data
    viralContentSeed.ts       # 30 viral content seed entries
  renderStore.ts      # In-memory FFmpeg process registry
  rateLimit.ts        # MongoDB-backed sliding-window rate limiter
  db.ts               # Mongoose connection

models/
  User.ts
  Project.ts
  HookFormula.ts      # RAG hook formula corpus
  ViralContent.ts     # RAG viral content knowledge base

scripts/
  seedHookFormulas.ts
  seedViralContent.ts
```

## RAG knowledge bases

### Viral Content Knowledge Base (`npm run seed:viral`)
30 curated high-performing video examples across 11 niches: Finance, Fitness, Tech/AI, Self-improvement, Business, True Crime, History, Science, Psychology, Motivation, and Philosophy. Each entry captures the hook, storytelling pattern, content structure, key insight, and viral factor. Retrieved by TF-IDF cosine similarity against the user's niche query and injected into the idea-generation prompt.

### Hook Formula Library (`npm run seed:hooks`)
25 proven hook formulas categorized by psychological trigger (curiosity gap, social proof, fear/urgency, etc.). Retrieved by TF-IDF and injected into the hook-generation prompt.

## Rate limits (per user, per minute)

| Endpoint | Limit |
|---|---|
| `/api/ai/ideas` | 10 |
| `/api/ai/hooks` | 10 |
| `/api/ai/script` | 5 |
| `/api/ai/voice` | 3 |
| `/api/ai/images` | 5 |

## Key architectural decisions

- **Async image generation** — batch image jobs fire and forget; client polls `GET /api/ai/images?projectId=` for per-image progress updated atomically in MongoDB.
- **FFmpeg cancel** — render processes are tracked in an in-memory Map; `DELETE /api/ai/render?jobId=` sends SIGTERM and resets project state.
- **Orphaned render recovery** — on status poll, if MongoDB shows `rendering` but no in-memory job exists (server restarted), the status is automatically set to `failed` so users aren't stuck.
- **Rate limiting without Redis** — MongoDB TTL index acts as a sliding-window counter that auto-expires and works across serverless instances.
- **Zero-dependency RAG** — TF-IDF cosine similarity in pure TypeScript; no embedding API, no vector database, no extra cost.
