import type { MetadataRoute } from 'next';

/** Site instalável na tela inicial do celular (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Adotaí — adoção de cães e gatos',
    short_name: 'Adotaí',
    description: 'Encontre cães e gatos para adoção perto de você, em ONGs verificadas.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F7F5',
    theme_color: '#0F6E5C',
    lang: 'pt-BR',
    categories: ['lifestyle', 'social'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Meus pedidos', url: '/meus-pedidos' },
      { name: 'Mensagens', url: '/mensagens' },
    ],
  };
}
