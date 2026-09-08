import { supabase } from "../lib/supabase";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function loadJoiningDateRoster() {
  const client = requireSupabase();
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userResult.user) throw new Error("Authentication required.");

  const { data, error } = await client
    .from("profiles")
    .select("id, employee_number, full_name, role, job_title, joined_on")
    .eq("is_active", true)
    .eq("hr_partner_id", userResult.user.id)
    .in("role", ["employee", "supervisor"])
    .order("full_name");
  if (error) throw error;
  return data || [];
}

export async function saveJoiningDate(employeeId, joinedOn) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("set_employee_joining_date", {
    p_employee_id: employeeId,
    p_joined_on: joinedOn,
  });
  if (error) throw error;
  return data;
}
