'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@adotai/shared';

type Role = Database['public']['Enums']['user_role'];
type AnimalStatus = Database['public']['Enums']['animal_status'];

export async function verifyNgo(ngoId: string, ok: boolean) {
  const supabase = await createClient();
  await supabase.rpc('admin_verify_ngo', { p_ngo_id: ngoId, p_verified: ok });
  revalidatePath('/admin', 'layout');
}

export async function setUserRole(userId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: String(formData.get('role')) as Role });
  revalidatePath('/admin/usuarios');
}

export async function setAnimalStatus(animalId: string, status: AnimalStatus) {
  const supabase = await createClient();
  await supabase.rpc('admin_set_animal_status', { p_animal_id: animalId, p_status: status });
  revalidatePath('/admin', 'layout');
}

export async function resolveReport(reportId: string) {
  const supabase = await createClient();
  await supabase.rpc('admin_resolve_report', { p_report_id: reportId });
  revalidatePath('/admin', 'layout');
}
