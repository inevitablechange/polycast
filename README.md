# PolyCast — One Cast, Many Languages

A Mini App that automates multilingual posts on Farcaster: AI generation, multi-language translation, image handling, and per-language publishing with activity logging.

## Problem

Farcaster is growing globally, but content distribution remains English-centric. Non-English creators face friction:

- Write original post
- Translate via external tools (GPT / DeepL)
- Copy & paste for each language
- Repeat composer steps per language
- Re-attach images per language

This multi-step workflow is time-consuming and a barrier for creators who want global reach.

## Solution

PolyCast automates the full multilingual publishing flow for Farcaster:

- Generate original copy with FLock AI from a keyword
- Translate into multiple languages automatically
- Upload and attach images once (Vercel Blob)
- Create editable translation cards per language
- Post per language using Base MiniKit composeCast()
- Log activity in Supabase for profiles and leaderboards

Result: one input → many language posts → automated upload → activity tracking.

## Core Features

- AI Original Content (FLock)
- Multi-language translation (EN, KO, JA, ZH, ES, FR + planned TH, VI)
- Style presets: Professional, Casual, Crypto-native
- Image upload & unified handling (Vercel Blob)
- Translation cards: edit, preview, attach image per language
- Post per Language via composeCast()
- Supabase activity logs → Profile & Leaderboard

## UX Flow

1. Create or generate original content
2. Upload an image (optional)
3. Select target languages and style
4. Translate All → generate language cards
5. Edit each card and preview
6. Post per Language (composeCast())
7. On success, log activity to Supabase
8. View results in My Profile and Leaderboard

## Architecture

- Next.js 14 (App Router) + Tailwind CSS — UI and Mini App runtime
- FLock API — AI generation & translation
- Vercel Blob — image storage + public URLs
- Base MiniKit SDK — composeCast(), viewCast(), openUrl actions
- Supabase (Postgres) — activity logging, leaderboard, profiles

Data flow:
User Input → AI Generation / Image Upload → Translation Cards → Post per Language → Farcaster → Supabase Logging → Profile / Leaderboard

## Pages

- Main Page: generate, upload image, choose languages, Translate All, language cards, Post per Language
- Leaderboard: global creator rankings (language usage, volume)
- My Profile: FID, avatar, stats, recent activities, PolyCast posts
- Settings: About, Feedback, Theme, Account

## API Endpoints (project)

- POST /api/generate-original
  Body: { topic: string, style: string }
  Response: { originalText: string, previewText: string }

- POST /api/translate
  Body: { text: string, targetLanguages: string[], style: string }
  Response: { translations: { [lang]: { text, previewText, charCount } } }

- POST /api/upload-image
  Body: FormData with 'image' file
  Response: { url: string, fileName: string, fileSize: number }

## Setup

1. Clone and install
   git clone <your-repo>
   cd polycast
   npm install

2. Environment (.env.local)
   FLOCK_API_KEY=your_flock_api_key_here
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key

3. Dev
   npm run dev
   Open: http://localhost:3000

4. Deploy
   vercel deploy

5. Manifest (Base / Farcaster)
   - Update public/.well-known/farcaster.json with domain
   - Verify at base.dev/preview and paste accountAssociation into manifest

## Roadmap

- AI image generation
- Thread translation
- Translation history & undo
- More languages (Vietnamese, Thai, etc.)
- Performance analytics
- Team collaboration features

## Differentiators

- End-to-end publishing automation (not just translation)
- Native Base Mini App UX (composeCast)
- Image + text optimized for Farcaster
- Activity logging + leaderboard for creator incentives

## Expected Impact

- Reduce multilingual posting overhead by 80–90%
- Increase global reach for non-English creators
- Boost Farcaster multilingual content and Base Mini App adoption

## Contributing

Contributions welcome. Please open an issue or PR.

## License

MIT

## Contact / Support

Open a GitHub issue for bugs, feature requests, or questions.

PolyCast — Breaking through language barriers, one cast at a time.
// ...existing code...
