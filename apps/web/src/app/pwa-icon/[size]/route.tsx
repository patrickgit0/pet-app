import { ImageResponse } from 'next/og';

/** Ícone do app instalado (PWA): pata branca sobre o verde da marca. /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const maskable = raw === 'maskable';
  const size = maskable ? 512 : raw === '512' ? 512 : 192;
  const paw = Math.round(size * (maskable ? 0.5 : 0.62)); // maskable: margem de segurança de ~20%
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F6E5C', borderRadius: maskable ? 0 : size * 0.22 }}>
        <svg width={paw} height={paw} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="8" r="2" /><circle cx="12" cy="5.5" r="2" /><circle cx="17" cy="8" r="2" />
          <path d="M8 16c0-2.5 1.8-5 4-5s4 2.5 4 5c0 1.7-1.3 2.5-2.5 2.5-.8 0-1-.5-1.5-.5s-.7.5-1.5.5C9.3 18.5 8 17.7 8 16z" />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } },
  );
}
