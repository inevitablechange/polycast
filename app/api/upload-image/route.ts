import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs' // Blob + Buffer 쓸 거라 edge 말고 nodejs로 고정

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

    // 6) Vercel Blob 업로드
    const blob = await put(blobKey, file, {
      access: 'public',
      token,
      // ⚠️ contentType 을 명시해서 응답 헤더가 확실히 이미지로 나가게
      contentType: file.type,
    })

    // ❌ filename 쿼리 안 붙이고, 그냥 blob.url 그대로 사용
    const imageUrl = blob.url

    return NextResponse.json({
      url: imageUrl,
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
