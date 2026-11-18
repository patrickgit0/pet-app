import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { LangSwitch } from '@/components/lang-switch';
import { LangProvider } from '@/i18n/client';
import { getI18n } from '@/i18n/server';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
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
          <footer className="border-t border-line bg-white">
            <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
              <span>© {new Date().getFullYear()} Adotaí · Ribeirão Preto/SP</span>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link href="/privacidade">{t('Privacidade (LGPD)')}</Link>
                <Link href="/termo-de-adocao">{t('Termo de adoção')}</Link>
                <Link href="/sou-ong">{t('Sou ONG')}</Link>
                <LangSwitch />
              </nav>
            </div>
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
