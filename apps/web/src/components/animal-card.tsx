import Link from 'next/link';
import { formatAge, formatDistance, formatRating, sexLabel, SIZE_LABEL, type AnimalSex, type AnimalSize } from '@adotai/shared';
import { photoUrl, tintFor } from '@/lib/utils';
import { PawIcon, VerifiedIcon } from './icons';

export type AnimalCardData = {
  id: string;
  name: string;
  sex: AnimalSex;
  size: AnimalSize;
  age_months: number | null;
  distance_km?: number | null;
  cover_path: string | null;
  ngo_name: string;
  ngo_verified: boolean;
  ngo_rating: number | null;
  neutered?: boolean | null;
};

export function AnimalCard({ a }: { a: AnimalCardData }) {
  const img = photoUrl(a.cover_path);
  const rating = formatRating(a.ngo_rating);
  return (
    <Link href={`/animais/${a.id}`} className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative flex h-40 items-center justify-center" style={{ background: tintFor(a.name) }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={`Foto de ${a.name}`} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <PawIcon size={40} className="text-ink/30" />
        )}
        {a.distance_km != null && (
          <span className="absolute top-2.5 left-2.5 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold">
            {formatDistance(a.distance_km)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <span className="text-base font-extrabold">{a.name}</span>
        <span className="text-[13px] text-muted">
          {sexLabel(a.sex)} · {formatAge(a.age_months)} · {SIZE_LABEL[a.size]}
        </span>
        <span className="mt-1.5 flex items-center gap-1 truncate text-xs font-semibold">
          {a.ngo_verified && <VerifiedIcon size={13} className="shrink-0 text-brand" />}
          {a.ngo_name} · {rating ? `★ ${rating}` : 'Nova na plataforma'}
        </span>
      </div>
    </Link>
  );
}
