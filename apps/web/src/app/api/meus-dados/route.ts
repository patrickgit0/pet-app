import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * LGPD (art. 18, portabilidade): cópia em JSON de tudo que o Adotaí guarda sobre a pessoa logada.
 * Usa a sessão dela, então o RLS garante que só sai o que é dela.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Faça login para baixar seus dados.' }, { status: 401 });

  const uid = user.id;
  const [profile, priv, requests, conversations, favorites, searches, adoptions, reviews, notifications, foster, reports] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('profile_private').select('*').eq('id', uid).maybeSingle(),
    supabase.from('adoption_requests').select('*, animals(name), adoption_request_events(status, created_at)').eq('adopter_id', uid),
    supabase.from('conversations').select('id, created_at, animals(name), ngos(name), messages(kind, body, sender_id, visit_at, visit_place, created_at)').eq('adopter_id', uid),
    supabase.from('favorites').select('created_at, animals(name)').eq('user_id', uid),
    supabase.from('saved_searches').select('*').eq('user_id', uid),
    supabase.from('adoptions').select('*, animals(name), ngos(name), checkins(*)').eq('adopter_id', uid),
    supabase.from('reviews').select('*').eq('adopter_id', uid),
    supabase.from('notifications').select('kind, data, link, created_at, read_at').eq('user_id', uid),
    supabase.from('foster_offers').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('reports').select('target_type, reason, created_at, resolved_at').eq('reporter_id', uid),
  ]);
  // Localização exata vem em formato binário do PostGIS: não ajuda a pessoa e não é legível
  const strip = <T extends Record<string, unknown> | null>(row: T) => (row ? Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'location')) : row);

  const body = {
    gerado_em: new Date().toISOString(),
    aviso: 'Cópia dos seus dados no Adotaí (LGPD, art. 18). Mensagens de conversas incluem as da ONG, porque fazem parte do mesmo histórico.',
    conta: { id: uid, email: user.email, criada_em: user.created_at, ultimo_acesso: user.last_sign_in_at },
    perfil: strip(profile.data),
    dados_privados: strip(priv.data),
    pedidos_de_adocao: requests.data ?? [],
    conversas: conversations.data ?? [],
    favoritos: favorites.data ?? [],
    buscas_salvas: searches.data ?? [],
    adocoes: adoptions.data ?? [],
    avaliacoes: reviews.data ?? [],
    avisos: notifications.data ?? [],
    lar_temporario: foster.data ?? null,
    denuncias_feitas: reports.data ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="adotai-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
