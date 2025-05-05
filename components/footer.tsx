import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t py-6 bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">&copy; {currentYear} P!nPoint. All rights reserved.</div>

          <div className="flex gap-6">
            <Link
              href="https://github.com/Sagar-CK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              Sagar
            </Link>
            <Link
              href="https://github.com/AtillaColak"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              Atilla
            </Link>
            <Link
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              Neel
            </Link>
            <Link
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              Manu
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

