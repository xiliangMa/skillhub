"use client"

import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { usePathname } from "next/navigation"

export function Footer() {
  const { t } = useI18n()
  const pathname = usePathname()
  const isZh = pathname.startsWith('/zh')

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm py-12 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-white">{t.footer.about}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.footer.aboutDesc}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">{t.footer.product}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={isZh ? "/zh/skills" : "/skills"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.skills}</Link></li>
              <li><Link href={isZh ? "/zh/categories" : "/categories"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.categories}</Link></li>
              <li><Link href={isZh ? "/zh/pricing" : "/pricing"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.pricing}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">{t.footer.support}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={isZh ? "/zh/docs" : "/docs"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.docs}</Link></li>
              <li><Link href={isZh ? "/zh/faq" : "/faq"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.faq}</Link></li>
              <li><Link href={isZh ? "/zh/contact" : "/contact"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">{t.footer.legal}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={isZh ? "/zh/privacy" : "/privacy"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href={isZh ? "/zh/terms" : "/terms"} className="text-slate-400 hover:text-blue-400 transition-colors">{t.footer.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700/50 text-center text-sm text-slate-500">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
