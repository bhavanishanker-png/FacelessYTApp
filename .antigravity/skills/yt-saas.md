---
name: yt-saas
description: >
  Activate when working on the FacelessYTApp YouTube SaaS project.
  Triggers on: video pipeline, API routes, step panels, Claude integration,
  MongoDB models, ElevenLabs voice, FFmpeg render, Remotion, Replicate images.
---

# FacelessYTApp — Project Skill

## What This Project Is
An AI-powered faceless YouTube video SaaS with an 11-step human-in-the-loop pipeline:
idea → hook → script → scenes → images → animation → voice →
subtitles → composition → editor → render

## Tech Stack
- Framework: Next.js 14 App Router + TypeScript
- Styling: Tailwind CSS v4 + Framer Motion
- Database: MongoDB + Mongoose
- Auth: NextAuth v4 (Google OAuth + Credentials)
- AI Text: Anthropic Claude API (claude-sonnet-4-20250514)
- AI Images: Replicate API (Stable Diffusion XL)
- AI Voice: ElevenLabs API
- Video Render: FFmpeg (fluent-ffmpeg) + Remotion
- Storage: AWS S3
- Deploy: Vercel + Railway (Python workers)

## Critical Architecture Rules
1. Every step lives at: app/api/project/[stepName]/route.ts
2. Every step in MongoDB has this exact shape:
   { aiOutput: "", userEditedOutput: "", status: "pending|editing|approved", version: 1 }
3. NEVER auto-advance to next step — user must click Approve first
4. All Claude responses must be valid JSON — no markdown in responses
5. Claude model: claude-sonnet-4-20250514
6. Use lib/anthropic.ts → askClaudeJSON() for all Claude calls
7. Store raw Claude output in step.aiOutput
8. Store user edits in step.userEditedOutput
9. Only use userEditedOutput when sending context to next step

## File Structure
app/api/project/
  idea/ hook/ script/ scenes/ images/ animation/
  voice/ subtitles/ composition/ editor/ render/
components/steps/
  IdeaStepPanel.tsx  HookStepPanel.tsx  ScriptStepPanel.tsx
  ScenesStepPanel.tsx  ImagesStepPanel.tsx  AnimationStepPanel.tsx
  VoiceStepPanel.tsx  SubtitlesStepPanel.tsx  CompositionStepPanel.tsx
  EditorStepPanel.tsx  RenderStepPanel.tsx
lib/
  anthropic.ts  elevenlabs.ts  replicate.ts  ffmpeg.ts  db.ts
models/
  Project.ts  User.ts

## Token Limits Per Step
idea:1500  hook:800  script:3000  scenes:2500  images:1000
animation:800  voice:500  subtitles:1000  composition:800
editor:600  render:400

## When Agent Builds a Step, Always Produce:
1. Full TypeScript route.ts with system + user message
2. Input/output interfaces
3. MongoDB update logic
4. Step panel React component
5. Error handling with { success: false, error: string }
