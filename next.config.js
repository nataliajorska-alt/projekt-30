// `npm run dev:sandbox` — apka na przykładowych danych, bez logowania i bez
// sieci (patrz lib/firebase.ts i lib/sandbox/). Nigdy nie włączaj na Vercelu.
const SANDBOX = process.env.NEXT_PUBLIC_SANDBOX === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sandbox buduje się do osobnego katalogu, żeby nie mieszać cache z `npm run dev`.
  distDir: SANDBOX ? '.next-sandbox' : '.next',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint NIE blokuje builda/deploya na Vercelu — odpala się osobno przez
    // `npm run lint` (lokalnie) i w CI. Inaczej dodanie .eslintrc nagle
    // wywaliłoby deploy na pierwszym lint-errorze w 30k linii kodu.
    ignoreDuringBuilds: true,
  },
  env: {
    // Zawsze wstawiane przy budowaniu, żeby webpack mógł wyciąć martwą gałąź
    // z danymi demo z produkcyjnego bundla. Poza sandboxem '0', nie '' — pustej
    // wartości Next nie wstawia i dane demo jechałyby do produkcji.
    NEXT_PUBLIC_SANDBOX: SANDBOX ? '1' : '0',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
}

module.exports = nextConfig
