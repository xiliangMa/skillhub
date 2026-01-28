import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-12 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">SkillsHub</h3>
            <p className="text-sm text-muted-foreground">
              专业的Skills商店平台
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">产品</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/skills" className="hover:text-foreground text-muted-foreground transition-colors">Skills</Link></li>
              <li><Link href="/categories" className="hover:text-foreground text-muted-foreground transition-colors">分类</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground text-muted-foreground transition-colors">价格</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">支持</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs" className="hover:text-foreground text-muted-foreground transition-colors">文档</Link></li>
              <li><Link href="/faq" className="hover:text-foreground text-muted-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-foreground text-muted-foreground transition-colors">联系我们</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">法律</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-foreground text-muted-foreground transition-colors">隐私政策</Link></li>
              <li><Link href="/terms" className="hover:text-foreground text-muted-foreground transition-colors">服务条款</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2024 SkillsHub. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
