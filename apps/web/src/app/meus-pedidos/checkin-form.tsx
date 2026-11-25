'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { createClient } from '@/lib/supabase/client';
import { compressImage, extOf } from '@/lib/image';
import { useConfirm } from '@/components/confirm';
import { useObjectUrls } from '@/lib/use-object-urls';

const MAX_PHOTOS = 3;

/** Resposta do check-in com até 3 fotos (comprimidas no navegador, bucket privado checkin-photos). */
export function CheckinForm({ checkinId, adoptionId, userId, title }: { checkinId: string; adoptionId: string; userId: string; title: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const [files, setFiles] = useState<File[]>([]);
  const previews = useObjectUrls(files);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (!(await confirm({ title: 'Enviar resposta do check-in?', message: 'A ONG vai ver sua resposta. Se marcou que está com dificuldade, ela entra em contato.', confirmLabel: 'Enviar' }))) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const fd = new FormData(form);
    const paths: string[] = [];
    for (const original of files) {
      const f = await compressImage(original);
      const path = `${userId}/${adoptionId}/${crypto.randomUUID()}.${extOf(f)}`;
      const up = await supabase.storage.from('checkin-photos').upload(path, f, { contentType: f.type });
      if (!up.error) paths.push(path);
    }
    const { error } = await supabase.rpc('answer_checkin', {
      p_checkin_id: checkinId,
      p_answers: { adaptacao: String(fd.get('adaptacao') ?? ''), comentario: String(fd.get('comentario') ?? '') },
      p_photo_paths: paths,
      p_needs_help: fd.get('needs_help') === 'on',
    });
    setBusy(false);
    if (error) return setError('Não foi possível enviar. Tente de novo.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-3 p-5">
      {dialog}
      <strong>{title}</strong>
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('Como está a adaptação?')}</span>
        <select name="adaptacao" className="field" required>
          <option value="ótima">{t('Ótima')}</option><option value="boa">{t('Boa')}</option><option value="difícil">{t('Difícil')}</option>
        </select>
      </label>
      <textarea name="comentario" rows={2} placeholder={t('Conte como estão as coisas')} className="field h-auto py-3" />
      <div className="flex flex-col gap-1.5">
        <span className="label">{t('Fotos (opcional, até {n})', { n: MAX_PHOTOS })}</span>
        <div className="flex flex-wrap items-center gap-2">
          {files.map((f, i) => (
            <button key={i} type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t('Remover foto')}
              className="relative h-16 w-16 overflow-hidden rounded-xl bg-ground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previews[i] && <img src={previews[i]} alt="" className="h-full w-full object-cover" />}
              <span className="absolute top-0.5 right-0.5 rounded-full bg-ink/70 px-1.5 text-[10px] font-bold text-white">✕</span>
            </button>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="btn-ghost min-h-11 cursor-pointer bg-white px-3 text-sm">
              {t('Adicionar foto')}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles([...files, f].slice(0, MAX_PHOTOS)); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="needs_help" className="h-5 w-5 accent-brand" /> {t('Estou com dificuldade e quero ajuda da ONG')}</label>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{t(error)}</p>}
      <button type="submit" disabled={busy} className="btn-primary self-start">{busy ? t('Enviando…') : t('Enviar')}</button>
    </form>
  );
}
