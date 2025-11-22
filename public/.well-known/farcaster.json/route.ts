// app/.well-known/farcaster.json/route.ts
export async function GET() {
  return Response.json({
    accountAssociation: {
      header: '',
      payload: '',
      signature: '',
    },
    baseBuilder: {
      // Base Build 계정의 주소
      ownerAddress: '0x8eebd42e9b7eb0b29a3757c637bf8feb328b3f8a',
    },
    miniapp: {
      version: '1',
      name: 'PolyCast',
      homeUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/',
      iconUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/icon.png',
      splashImageUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/splash.png',
      splashBackgroundColor: '#0F172A', // 네이비 같은 거
      webhookUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/api/webhook', // 없으면 나중에 null 처리해도 됨
      subtitle: 'One Cast, Many Languages',
      description:
        'Write once, cast to the world. Translate your Farcaster posts into many languages in one click.',
      screenshotUrls: [
        'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/screenshots/s1.png',
        'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/screenshots/s2.png',
      ],
      primaryCategory: 'social',
      tags: ['polycast', 'miniapp', 'translation', 'base'],
      heroImageUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/og.png',
      tagline: 'One Cast, Many Languages',
      ogTitle: 'PolyCast – Global Farcaster Casting',
      ogDescription: 'Translate and cast in many languages with one click.',
      ogImageUrl: 'https://polycast-ehbdes803-yhhs-projects-36cbd044.vercel.app/og.png',
      noindex: true,
    },
  })
}
