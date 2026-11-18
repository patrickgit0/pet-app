import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@adotai/shared';

/**
 * Filtro PostgREST das conversas em que a pessoa participa (como adotante ou como membro da ONG).
 * Necessário porque o admin tem leitura de tudo pelo RLS, mas "Mensagens" deve mostrar só as dele.
 */
export async function myConversationsFilter(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase.from('ngo_members').select('ngo_id').eq('user_id', userId);
  const ngoIds = (data ?? []).map((m) => m.ngo_id);
  return { filter: ngoIds.length ? `adopter_id.eq.${userId},ngo_id.in.(${ngoIds.join(',')})` : `adopter_id.eq.${userId}`, ngoIds };
}
