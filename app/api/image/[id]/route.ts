import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type RouteParams = {
  params: {
    id: string
  }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'Missing image id' }, { status: 400 })
  }

  let blobUrl: string

  try {
    // 업로드 시 Buffer.from(blob.url).toString('base64url') 한 걸 되돌리기
    blobUrl = Buffer.from(id, 'base64url').toString('utf8')
  } catch (e) {
    console.error('Failed to decode blob url from id:', e)
    return NextResponse.json({ error: 'Invalid image id' }, { status: 400 })
  }

  try {
    const blobRes = await fetch(blobUrl)

    if (!blobRes.ok) {
      console.error('Blob fetch failed:', blobRes.status, blobRes.statusText)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const contentType = blobRes.headers.get('content-type') || 'image/jpeg'

    // 이미지가 아닌 경우 방어
    if (!contentType.startsWith('image/')) {
      console.error('Blob content-type is not image/*:', contentType)
      return NextResponse.json({ error: 'Invalid image content-type' }, { status: 400 })
    }

    const arrayBuffer = await blobRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType, // Warpcast 가 이걸 보고 이미지로 인식
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Proxy image error:', error)
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 })
  }
}
