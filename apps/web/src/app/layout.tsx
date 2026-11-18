import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: { default: 'Adotaí — adote um cão ou gato perto de você', template: '%s · Adotaí' },
  description:
    'Encontre cães e gatos para adoção perto de você, em ONGs verificadas. Converse com a ONG, peça a adoção e receba acompanhamento depois.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${jakarta.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <SiteHeader />
        <div className="flex-1 pb-16">{children}</div>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted">
            <span>© {new Date().getFullYear()} Adotaí · Ribeirão Preto/SP</span>
            <nav className="flex gap-5">
              <a href="/privacidade">Privacidade (LGPD)</a>
              <a href="/termo-de-adocao">Termo de adoção</a>
              <a href="/sou-ong">Sou ONG</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
