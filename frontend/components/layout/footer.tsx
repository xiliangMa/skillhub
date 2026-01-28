import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">SkillsHub</h3>
            <p className="text-sm text-muted-foreground">
              专业的Skills商店平台
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">产品</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/skills">Skills</Link></li>
              <li><Link href="/categories">分类</Link></li>
              <li><Link href="/pricing">价格</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">支持</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs">文档</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">联系我们</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">法律</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy">隐私政策</Link></li>
              <li><Link href="/terms">服务条款</Link></li>
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
