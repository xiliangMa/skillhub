/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig
