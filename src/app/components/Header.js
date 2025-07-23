'use client'

import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
})

export default function Header() {
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()

        if (!error && data?.name) {
          setProfileName(data.name)
        } else {
          console.warn('Could not fetch profile name:', error)
        }
      }

      setLoading(false)
    }

    fetchUserAndProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileName(null)
    setMenuOpen(false)
    window.location.reload()
  }

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
        <nav className="mt-4 md:mt-0 flex items-center space-x-6 text-sm font-medium text-[#5a5955] relative">
          <Link href="/about" className="hover:text-[#8c7c68] transition">Σχετικά</Link>
          <Link href="/iatreio" className="hover:text-[#8c7c68] transition">Ιατρείο</Link>
          <Link href="/contact" className="hover:text-[#8c7c68] transition">Επικοινωνία</Link>
          <Link href="/contact" className="ml-2 px-5 py-2 bg-[#8c7c68] text-white rounded-full shadow hover:bg-[#746856] transition">
            Κλείστε Ραντεβού
          </Link>

          {!loading && user && (
            <div className="relative ml-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-[#3b3a36] font-semibold hover:text-[#8c7c68] transition"
              >
                {profileName ?? user.email}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white shadow-md border border-[#e8e2d6] rounded-lg z-50">
                    <button
                    onClick={() => window.location.href = "/admin"}
                    className="block w-full text-left px-4 py-2 text-sm text-[#3b3a36] hover:bg-[#f0ece4]"
                  >
                    Πίνακας Διαχείρισης
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-[#3b3a36] hover:bg-[#f0ece4]"
                  >
                    Αποσύνδεση
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
