import { NextRequest, NextResponse } from 'next/server'
import { Language } from '@/lib/types'
import { languageNames } from '@/lib/i18n'

const FLOCK_API_URL = 'https://api.flock.io/v1/chat/completions'

const styleDescriptions = {
  professional: 'professional and informative',
  casual: 'casual and engaging',
  'crypto-native': 'crypto-native and punchy',
}

// FLock가 ```json ... ``` 로 감싸서 줄 수도 있어서 방지용
function extractJsonString(raw: string): string {
  let str = raw.trim()

  if (str.startsWith('```')) {
    // ```json ... ``` 형식 제거
    const firstNewline = str.indexOf('\n')
    if (firstNewline !== -1) {
      str = str.slice(firstNewline + 1)
    }
    const lastFence = str.lastIndexOf('```')
    if (lastFence !== -1) {
      str = str.slice(0, lastFence)
    }
    str = str.trim()
  }

  return str
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguages, style } = await request.json()

    if (!text || !targetLanguages || !Array.isArray(targetLanguages)) {
      return NextResponse.json({ error: 'Text and target languages are required' }, { status: 400 })
    }

    const styleDesc =
      styleDescriptions[style as keyof typeof styleDescriptions] ?? styleDescriptions.casual

    // 한 번의 completion으로 모든 언어 요청
    const response = await fetch(FLOCK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-litellm-api-key': process.env.FLOCK_API_KEY || '',
      },
      body: JSON.stringify({
        model: 'qwen3-235b-a22b-instruct-2507',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator specializing in social media content for Farcaster.',
          },
          {
            role: 'user',
            content: `
You will be given an English cast body text and a list of target languages.

Your job:
- Translate the text into EACH target language.
- The translations are intended for Farcaster feed.

Target languages (code: name):
${targetLanguages
  .map((lang: Language) => `- ${lang}: ${languageNames.en[lang as Language]}`)
  .join('\n')}

Tone & style:
- Use a ${styleDesc} tone.
- Make the FIRST sentence impactful and attention-grabbing, as the first 320 characters are shown in the feed preview.
- Maintain the core message but adapt to the natural style and cultural context of each language.
- Use natural expressions that resonate with native speakers.

Hard rules:
- DO NOT include any labels like "CAST", "CAST (Farcaster):" or similar.
- DO NOT use markdown (no **bold**, lists, numbered sections).
- DO NOT use emojis.
- Output ONLY JSON.

Output format:
Return ONLY a single JSON object, nothing else. No explanation, no markdown fences.

{
  "ja": "Japanese translation here",
  "ko": "Korean translation here",
  "es": "Spanish translation here",
  ...
}

- The keys MUST be exactly the language codes from the target list: ${targetLanguages.join(', ')}.
- Every value MUST be a string.
- Do not include any extra keys or comments.

Input text:
"""${text}"""
`.trim(),
          },
        ],
        // 언어 수 * 200 정도 넉넉하게 (필요시 조정)
        max_tokens: 200 * targetLanguages.length,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('Flock translation failed:', response.status, response.statusText)
      return NextResponse.json({ error: 'FLock translation request failed' }, { status: 500 })
    }

    const data = await response.json()
    console.log('Flock generate-translated raw response:', JSON.stringify(data, null, 2))

    const rawContent = (data.choices?.[0]?.message?.content as string | undefined) || ''
    const jsonString = extractJsonString(rawContent)

    let parsed: Record<string, string> = {}
    try {
      parsed = JSON.parse(jsonString)
    } catch (e) {
      console.error('Failed to parse FLock JSON:', e, jsonString)
      return NextResponse.json({ error: 'Failed to parse translation JSON' }, { status: 500 })
    }

    // 기존 프론트 구조(translations[lang] = { text, previewText, charCount }) 유지
    const translations: Record<string, any> = {}

    for (const lang of targetLanguages as Language[]) {
      const translatedText = parsed[lang] || ''
      translations[lang] = {
        text: translatedText,
        previewText: translatedText.substring(0, 320),
        charCount: translatedText.length,
      }
    }

    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Failed to translate text' }, { status: 500 })
  }
}
