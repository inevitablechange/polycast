import { NextRequest, NextResponse } from 'next/server'

const FLOCK_API_URL = 'https://api.flock.io/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { topic, tone } = await request.json()

    if (!topic || !tone) {
      return NextResponse.json({ error: 'Topic and tone are required' }, { status: 400 })
    }

    // Tone별 프롬프트 지시문
    const tonePrompts: Record<string, string> = {
      professional: `Translate this into the language of the topic using a professional, formal, and authoritative tone. Use polite endings. Suitable for official business announcements or press releases. Avoid slang.`,
      friendly: `Translate this into the language of the topic using a friendly, casual, and engaging tone. Write as if talking to a close friend. Use soft endings and appropriate emojis to make it feel warm.`,
      cryptoNative: `Translate this into the language of the topic using 'Crypto Native' or 'Degen' slang. Use terms like LFG, WAGMI, Based where appropriate. Keep it hype, short, and impactful. Use strict informal speech.`,
    }

    const tonePrompt = tonePrompts[tone] || tonePrompts.friendly

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
            content: `You are an expert content creator and translator for Farcaster, a decentralized social network.

Your task is to generate or translate content based on the user's input.

[GLOBAL RULES - APPLY TO ALL OUTPUTS]

1. **Platform Fit**: The output must feel native to Farcaster. Avoid generic corporate marketing speak (e.g., "In the rapidly evolving landscape...").

2. **No Fluff**: Be concise. Get straight to the point. Farcaster users value high signal-to-noise ratio.

3. **Terminology**:
   - Keep technical terms (e.g., Ethereum, L2, ZK-Rollup, DeFi, NFT, Base) in **English** if there is no widely accepted localized term, even if the target language is different.
   - Do NOT translate project names (e.g., "Optimism" remains "Optimism", not "낙관주의").
   - Do NOT translate token tickers (e.g., $DEGEN, $ETH).

4. **Formatting**:
   - Do not wrap the output in quotation marks (" ").
   - Do not add conversational fillers like "Here is the translation:" or "Sure!". Output ONLY the final content.
   - Preserve all URLs and @mentions exactly as they are.
   - Do NOT include any labels or headings like "CAST", "CAST (Farcaster):" or similar.
   - Do NOT use markdown formatting (no **bold**, lists, or numbered sections).
   - Do NOT use emojis.
   - Output only the cast body text, nothing else.

5. **Hashtags**:
   - Use hashtags sparingly. Farcaster uses channels (e.g., /base) more than hashtags.
   - Avoid generic hashtags like #crypto #blockchain #web3 unless requested.

6. **Length**: Keep the entire cast within 320 characters. The first 320 characters will appear in the feed preview, so make the opening sentence strong and self-contained.

Tone instruction: ${tonePrompt}

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
