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
        model: 'qwen3-30b-a3b-instruct-2507',
        messages: [
          {
            role: 'system',
            content: `You are a professional social media content creator. Generate a well-structured, informative Farcaster cast with a compelling opening sentence. The first 320 characters will appear in the feed preview, so make them count. Topic: ${topic}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`FLock API error: ${response.statusText}`)
    }

    const data = await response.json()
    const originalText = data.content?.[0]?.text || ''

    return NextResponse.json({
      originalText,
      previewText: originalText.substring(0, 320),
    })
  } catch (error) {
    console.error('Generate original error:', error)
    return NextResponse.json({ error: 'Failed to generate original text' }, { status: 500 })
  }
}
