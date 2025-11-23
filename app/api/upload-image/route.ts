import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs' // Blob + Buffer 사용

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image')

    // 1) 필드가 없거나, File 타입이 아닐 때
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // 2) 파일 사이즈 체크
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // 3) 파일 타입 체크
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG and JPG images are allowed' }, { status: 400 })
    }

    // 4) Blob 토큰 체크
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN is missing in environment variables')
      return NextResponse.json({ error: 'Blob token not configured on server' }, { status: 500 })
    }

    // 5) 파일 이름 sanitize
    const cleanedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') || 'image.jpg'
    const blobKey = `${Date.now()}-${cleanedName}`

    // 6) Vercel Blob 업로드 (public)
    const blob = await put(blobKey, file, {
      access: 'public',
      token,
    })

    // 7) 원본 Blob URL을 base64url로 인코딩해서 /api/image/[id] 프록시 URL 만들기
    const encoded = Buffer.from(blob.url).toString('base64url')
    const proxyUrl = `/api/image/${encoded}`

    return NextResponse.json({
      url: proxyUrl, // 프론트에서 이걸 imageUrl + embeds 로 사용
      blobUrl: blob.url, // 필요하면 디버깅용
      fileName: cleanedName,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json(
      {
        error: 'Failed to upload image',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
