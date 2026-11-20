import { notFound, permanentRedirect } from 'next/navigation';
import { animalPath } from '@adotai/shared';
import { loadAnimal } from './load';

/**
 * Confere o anúncio ANTES do loading.tsx: assim "não existe" responde 404 de verdade
 * e link antigo responde 308 (dentro do loading viraria 200 + meta tag, ruim para o Google).
 */
export default async function AnimalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await loadAnimal(id);
  if (!a || !a.ngos) notFound();
  const path = animalPath(a);
  if (decodeURIComponent(id) !== path.slice('/animais/'.length)) permanentRedirect(path);
  return children;
}
