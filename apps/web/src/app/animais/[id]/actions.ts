'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { rpcErrorMessage } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';

async function requireUser(next: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export async function startChat(animalId: string) {
  const { supabase } = await requireUser(`/animais/${animalId}`);
  const { data, error } = await supabase.rpc('start_conversation', { p_animal_id: animalId });
  if (error) redirect(`/animais/${animalId}?erro=${encodeURIComponent(rpcErrorMessage(error.message))}`);
  redirect(`/mensagens/${data}`);
}

/** "Quero adotar": exige perfil completo (etapa 2). Se faltar, manda completar e volta para cá. */
export async function requestAdoption(animalId: string, fd: FormData) {
  const { supabase } = await requireUser(`/animais/${animalId}`);
  if (fd.get('compromisso') !== 'on') redirect(`/animais/${animalId}?erro=${encodeURIComponent('Marque o compromisso de guarda responsável para enviar o pedido.')}`);
  const { data: complete } = await supabase.rpc('is_profile_complete');
  if (!complete) redirect(`/perfil/editar?animal=${animalId}`);

  // Perguntas extras da ONG: relê do banco para guardar pergunta + resposta juntas
  const { data: animal } = await supabase.from('animals').select('ngos(application_questions)').eq('id', animalId).maybeSingle();
  const questions = ((animal?.ngos?.application_questions ?? []) as unknown[]).filter((q): q is string => typeof q === 'string').slice(0, 5);
  const answers = {
    compromisso_em: new Date().toISOString(),
    perguntas: questions.map((q, i) => ({ pergunta: q, resposta: String(fd.get(`q${i}`) ?? '').trim().slice(0, 800) })),
  };
  const { error } = await supabase.rpc('request_adoption', { p_animal_id: animalId, p_answers: answers });
  if (error) redirect(`/animais/${animalId}?erro=${encodeURIComponent(rpcErrorMessage(error.message))}`);
  const { data: conv } = await supabase.rpc('start_conversation', { p_animal_id: animalId });
  redirect(`/mensagens/${conv}?pedido=enviado`);
}

export async function toggleFavorite(animalId: string, isFav: boolean) {
  const { supabase, user } = await requireUser(`/animais/${animalId}`);
  if (isFav) await supabase.from('favorites').delete().eq('animal_id', animalId).eq('user_id', user.id);
  else await supabase.from('favorites').insert({ animal_id: animalId, user_id: user.id });
  revalidatePath(`/animais/${animalId}`);
  revalidatePath('/favoritos');
}
