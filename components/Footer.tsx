'use client'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <p className="text-center text-s sm:text-s text-gray-600">
          PolyCast - One Cast, Many Languages
        </p>
        <p className="flex items-center justify-center gap-2 text-s sm:text-s text-gray-600">
          Powered By
          <img src="/flockio.svg" alt="Flockio" className="inline-block h-4" />
        </p>
      </div>
    </footer>
  )
}
