import { notFound } from 'next/navigation';
import { loadNgo } from './load';

/** Confere a ONG antes do loading.tsx para "não existe" responder 404 de verdade. */
export default async function NgoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await loadNgo((await params).slug))) notFound();
  return children;
}
