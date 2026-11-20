import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const loadNgo = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from('ngos').select('*').eq('slug', slug).maybeSingle();
  return data;
});
