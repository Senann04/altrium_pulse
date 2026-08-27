import { supabase } from "../lib/supabase";

export async function loadProfileView(userId) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, employee_number, full_name, email, role, job_title, department_id, manager_id, hr_partner_id",
    )
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const relatedIds = [...new Set([profile.manager_id, profile.hr_partner_id].filter(Boolean))];

  const [departmentResult, peopleResult, cycleResult] = await Promise.all([
    profile.department_id
      ? supabase.from("departments").select("name").eq("id", profile.department_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    relatedIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", relatedIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("review_cycles")
      .select("name")
      .eq("status", "active")
      .order("start_date", { ascending: false })
      .limit(1),
  ]);

  if (departmentResult.error) throw departmentResult.error;
  if (peopleResult.error) throw peopleResult.error;
  if (cycleResult.error) throw cycleResult.error;

  const people = new Map((peopleResult.data || []).map((person) => [person.id, person.full_name]));

  return {
    role: profile.role,
    data: {
      identifier: profile.employee_number || profile.email || "",
      department: departmentResult.data?.name || "Department",
      parCycle: cycleResult.data?.[0]?.name || "Current PAR Cycle",
      name: profile.full_name || "",
      nic: "",
      contactNo: "",
      personalEmail: profile.email || "",
      address: "",
      immediateSupervisor: people.get(profile.manager_id) || "",
      hrBusinessPartner: people.get(profile.hr_partner_id) || "",
      jobTitle: profile.job_title || "",
    },
  };
}
