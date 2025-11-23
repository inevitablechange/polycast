import { NextRequest, NextResponse } from 'next/server'

const FLOCK_API_URL = 'https://api.flock.io/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { topic, style } = await request.json()

    if (!topic || !style) {
      return NextResponse.json({ error: 'Topic and style are required' }, { status: 400 })
    }

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
            content: `You are a professional social media content creator for Farcaster.

Generate a single, well-structured cast as plain text only.

Hard rules:
- Do NOT include any labels or headings like "CAST", "CAST (Farcaster):" or similar.
- Do NOT use markdown formatting (no **bold**, lists, or numbered sections).
- Do NOT use emojis.
- Output only the cast body text, nothing else.
- If not mentioned, write in the language of the topic

The first 320 characters will appear in the feed preview, so make the opening sentence strong and self-contained.

Topic: ${topic}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      throw new Error(`FLock API error: ${response.statusText}`)
    }

    const data = await response.json()
    // 서버 터미널에 Flock 원본 응답 전체 로깅
    console.log('Flock generate-original raw response:', JSON.stringify(data, null, 2))

    // Flock 응답 구조에 맞춰 choices[0].message.content 에서 텍스트 추출
    const originalText = (data.choices?.[0]?.message?.content as string | undefined) || ''

    return NextResponse.json({
      originalText,
      previewText: originalText.substring(0, 320),
    })
  } catch (error) {
    console.error('Generate original error:', error)
    return NextResponse.json({ error: 'Failed to generate original text' }, { status: 500 })
  }
}
