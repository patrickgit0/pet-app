import Link from 'next/link';
import { ANIMAL_STATUS_LABEL, SPECIES_LABEL } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';
import { photoUrl, tintFor } from '@/lib/utils';
import { PlusIcon } from '@/components/icons';

export default async function Page() {
  const { supabase, ngo } = await getMyNgo();
  const { data } = await supabase
    .from('animals')
    .select('id, name, species, status, updated_at, animal_photos(storage_path, position)')
    .eq('ngo_id', ngo!.id).neq('status', 'archived').order('updated_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Animais</h1>
        <Link href="/painel/animais/novo" className="btn-primary"><PlusIcon size={18} /> Cadastrar animal</Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {(data ?? []).map((a) => {
          const cover = [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position)[0];
          return (
            <Link key={a.id} href={`/painel/animais/${a.id}`} className="card overflow-hidden">
              <div className="h-32" style={{ background: tintFor(a.name) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {cover && <img src={photoUrl(cover.storage_path)!} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-center justify-between p-3">
                <span><strong>{a.name}</strong> <span className="text-xs text-muted">· {SPECIES_LABEL[a.species]}</span></span>
                <span className="chip">{ANIMAL_STATUS_LABEL[a.status]}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {!data?.length && <p className="card p-8 text-center text-muted">Nenhum animal cadastrado ainda.</p>}
    </div>
  );
}
