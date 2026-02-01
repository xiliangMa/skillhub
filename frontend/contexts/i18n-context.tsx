"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

type Locale = "en" | "zh"

interface Translations {
  nav: {
    searchPlaceholder: string
    login: string
    register: string
    switchLanguage: string
    loggedIn: string
    logout: string
    personalCenter: string
    adminDashboard: string
  }
  home: {
    heroTitle: string
    heroSubtitle: string
    searchPlaceholder: string
    startBrowsing: string
    learnMore: string
    whyChooseUs: string
    whyChooseUsDesc: string
    hotSkills: string
    hotSkillsDesc: string
    trendingSkills: string
    trendingSkillsDesc: string
    readyToStart: string
    readyToStartDesc: string
    createFreeAccount: string
    contactSales: string
    free: string
    downloads: string
    thisWeek: string
    noHotSkills: string
    noTrendingSkills: string
    filterCategory: string
    allCategories: string
    clearFilter: string
    findSkills: string
    loading: string
    skillNotFound: string
    getStart: string
    buy: string
  }
  categories: {
    title: string
    subtitle: string
    tools: string
    development: string
    dataAi: string
    business: string
    security: string
    integration: string
    exploreSkills: string
    readyToFind: string
    readyToFindDesc: string
    browseAll: string
  }
  auth: {
    loginTitle: string
    loginSubtitle: string
    registerTitle: string
    registerSubtitle: string
    continueWithThirdParty: string
    orUseEmail: string
    emailAddress: string
    password: string
    confirmPassword: string
    emailPlaceholder: string
    passwordPlaceholder: string
    passwordMinLength: string
    confirmPasswordPlaceholder: string
    processing: string
    registerProcessing: string
    redirectTo: string
    noAccount: string
    hasAccount: string
    agreeToTerms: string
    and: string
    errorLoginFailed: string
    errorGetOAuthUrlFailed: string
    errorRegisterFailed: string
    errorPasswordMismatch: string
    errorPasswordTooShort: string
    errorEmailExists: string
    errorOAuthLoginFailed: string
    errorOAuthRegisterFailed: string
     passwordNotMatch: string
     passwordTooShortHint: string
     login: string
     register: string
     name: string
     namePlaceholder: string
   }
  features: {
    quickIntegration: {
      title: string
      description: string
    }
    continuousUpdates: {
      title: string
      description: string
    }
    richCategories: {
      title: string
      description: string
    }
  }
  cta: {
    readyToStart: string
    description: string
    createFreeAccount: string
    contactSales: string
  }
  stats: {
    skills: string
    downloads: string
    rating: string
  }
  footer: {
    about: string
    aboutDesc: string
    product: string
    skills: string
    categories: string
    pricing: string
    support: string
    docs: string
    faq: string
    contact: string
    legal: string
    privacy: string
    terms: string
    copyright: string
  }
  admin: {
    dashboardTitle: string
    welcome: string
    subtitle: string
    overview: string
    overviewDesc: string
    skillsManagement: string
    skillsManagementDesc: string
    usersManagement: string
    usersManagementDesc: string
    ordersManagement: string
    ordersManagementDesc: string
    totalRevenue: string
    totalOrders: string
    totalUsers: string
    totalSkills: string
    todayOrders: string
    pendingOrders: string
    activeUsers: string
    hotSkills: string
    recentOrders: string
    recentOrdersDesc: string
    noOrders: string
    statusPaid: string
    statusPending: string
    categories: string
    categoriesDesc: string
    analytics: string
    analyticsDesc: string
    settings: string
    settingsDesc: string
  }
  dashboard: {
    nav: {
      dashboard: string
      dashboardDesc: string
      profile: string
      profileDesc: string
      orders: string
      ordersDesc: string
      security: string
      securityDesc: string
      preferences: string
      preferencesDesc: string
      mySkills: string
      mySkillsDesc: string
      analytics: string
      analyticsDesc: string
    }
    welcome: string
    subtitle: string
    exploreSkills: string
    tip: string
    tipContent: string
    stats: {
      totalOrders: string
      ordersDesc: string
      totalSkills: string
      skillsDesc: string
      totalDownloads: string
      downloadsDesc: string
      learningProgress: string
    }
    recentActivity: {
      title: string
      description: string
      viewAll: string
    }
    quickActions: {
      title: string
      description: string
      browseSkills: string
      browseSkillsDesc: string
      purchaseHistory: string
      purchaseHistoryDesc: string
      learningProgress: string
      learningProgressDesc: string
      browse: string
      view: string
      viewProgress: string
    }
  }
}

