import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';

/** ONG do usuário logado (primeira que ele integra). */
export async function getMyNgo() {
  const { supabase, user } = await getSession();
  if (!user) redirect('/entrar?next=/painel');
  const { data } = await supabase.from('ngo_members').select('role, ngos(*)').eq('user_id', user.id).limit(1).maybeSingle();
  return { supabase, user, ngo: data?.ngos ?? null, memberRole: data?.role ?? null };
}
