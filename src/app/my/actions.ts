"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** 저장된 풀이 삭제 (RLS 로 본인 것만 삭제됩니다) */
export async function deleteReading(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("saju_readings").delete().eq("id", id);
  revalidatePath("/my");
}

/** 사주 프로필 삭제 */
export async function deleteProfile(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("saju_profiles").delete().eq("id", id);
  revalidatePath("/my");
}
