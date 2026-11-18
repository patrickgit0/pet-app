import { getI18n } from '@/i18n/server';
import { revalidatePath } from 'next/cache';
import { formatCnpj } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';

async function save(ngoId: string, fd: FormData) {
  'use server';
  const supabase = await createClient();
  await supabase.from('ngos').update({
    description: String(fd.get('description') || '') || null,
    email: String(fd.get('email') || '') || null,
    phone: String(fd.get('phone') || '') || null,
    pix_key: String(fd.get('pix_key') || '') || null,
  }).eq('id', ngoId);
  revalidatePath('/painel/ong');
}

export default async function Page() {
  const { ngo } = await getMyNgo();
  const { t } = await getI18n();
  const n = ngo!;
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Dados da ONG')}</h1>
      <p className="text-sm text-muted">{n.name} · CNPJ {formatCnpj(n.cnpj)} · {n.neighborhood}, {n.city}/{n.state}</p>
      <form action={save.bind(null, n.id)} className="card flex flex-col gap-4 p-5 sm:p-6">
        <label className="flex flex-col gap-1.5"><span className="label">{t('Sobre a ONG')}</span><textarea name="description" rows={4} defaultValue={n.description ?? ''} className="field h-auto py-3" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className="label">{t('E-mail')}</span><input name="email" defaultValue={n.email ?? ''} className="field" /></label>
          <label className="flex flex-col gap-1.5"><span className="label">{t('Telefone')}</span><input name="phone" defaultValue={n.phone ?? ''} className="field" /></label>
        </div>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Chave Pix para doações (aparece na página pública)')}</span><input name="pix_key" defaultValue={n.pix_key ?? ''} className="field" /></label>
        <button className="btn-primary self-start">{t('Salvar')}</button>
      </form>
    </div>
  );
}
