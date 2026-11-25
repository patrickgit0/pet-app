import { NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/server';

type Row = Record<string, string | number | boolean | null | undefined>;

/** CSV com ; e BOM (abre direto no Excel em pt-BR). */
function toCsv(rows: Row[]): string {
  if (!rows.length) return '﻿';
  const cols = Object.keys(rows[0]);
  const cell = (v: Row[string]) => {
    if (v == null) return '';
    const s = String(v);
    // evita fórmula injetada ao abrir no Excel (=, +, -, @)
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\r\n');
}

const day = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '');

/** Exportação do admin: pedidos, adocoes, usuarios, animais, ongs. Nunca inclui CPF, celular ou endereço. */
export async function GET(_: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const { supabase, profile } = await getSession();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  let rows: Row[] = [];
  if (tipo === 'pedidos') {
    const { data } = await supabase.from('adoption_requests')
      .select('id, status, created_at, updated_at, rejection_reason, animals(name, species), ngos(name), profiles(full_name, neighborhood, city)')
      .order('created_at', { ascending: false }).limit(10000);
    rows = (data ?? []).map((r) => ({
      id: r.id, status: r.status, enviado_em: day(r.created_at), atualizado_em: day(r.updated_at), animal: r.animals?.name, especie: r.animals?.species,
      ong: r.ngos?.name, adotante: r.profiles?.full_name, bairro: r.profiles?.neighborhood, cidade: r.profiles?.city, motivo_recusa: r.rejection_reason,
    }));
  } else if (tipo === 'adocoes') {
    const { data } = await supabase.from('adoptions')
      .select('id, adopted_at, status, term_accepted_at, returned_at, return_reason, animals(name, species), ngos(name), profiles!adoptions_adopter_id_fkey(full_name), reviews(stars), checkins(due_day, status, needs_help)')
      .order('adopted_at', { ascending: false }).limit(10000);
    rows = (data ?? []).map((a) => ({
      id: a.id, adotado_em: day(a.adopted_at), status: a.status, animal: a.animals?.name, especie: a.animals?.species, ong: a.ngos?.name,
      adotante: a.profiles?.full_name, termo_aceito_em: day(a.term_accepted_at), nota: a.reviews?.stars,
      checkins_respondidos: a.checkins.filter((c) => c.status === 'answered').length,
      checkins_atrasados: a.checkins.filter((c) => c.status === 'late').length,
      pediu_ajuda: a.checkins.some((c) => c.needs_help) ? 'sim' : 'não',
      devolvido_em: day(a.returned_at), motivo_devolucao: a.return_reason,
    }));
  } else if (tipo === 'usuarios') {
    const { data } = await supabase.rpc('admin_list_users', { p_limit: 10000, p_offset: 0 });
    rows = (data ?? []).map((u) => ({
      id: u.id, nome: u.full_name, email: u.email, papel: u.role, cidade: u.city, bairro: u.neighborhood,
      perfil_completo: u.profile_complete ? 'sim' : 'não', criado_em: day(u.created_at), ultimo_acesso: day(u.last_sign_in_at),
      pedidos: Number(u.requests), adocoes: Number(u.adoptions), ong: u.ngo_name,
    }));
  } else if (tipo === 'animais') {
    const { data } = await supabase.from('animals').select('id, name, code, species, breed, sex, size, status, published_at, created_at, ngos(name), animal_photos(id)')
      .order('created_at', { ascending: false }).limit(10000);
    rows = (data ?? []).map((a) => ({
      id: a.id, codigo: a.code, nome: a.name, especie: a.species, raca: a.breed, sexo: a.sex, porte: a.size, status: a.status,
      publicado_em: day(a.published_at), criado_em: day(a.created_at), ong: a.ngos?.name, fotos: a.animal_photos.length,
    }));
  } else if (tipo === 'ongs') {
    const { data } = await supabase.from('ngos').select('id, name, slug, cnpj, city, state, neighborhood, verified_at, rating, completed_adoptions, median_response_minutes, created_at')
      .order('created_at', { ascending: false });
    rows = (data ?? []).map((n) => ({
      id: n.id, nome: n.name, slug: n.slug, cnpj: n.cnpj, cidade: n.city, uf: n.state, bairro: n.neighborhood, verificada_em: day(n.verified_at),
      nota: n.rating, adocoes: n.completed_adoptions, resposta_min: n.median_response_minutes, criada_em: day(n.created_at),
    }));
  } else {
    return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="viralar-${tipo}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
