import { redirect } from 'next/navigation';

/** Endereço antigo: agora é "Editar perfil". */
export default async function Page({ searchParams }: { searchParams: Promise<{ animal?: string }> }) {
  const { animal } = await searchParams;
  redirect(animal ? `/perfil/editar?animal=${animal}` : '/perfil/editar');
}
