import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/painel', '/admin', '/mensagens', '/meus-pedidos', '/perfil', '/favoritos', '/notificacoes', '/api/', '/auth/', '/entrar', '/criar-conta', '/esqueci-senha', '/redefinir-senha'],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
