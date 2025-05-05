"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="backdrop-blur-sm sticky top-0 z-50 bg-transparent">
      <div className="container mx-auto py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-black">P!nPoint</span>
        </Link>

      </div>
    </header>
  )
}

