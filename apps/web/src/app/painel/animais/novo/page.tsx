import { getMyNgo } from '@/lib/ngo';
import { AnimalForm } from '../animal-form';

export default async function Page() {
  const { ngo } = await getMyNgo();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Cadastrar animal</h1>
      <AnimalForm ngoId={ngo!.id} />
    </div>
  );
}
