import { pageTitle } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { AdminNav } from './admin-nav';

export const generateMetadata = pageTitle('Admin');

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  if (profile?.role !== 'admin') notFound();
  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-8 lg:py-8">
      <AdminNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
