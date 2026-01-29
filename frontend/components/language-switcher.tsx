"use client"

import { Globe, ChevronDown, Check } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { useState, useRef, useEffect } from "react"

export function LanguageSwitcher() {
  const { locale, toggleLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const currentLang = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLang.flag} {currentLang.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                if (lang.code !== locale) {
                  toggleLanguage()
                }
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {lang.code === locale && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
