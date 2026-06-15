/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint NIE blokuje builda/deploya na Vercelu — odpala się osobno przez
    // `npm run lint` (lokalnie) i w CI. Inaczej dodanie .eslintrc nagle
    // wywaliłoby deploy na pierwszym lint-errorze w 30k linii kodu.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
}

module.exports = nextConfig