const translations: Record<Locale, Translations> = {
  en: {
      nav: {
        searchPlaceholder: "Search skills...",
        login: "Login",
        register: "Register",
        switchLanguage: "Switch Language",
        loggedIn: "Logged in",
        logout: "Logout",
        personalCenter: "Personal Center",
        adminDashboard: "Admin Dashboard",
      },
    home: {
      heroTitle: "Embrace AI",
      heroSubtitle: "The best AI assistant skills marketplace for your applications",
      searchPlaceholder: "Search AI skills...",
      startBrowsing: "Start Browsing",
      learnMore: "Learn More",
      whyChooseUs: "Why Choose Us",
      whyChooseUsDesc: "Powerful features to supercharge your AI applications",
      hotSkills: "🔥 Hot Skills",
      hotSkillsDesc: "Most popular AI skills this month",
      trendingSkills: "📈 Trending Skills",
      trendingSkillsDesc: "Fastest growing skills this week",
      readyToStart: "Ready to Get Started?",
      readyToStartDesc: "Join thousands of developers who are already using SkillsHub to build amazing AI applications",
      createFreeAccount: "Create Free Account",
      contactSales: "Contact Sales",
      free: "Free",
      downloads: "downloads",
      thisWeek: "+% this week",
      noHotSkills: "No hot skills available yet",
      noTrendingSkills: "No trending skills available yet",
      filterCategory: "Filter by Category",
      allCategories: "All Categories",
      clearFilter: "Clear Filters",
      findSkills: "Found {count} skills",
      loading: "Loading...",
      skillNotFound: "No matching skills found",
      getStart: "Get Started",
      buy: "Buy Now",
    },
    categories: {
      title: "Explore Categories",
      subtitle: "Discover AI skills organized by category to find the perfect solution for your needs",
      tools: "Tools",
      development: "Development",
      dataAi: "Data & AI",
      business: "Business",
      security: "Security",
      integration: "Integration",
      exploreSkills: "Explore skills",
      readyToFind: "Ready to Find the Perfect Skill?",
      readyToFindDesc: "Browse our extensive collection of AI skills and find exactly what you need",
      browseAll: "Browse All Skills",
    },
    auth: {
      loginTitle: "Login",
      loginSubtitle: "Sign in to your account to continue",
      registerTitle: "Create Account",
      registerSubtitle: "Join SkillsHub and start your AI journey",
      continueWithThirdParty: "Continue with third-party account",
      orUseEmail: "or use email",
      emailAddress: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      emailPlaceholder: "your@email.com",
      passwordPlaceholder: "••••••••",
      passwordMinLength: "At least 6 characters",
      confirmPasswordPlaceholder: "Enter password again",
      processing: "Processing...",
      registerProcessing: "Registering...",
      redirectTo: "Redirecting...",
      noAccount: "Don't have an account? ",
      hasAccount: "Already have an account? ",
      agreeToTerms: "By continuing, you agree to our",
      and: "and",
      errorLoginFailed: "Operation failed, please try again",
      errorGetOAuthUrlFailed: "Failed to get authorization URL",
      errorRegisterFailed: "Registration failed, please try again",
      errorPasswordMismatch: "Passwords do not match",
      errorPasswordTooShort: "Password must be at least 6 characters",
      errorEmailExists: "This email is already registered, please use another email or login directly",
      errorOAuthLoginFailed: "login failed",
      errorOAuthRegisterFailed: "registration failed",
       passwordNotMatch: "Passwords do not match",
       passwordTooShortHint: "Password must be at least 6 characters",
       login: "Login",
       register: "Register",
       name: "Name",
       namePlaceholder: "Your full name",
    },
    features: {
      quickIntegration: {
        title: "Quick Integration",
        description: "Plug and play, deploy instantly to your applications with minimal setup time",
      },
      continuousUpdates: {
        title: "Continuous Updates",
        description: "Regular updates to keep up with latest technology trends and AI advancements",
      },
      richCategories: {
        title: "Rich Categories",
        description: "Covering various AI skills to meet different needs and use cases",
      },
    },
    cta: {
      readyToStart: "Ready to Get Started?",
      description: "Join thousands of developers who are already using SkillsHub to build amazing AI applications",
      createFreeAccount: "Create Free Account",
      contactSales: "Contact Sales",
    },
    stats: {
      skills: "Skills",
      downloads: "Downloads",
      rating: "Rating",
    },
    footer: {
      about: "SkillsHub",
      aboutDesc: "Professional Skills Store Platform",
      product: "Product",
      skills: "Skills",
      categories: "Categories",
      pricing: "Pricing",
      support: "Support",
      docs: "Docs",
      faq: "FAQ",
      contact: "Contact Us",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      copyright: "© 2024 SkillsHub. All rights reserved.",
    },
    admin: {
      dashboardTitle: "Admin Dashboard",
      welcome: "Welcome back, Admin!",
      subtitle: "This is your admin dashboard to monitor platform data, manage users and skills.",
      overview: "Overview",
       overviewDesc: "Platform overview and statistics",
       skillsManagement: "Skills Management",
       skillsManagementDesc: "Manage all skills on the platform",
       usersManagement: "Users Management",
       usersManagementDesc: "Manage user accounts and permissions",
       ordersManagement: "Orders Management",
       ordersManagementDesc: "View and process all orders",
       totalRevenue: "Total Revenue",
      totalOrders: "Total Orders",
      totalUsers: "Total Users",
      totalSkills: "Total Skills",
      todayOrders: "today orders",
      pendingOrders: "pending orders",
      activeUsers: "active users",
      hotSkills: "hot",
      recentOrders: "Recent Orders",
       recentOrdersDesc: "Latest order records",
       noOrders: "No orders data",
       statusPaid: "Paid",
       statusPending: "Pending",
       categories: "Categories Management",
       categoriesDesc: "Manage skill categories and tags",
       analytics: "Analytics",
       analyticsDesc: "Detailed data analysis and reports",
       settings: "System Settings",
       settingsDesc: "Platform configuration and parameter settings",
    },
    dashboard: {
      nav: {
        dashboard: "Dashboard",
        dashboardDesc: "Overview and quick access",
        profile: "Profile",
        profileDesc: "Manage personal information and avatar",
        orders: "Purchase History",
        ordersDesc: "View orders and download records",
        security: "Account Security",
        securityDesc: "Password and third-party account management",
        preferences: "Preferences",
        preferencesDesc: "Language, theme and notification settings",
        mySkills: "My Skills",
        mySkillsDesc: "Manage and upload skill packages",
        analytics: "Analytics",
        analyticsDesc: "Learning progress and usage statistics",
      },
      welcome: "Welcome back",
      subtitle: "This is your personal dashboard, where you can manage your account, view progress, and access important features.",
      exploreSkills: "Explore Skills",
      tip: "Tip:",
      tipContent: "Complete more learning tasks to unlock achievements!",
      stats: {
        totalOrders: "Total Orders",
        ordersDesc: "Purchased skills",
        totalSkills: "Skills Owned",
        skillsDesc: "Available skill packages",
        totalDownloads: "Total Downloads",
        downloadsDesc: "Skill package downloads",
        learningProgress: "Learning Progress",
      },
      recentActivity: {
        title: "Recent Activity",
        description: "Your recent operation records",
        viewAll: "View All Activity",
      },
      quickActions: {
        title: "Quick Actions",
        description: "Common functions and shortcuts",
        browseSkills: "Browse Skills",
        browseSkillsDesc: "Explore new skills",
        purchaseHistory: "Purchase History",
        purchaseHistoryDesc: "View order records",
        learningProgress: "Learning Progress",
        learningProgressDesc: "View learning statistics",
        browse: "Browse",
        view: "View",
        viewProgress: "View Progress",
      },
    },
  },
  zh: {
      nav: {
        searchPlaceholder: "搜索skills...",
        login: "登录",
        register: "注册",
        switchLanguage: "切换语言",
        loggedIn: "已登录",
        logout: "退出登录",
        personalCenter: "个人中心",
        adminDashboard: "后台管理",
      },
    home: {
      heroTitle: "拥抱AI",
      heroSubtitle: "最好的AI助手技能市场，为您的应用程序提供强大支持",
      searchPlaceholder: "搜索AI技能...",
      startBrowsing: "开始浏览",
      learnMore: "了解更多",
      whyChooseUs: "为什么选择我们",
      whyChooseUsDesc: "强大的功能，为您的AI应用赋能",
      hotSkills: "🔥 热门技能",
      hotSkillsDesc: "本月最受欢迎的AI技能",
      trendingSkills: "📈 趋势技能",
      trendingSkillsDesc: "本周增长最快的技能",
      readyToStart: "准备好开始了吗？",
      readyToStartDesc: "加入成千上万使用SkillsHub构建惊人AI应用的开发者行列",
      createFreeAccount: "创建免费账户",
      contactSales: "联系销售",
      free: "免费",
      downloads: "下载",
      thisWeek: "本周 +%",
      noHotSkills: "暂无热门技能",
      noTrendingSkills: "暂无趋势技能",
      filterCategory: "分类筛选",
      allCategories: "全部分类",
      clearFilter: "清除筛选条件",
      findSkills: "共找到 {count} 个技能",
      loading: "加载中...",
      skillNotFound: "没有找到相关技能",
      getStart: "立即获取",
      buy: "购买",
    },
    categories: {
      title: "浏览分类",
      subtitle: "按类别探索AI技能，找到满足您需求的完美解决方案",
      tools: "工具",
      development: "开发",
      dataAi: "数据与AI",
      business: "商业",
      security: "安全",
      integration: "集成",
      exploreSkills: "探索技能",
      readyToFind: "准备好找到完美的技能了吗？",
      readyToFindDesc: "浏览我们广泛的AI技能集合，找到您真正需要的",
      browseAll: "浏览所有技能",
    },
    auth: {
      loginTitle: "登录",
      loginSubtitle: "登录您的账户以继续",
      registerTitle: "创建账户",
      registerSubtitle: "加入 SkillsHub，开启AI技能之旅",
      continueWithThirdParty: "使用第三方账号继续",
      orUseEmail: "或使用邮箱",
      emailAddress: "邮箱地址",
      password: "密码",
      confirmPassword: "确认密码",
      emailPlaceholder: "your@email.com",
      passwordPlaceholder: "••••••••",
      passwordMinLength: "至少6个字符",
      confirmPasswordPlaceholder: "再次输入密码",
      processing: "处理中...",
      registerProcessing: "注册中...",
      redirectTo: "跳转中...",
      noAccount: "还没有账户？ ",
      hasAccount: "已有账户？ ",
      agreeToTerms: "即表示您同意我们的",
      and: "和",
      errorLoginFailed: "操作失败，请重试",
      errorGetOAuthUrlFailed: "获取授权URL失败",
      errorRegisterFailed: "注册失败，请重试",
      errorPasswordMismatch: "两次密码输入不一致",
      errorPasswordTooShort: "密码至少需要6个字符",
      errorEmailExists: "该邮箱已被注册，请使用其他邮箱或直接登录",
      errorOAuthLoginFailed: "登录失败",
      errorOAuthRegisterFailed: "注册失败",
       passwordNotMatch: "两次密码输入不一致",
       passwordTooShortHint: "密码至少需要6个字符",
       login: "登录",
       register: "注册",
       name: "姓名",
       namePlaceholder: "请输入您的全名",
    },
    features: {
      quickIntegration: {
        title: "快速集成",
        description: "即插即用，快速部署到您的应用程序，设置时间最短",
      },
      continuousUpdates: {
        title: "持续更新",
        description: "定期更新，紧跟最新技术趋势和AI发展",
      },
      richCategories: {
        title: "丰富分类",
        description: "涵盖各类AI技能，满足不同需求和应用场景",
      },
    },
    cta: {
      readyToStart: "准备好开始了吗？",
      description: "加入成千上万使用SkillsHub构建惊人AI应用的开发者行列",
      createFreeAccount: "创建免费账户",
      contactSales: "联系销售",
    },
    stats: {
      skills: "AI 技能",
      downloads: "下载量",
      rating: "评分",
    },
    footer: {
      about: "SkillsHub",
      aboutDesc: "专业的Skills商店平台",
      product: "产品",
      skills: "技能",
      categories: "分类",
      pricing: "价格",
      support: "支持",
      docs: "文档",
      faq: "常见问题",
      contact: "联系我们",
      legal: "法律",
      privacy: "隐私政策",
      terms: "服务条款",
      copyright: "© 2024 SkillsHub. 保留所有权利。",
    },
    admin: {
      dashboardTitle: "管理后台",
      welcome: "欢迎回来, 管理员!",
      subtitle: "这是您的管理仪表板，可以监控平台数据、管理用户和技能。",
      overview: "概览",
       overviewDesc: "数据概览和平台统计",
       skillsManagement: "技能管理",
       skillsManagementDesc: "管理平台上的所有技能",
       usersManagement: "用户管理",
       usersManagementDesc: "管理用户账户和权限",
       ordersManagement: "订单管理",
       ordersManagementDesc: "查看和处理所有订单",
       totalRevenue: "总收入",
      totalOrders: "总订单数",
      totalUsers: "用户数",
      totalSkills: "技能数",
      todayOrders: "今日订单",
      pendingOrders: "待处理",
      activeUsers: "活跃用户",
      hotSkills: "热门",
      recentOrders: "最近订单",
       recentOrdersDesc: "最新的订单记录",
       noOrders: "暂无订单数据",
       statusPaid: "已支付",
       statusPending: "待支付",
       categories: "分类管理",
       categoriesDesc: "管理技能分类和标签",
       analytics: "数据分析",
       analyticsDesc: "详细数据分析和报告",
       settings: "系统设置",
       settingsDesc: "平台配置和参数设置",
    },
    dashboard: {
      nav: {
        dashboard: "仪表板",
        dashboardDesc: "数据概览和快速访问",
        profile: "个人信息",
        profileDesc: "管理个人资料和头像",
        orders: "购买历史",
        ordersDesc: "查看订单和下载记录",
        security: "账户安全",
        securityDesc: "密码和第三方账号管理",
        preferences: "偏好设置",
        preferencesDesc: "语言、主题和通知设置",
        mySkills: "我的技能",
        mySkillsDesc: "管理和上传技能包",
        analytics: "数据分析",
        analyticsDesc: "学习进度和使用统计",
      },
      welcome: "欢迎回来",
      subtitle: "这是您的个人仪表板，可以管理账户、查看进度和访问重要功能。",
      exploreSkills: "探索技能",
      tip: "提示：",
      tipContent: "完成更多学习任务可以解锁成就！",
      stats: {
        totalOrders: "总订单数",
        ordersDesc: "已购买技能",
        totalSkills: "已拥有技能",
        skillsDesc: "可用的技能包",
        totalDownloads: "总下载量",
        downloadsDesc: "技能包下载次数",
        learningProgress: "学习进度",
      },
      recentActivity: {
        title: "最近活动",
        description: "您的最近操作记录",
        viewAll: "查看全部活动",
      },
      quickActions: {
        title: "快速操作",
        description: "常用功能和快捷入口",
        browseSkills: "浏览技能",
        browseSkillsDesc: "探索新技能",
        purchaseHistory: "购买历史",
        purchaseHistoryDesc: "查看订单记录",
        learningProgress: "学习进度",
        learningProgressDesc: "查看学习统计",
        browse: "浏览",
        view: "查看",
        viewProgress: "查看进度",
      },
    },
  },
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  toggleLanguage: () => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>(() => {
    // 默认使用中文
    return 'zh'
  })

  const toggleLanguage = () => {
    const newLocale: Locale = locale === 'zh' ? 'en' : 'zh'
    setLocale(newLocale)
    
    const newPath = newLocale === 'zh' 
      ? `/zh${pathname === '/' ? '' : pathname}` 
      : pathname.replace('/zh', '') || '/'
    router.push(newPath)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale], toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
