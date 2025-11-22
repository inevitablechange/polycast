# 🌐 PolyCast - One Cast, Many Languages

Turn your cast into a global conversation with AI-powered multilingual translation.

## ✨ Features

- 🤖 **AI-Powered Generation** - Let FLock AI write your original content
- 🌍 **Multi-Language Translation** - Translate to 6 languages simultaneously
- 🎨 **Style Adaptation** - Choose between Professional, Casual, or Crypto-native tones
- 🖼️ **Image Support** - Add visuals that appear in all language versions
- 🚀 **Quick Posting** - Post all translations with one click
- 📱 **Feed Optimized** - First 320 characters optimized for preview

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd polycast
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
FLOCK_API_KEY=your_flock_api_key_here
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get API Keys:**

- FLock API Key: Sign up at [platform.flock.io](https://platform.flock.io)
- Vercel Blob Token: Create at [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
vercel deploy
```

### 5. Configure Manifest

1. Update `public/.well-known/farcaster.json` with your domain
2. Go to [base.dev/preview](https://base.dev/preview)
3. Enter your domain and verify
4. Copy the `accountAssociation` object
5. Paste it into your manifest

### 6. Publish

Post your app URL in the Base app to publish!

## 📁 Project Structure

```
polycast/
├── app/
│   ├── api/
│   │   ├── generate-original/
│   │   │   └── route.ts          # AI text generation
│   │   ├── translate/
│   │   │   └── route.ts          # Multi-language translation
│   │   └── upload-image/
│   │       └── route.ts          # Image upload to Vercel Blob
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Main app UI
│   └── globals.css               # Global styles
├── lib/
│   ├── types.ts                  # TypeScript types
│   └── constants.ts              # App constants
├── public/
│   └── .well-known/
│       └── farcaster.json        # Mini App manifest
└── package.json
```

## 🎨 Supported Languages

- 🇺🇸 English (EN)
- 🇯🇵 Japanese (JA)
- 🇰🇷 Korean (KO)
- 🇨🇳 Chinese (ZH)
- 🇪🇸 Spanish (ES)
- 🇫🇷 French (FR)

## 🎭 Style Options

- **Professional** - Formal and informative tone
- **Casual** - Friendly and conversational (default)
- **Crypto-native** - Web3 savvy and punchy

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI/Translation**: FLock API
- **Image Storage**: Vercel Blob
- **Farcaster**: MiniKit SDK
- **Hosting**: Vercel

## 📝 Usage Flow

1. **Create Content**

   - Type directly or use AI generation
   - Add an image (optional)

2. **Select Languages**

   - Choose up to 5 target languages
   - Pick your preferred tone

3. **Translate**

   - Click "Cast to World"
   - Review translations

4. **Post**
   - Post individually or use "Go Global"
   - Each language opens in Composer
   - Review and publish

## 🚀 API Endpoints

### Generate Original Text

```
POST /api/generate-original
Body: { topic: string, style: string }
Response: { originalText: string, previewText: string }
```

### Translate Text

```
POST /api/translate
Body: { text: string, targetLanguages: string[], style: string }
Response: { translations: { [lang]: { text, previewText, charCount } } }
```

### Upload Image

```
POST /api/upload-image
Body: FormData with 'image' file
Response: { url: string, fileName: string, fileSize: number }
```

## 🎯 Roadmap

- [ ] AI image generation
- [ ] Thread translation
- [ ] Translation history
- [ ] More languages (Vietnamese, Thai, etc.)
- [ ] Performance analytics
- [ ] Team collaboration features

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 💬 Support

For issues or questions, please open a GitHub issue.

---

**PolyCast** - Breaking through language barriers, one cast at a time. 🌍✨
