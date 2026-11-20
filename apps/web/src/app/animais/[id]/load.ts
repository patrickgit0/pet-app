import { cache } from 'react';
import { animalRef } from '@/lib/animal-ref';
import { createClient } from '@/lib/supabase/server';

/** Uma consulta por requisição (layout, metadados e página usam a mesma). */
export const loadAnimal = cache(async (param: string) => {
  const { col, value } = animalRef(param);
  const supabase = await createClient();
  const { data } = await supabase
    .from('animals')
    .select('*, ngos(id, name, slug, verified_at, rating, completed_adoptions, median_response_minutes, neighborhood, city, whatsapp, opening_hours, pix_key, application_questions), animal_photos(storage_path, position)')
    .eq(col, value)
    .maybeSingle();
  return data;
});
