import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { ANIMAL_STATUS_LABEL, speciesText } from '@viralar/shared';
import { getMyNgo } from '@/lib/ngo';
import { photoUrl, tintFor } from '@/lib/utils';
import { PlusIcon } from '@/components/icons';

export default async function Page() {
  const { supabase, ngo } = await getMyNgo();
  const { t } = await getI18n();
  const { data } = await supabase
    .from('animals')
    .select('id, name, species, breed, status, updated_at, animal_photos(storage_path, position)')
    .eq('ngo_id', ngo!.id).neq('status', 'archived').order('updated_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t('Animais')}</h1>
        <Link href="/painel/animais/novo" className="btn-primary"><PlusIcon size={18} /> {t('Cadastrar animal')}</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
        {(data ?? []).map((a) => {
          const cover = [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position)[0];
          return (
            <Link key={a.id} href={`/painel/animais/${a.id}`} className="card overflow-hidden">
              <div className="h-32" style={{ background: tintFor(a.name) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {cover && <img src={photoUrl(cover.storage_path)!} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 p-3">
                <span><strong>{a.name}</strong> <span className="text-xs text-muted">· {t(speciesText(a.species, a.breed))}</span></span>
                <span className="chip">{t(ANIMAL_STATUS_LABEL[a.status])}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {!data?.length && <p className="card p-8 text-center text-muted">{t('Nenhum animal cadastrado ainda.')}</p>}
    </div>
  );
}
