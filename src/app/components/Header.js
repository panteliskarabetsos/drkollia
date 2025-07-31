'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Menu, X, User as UserIcon } from 'lucide-react'
import { Noto_Serif } from 'next/font/google'

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // adjust weights as needed
  display: 'swap',
})


export default function Header() {
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

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
    setDropdownOpen(false)
    setMenuOpen(false)
    window.location.reload()
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#fdfaf6]/80 backdrop-blur-xl shadow-sm border-b border-[#e8e4de]">
      <div className=" max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative">

        {/* Branding */}
       <Link href="/" className={`flex flex-col ${notoSerif.className}`}>
        <h1 className="text-xl md:text-2xl font-semibold text-[#3b3a36] tracking-wide hover:text-[#8c7c68] transition">
          Γεωργία Κόλλια
        </h1>
        <p className="text-sm text-[#6f6d68] tracking-wide hidden sm:block">
          Ενδοκρινολογία - Διαβήτης - Μεταβολισμός
        </p>
      </Link>


        {/* Right controls */}
        <div className="flex items-center space-x-4 relative">
          {/* Desktop Navigation */}
       <nav className="hidden md:flex items-center space-x-8 text-base font-medium text-[#5a5955]">
          {[
            { href: "/about", label: "Σχετικά" },
            { href: "/iatreio", label: "Ιατρείο" },
            { href: "/contact", label: "Επικοινωνία" },
          ].map(({ href, label }) => (
       <Link
          key={href}
          href={href}
          className="relative group transition text-[#5a5955] hover:text-[#8c7c68]"
        >
          <span className="pb-1">{label}</span>
          <span className="absolute left-0 -bottom-0.5 h-[2px] bg-[#8c7c68] w-0 transition-all duration-300 ease-in-out group-hover:w-full" />
        </Link>
          ))}

          <Link
            href="/appointments"
            className="px-6 py-2 text-base bg-[#8c7c68] text-white rounded-full shadow hover:bg-[#746856] transition whitespace-nowrap"
          >
            Κλείστε Ραντεβού
          </Link>
        </nav>

          {/* Desktop User Button */}
          {!loading && user && (
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#e8e2d6] text-[#3b3a36] hover:bg-[#d6cfc0] transition rounded-full shadow-sm border border-[#d4c9b9]"
            >
              <UserIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{profileName ?? user.email}</span>
            </button>
          )}


          {/* Mobile Icons */}
          <div className="flex md:hidden items-center space-x-3">
            {!loading && user && (
              <button onClick={() => setDropdownOpen(prev => !prev)}>
                <UserIcon className="w-5 h-5 text-[#3b3a36]" />
              </button>
            )}
            <button onClick={() => setMenuOpen(prev => !prev)}>
              {menuOpen ? (
                <X className="w-6 h-6 text-[#3b3a36]" />
              ) : (
                <Menu className="w-6 h-6 text-[#3b3a36]" />
              )}
            </button>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
           <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#e8e2d6] shadow-md rounded-md z-50"
            >
              <button
                onClick={() => { setDropdownOpen(false); window.location.href = "/admin" }}
                className="w-full text-left px-4 py-2 text-sm text-[#3b3a36] hover:bg-[#f0ece4]"
              >
                Πίνακας Διαχείρισης
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-[#3b3a36] hover:bg-[#f0ece4]"
              >
                Αποσύνδεση
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${menuOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
        <div className="flex flex-col px-6 py-4 space-y-3 text-sm font-medium text-[#5a5955] bg-white border-t border-[#e8e4de]">
          <Link href="/about" className="hover:text-[#8c7c68] transition">Σχετικά</Link>
          <Link href="/iatreio" className="hover:text-[#8c7c68] transition">Ιατρείο</Link>
          <Link href="/contact" className="hover:text-[#8c7c68] transition">Επικοινωνία</Link>
          <Link href="/appointments" className="px-5 py-2 bg-[#8c7c68] text-white rounded-full shadow hover:bg-[#746856] transition text-center">
            Κλείστε Ραντεβού
          </Link>
        </div>
      </nav>
    </header>
  )
}
