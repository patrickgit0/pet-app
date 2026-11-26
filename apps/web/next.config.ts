import type { NextConfig } from 'next';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseWs = supabase.replace(/^http/, 'ws');
const dev = process.env.NODE_ENV !== 'production';

// Política de conteúdo: só carrega scripts do próprio site; dados do Supabase, mapas (OpenFreeMap) e CEP (BrasilAPI/ViaCEP/Nominatim).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} https://tiles.openfreemap.org`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabaseWs} https://tiles.openfreemap.org https://brasilapi.com.br https://viacep.com.br https://nominatim.openstreetmap.org`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  transpilePackages: ['@viralar/shared'],
  // Endereços antigos das páginas locais apontam para as de Franca, sem quebrar links já compartilhados
  async redirects() {
    return ['cachorro', 'gato', 'filhotes', 'outros-animais'].map((s) => ({
      source: `/adotar/${s}-em-ribeirao-preto`,
      destination: `/adotar/${s}-em-franca`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
