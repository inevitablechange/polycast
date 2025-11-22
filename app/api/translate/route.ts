import { NextRequest, NextResponse } from 'next/server'
import { Language } from '@/lib/types'
import { languageNames } from '@/lib/i18n'

const FLOCK_API_URL = 'https://api.flock.io/v1/chat/completions'

const styleDescriptions = {
  professional: 'professional and informative',
  casual: 'casual and engaging',
  'crypto-native': 'crypto-native and punchy',
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguages, style } = await request.json()

    if (!text || !targetLanguages || !Array.isArray(targetLanguages)) {
      return NextResponse.json({ error: 'Text and target languages are required' }, { status: 400 })
    }

    const translations: Record<string, any> = {}

    for (const lang of targetLanguages) {
      const response = await fetch(FLOCK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-litellm-api-key': process.env.FLOCK_API_KEY || '',
        },
        body: JSON.stringify({
          model: 'qwen3-235b-a22b-thinking-2507',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator specializing in social media content. Translate the following text to ${
                languageNames.en[lang as Language]
              } in a ${
                styleDescriptions[style as keyof typeof styleDescriptions]
              } tone suitable for Farcaster.

CRITICAL: Make the first sentence impactful and attention-grabbing, as the first 320 characters will be displayed in the feed preview. The opening should hook readers immediately.
Hard rules:
- Do NOT include any labels or headings like "CAST", "CAST (Farcaster):" or similar.
- Do NOT use markdown formatting (no **bold**, lists, or numbered sections).
- Do NOT use emojis.
- Output only the cast body text, nothing else.
Maintain the core message while adapting to ${
                languageNames.en[lang as Language]
              } communication style and cultural context. Use natural expressions that resonate with native speakers.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        console.error(`Translation failed for ${lang}:`, response.statusText)
        continue
      }

      const data = await response.json()

      console.log('Flock generate-translated raw response:', JSON.stringify(data, null, 2))

      // Flock 응답 구조에 맞춰 choices[0].message.content 에서 텍스트 추출
      const translatedText = (data.choices?.[0]?.message?.content as string | undefined) || ''
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
