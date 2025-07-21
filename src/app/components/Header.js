'use client'

import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
})

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#fdfaf6]/80 backdrop-blur-xl shadow-sm border-b border-[#e8e4de]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 py-4 transition-all duration-300">
        
        {/* Branding */}
        <Link href="/" className="text-center md:text-left">
          <h1 className={`${playfair.className} text-xl md:text-2xl font-medium text-[#3b3a36] tracking-wide hover:text-[#8c7c68] transition`}>
            Γεωργία Κόλλια
          </h1>
          <p className="text-sm text-[#6f6d68] tracking-wide hidden md:block">
            Ενδοκρινολόγος - Διαβητολόγος
          </p>
        </Link>

        {/* Navigation */}
        <nav className="mt-4 md:mt-0 flex items-center space-x-6 text-sm font-medium text-[#5a5955]">
          <Link
            href="/about"
             className=" relative hover:text-[#8c7c68] transition duration-300 before:absolute before:left-0 before:bottom-[-4px] before:h-[2px] before:w-0 before:bg-[#8c7c68] hover:before:w-full before:transition-all before:duration-300"
             >
             Σχετικά
          </Link>
        <Link
            href="/iatreio"
            className="relative hover:text-[#8c7c68] transition duration-300 before:absolute before:left-0 before:bottom-[-4px] before:h-[2px] before:w-0 before:bg-[#8c7c68] hover:before:w-full before:transition-all before:duration-300"
            >
            Ιατρείο
        </Link>
        <Link
            href="#pathiseis"
            className="relative hover:text-[#8c7c68] transition duration-300 before:absolute before:left-0 before:bottom-[-4px] before:h-[2px] before:w-0 before:bg-[#8c7c68] hover:before:w-full before:transition-all before:duration-300"
            >
            Παθήσεις
      </Link>
       <Link
            href="/contact"
            className="relative hover:text-[#8c7c68] transition duration-300 before:absolute before:left-0 before:bottom-[-4px] before:h-[2px] before:w-0 before:bg-[#8c7c68] hover:before:w-full before:transition-all before:duration-300"
            >
            Επικοινωνία
      </Link>

          <Link
            href="/contact"
            className="ml-2 px-5 py-2 bg-[#8c7c68] text-white rounded-full shadow hover:bg-[#746856] transition duration-300"
          >
            Κλείστε Ραντεβού
          </Link>
        </nav>
      </div>
    </header>
  )
}
