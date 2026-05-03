import { supabaseAdmin } from "@/lib/supabase";

export async function getCompanyData() {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_settings")
      .select("*")
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
