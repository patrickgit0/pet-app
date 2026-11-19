import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { LangSwitch } from '@/components/lang-switch';
import { CookieNotice } from '@/components/cookie-notice';
import { LangProvider } from '@/i18n/client';
import { getI18n } from '@/i18n/server';
import { SITE_URL } from '@/lib/site';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const viewport = { themeColor: '#0F6E5C' };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    appleWebApp: { capable: true, title: 'Adotaí', statusBarStyle: 'default' },
    icons: { apple: '/pwa-icon/192' },
    title: { default: t('Adotaí — adote um cão ou gato perto de você'), template: '%s · Adotaí' },
    description: t('Encontre cães e gatos para adoção perto de você, em ONGs verificadas. Converse com a ONG, peça a adoção e receba acompanhamento depois.'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getI18n();
  return (
    <html lang={lang === 'en' ? 'en' : 'pt-BR'}>
      <body className={`${jakarta.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <LangProvider lang={lang}>
          <SiteHeader />
          <div className="flex-1 pb-16">{children}</div>
          <footer className="border-t border-line bg-white print:hidden">
            <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
              <span>© {new Date().getFullYear()} Adotaí · Ribeirão Preto/SP</span>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link href="/privacidade">{t('Privacidade (LGPD)')}</Link>
                <Link href="/termos">{t('Termos de uso')}</Link>
                <Link href="/termo-de-adocao">{t('Termo de adoção')}</Link>
                <Link href="/sou-ong">{t('Sou ONG')}</Link>
                <Link href="/lar-temporario">{t('Seja lar temporário')}</Link>
                <Link href="/adotar/cachorro-em-ribeirao-preto">{t('Cães em Ribeirão Preto')}</Link>
                <Link href="/adotar/gato-em-ribeirao-preto">{t('Gatos em Ribeirão Preto')}</Link>
                <LangSwitch />
              </nav>
            </div>
          </footer>
          <CookieNotice />
        </LangProvider>
      </body>
    </html>
  );
}
