import { supabase } from "../lib/supabase";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

async function requireCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Authentication required.");
  return data.user;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function planStatusLabel(status, overdue = false) {
  if (status === "completed") return "Completed";
  if (overdue) return "Overdue";
  if (status === "active") return "Ongoing";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

function assignedPlanStatusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "active") return "In Progress";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

function firstRelation(value) {
  return Array.isArray(value) ? value[0] : value;
}

function mapDirectoryPerson(row) {
  const department = firstRelation(row.department);
  return {
    id: row.employee_number || row.id,
    userId: row.id,
    name: row.full_name,
    team: department?.name || "Unassigned",
    role: row.role,
  };
}

function mapAssignedPlan(row) {
  const employee = firstRelation(row.employee);
  const department = firstRelation(employee?.department);
  const action = row.actions?.[0];
  return {
    id: row.id,
    type: row.type?.toUpperCase(),
    team: department?.name || "Unassigned",
    employeeName: employee?.full_name || "",
    employeeId: employee?.employee_number || employee?.id || row.employee_id,
    employeeUserId: row.employee_id,
    goal: row.title,
    status: assignedPlanStatusLabel(row.status),
    progress: row.progress ?? 0,
    actionId: action?.id || null,
    actionItem: action?.description || action?.title || "",
    actionItemCompleted: action?.status === "completed",
    evidence: row.evidence || "",
  };
}

export async function loadPeopleDirectory({ includeSupervisors = true } = {}) {
  const client = requireSupabase();
  let query = client
    .from("profiles")
    .select("id, employee_number, full_name, role, department:departments(name)")
    .eq("is_active", true)
    .order("full_name");

  if (!includeSupervisors) query = query.eq("role", "employee");
  else query = query.in("role", ["employee", "supervisor"]);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapDirectoryPerson);
}

const assignedPlanSelect = `
  id,
  type,
  title,
  status,
  progress,
  evidence,
  employee_id,
  employee:profiles!development_plans_employee_id_fkey(
    id,
    employee_number,
    full_name,
    department:departments(name)
  ),
  actions:development_plan_actions(id, title, description, status, completed_at)
`;

export async function loadAssignedDevelopmentPlans(type) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("development_plans")
    .select(assignedPlanSelect)
    .eq("type", type.toLowerCase())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapAssignedPlan);
}

export async function createDevelopmentPlan(type, goal) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (!goal.employeeUserId) throw new Error("A valid employee must be selected.");

  const today = new Date().toISOString().slice(0, 10);
  const { data: plan, error: planError } = await client
    .from("development_plans")
    .insert({
      employee_id: goal.employeeUserId,
      owner_id: goal.employeeUserId,
      type: type.toLowerCase(),
      title: goal.goal,
      start_date: today,
      status: "active",
      progress: goal.progress ?? 0,
      evidence: goal.evidence || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (planError) throw planError;

  if (goal.actionItem?.trim()) {
    const { error: actionError } = await client.from("development_plan_actions").insert({
      plan_id: plan.id,
      title: goal.actionItem.trim(),
      description: goal.actionItem.trim(),
      owner_id: goal.employeeUserId,
      status: goal.actionItemCompleted ? "completed" : "not_started",
      completed_at: goal.actionItemCompleted ? new Date().toISOString() : null,
    });
    if (actionError) throw actionError;
  }

  const { data: saved, error: loadError } = await client
    .from("development_plans")
    .select(assignedPlanSelect)
    .eq("id", plan.id)
    .single();

  if (loadError) throw loadError;
  return mapAssignedPlan(saved);
}

export async function updateDevelopmentPlan(goalId, fields) {
  const client = requireSupabase();
  const planUpdate = {};
  if (fields.goal !== undefined) planUpdate.title = fields.goal;
  if (fields.progress !== undefined) planUpdate.progress = fields.progress;
  if (fields.evidence !== undefined) planUpdate.evidence = fields.evidence || null;
  if (fields.status === "Completed") planUpdate.status = "completed";

  if (Object.keys(planUpdate).length) {
    const { error } = await client.from("development_plans").update(planUpdate).eq("id", goalId);
    if (error) throw error;
  }

  if (fields.actionId) {
    const actionUpdate = {};
    if (fields.actionItem !== undefined) {
      actionUpdate.title = fields.actionItem || "Action item";
      actionUpdate.description = fields.actionItem || null;
    }
    if (fields.actionItemCompleted !== undefined) {
      actionUpdate.status = fields.actionItemCompleted ? "completed" : "in_progress";
      actionUpdate.completed_at = fields.actionItemCompleted ? new Date().toISOString() : null;
    }
    if (Object.keys(actionUpdate).length) {
      const { error } = await client
        .from("development_plan_actions")
        .update(actionUpdate)
        .eq("id", fields.actionId)
        .eq("plan_id", goalId);
      if (error) throw error;
    }
  } else if (fields.actionItem?.trim()) {
    const { data: plan, error: planError } = await client
      .from("development_plans")
      .select("employee_id")
      .eq("id", goalId)
      .single();
    if (planError) throw planError;

    const { error } = await client.from("development_plan_actions").insert({
      plan_id: goalId,
      title: fields.actionItem.trim(),
      description: fields.actionItem.trim(),
      owner_id: plan.employee_id,
      status: fields.actionItemCompleted ? "completed" : "not_started",
      completed_at: fields.actionItemCompleted ? new Date().toISOString() : null,
    });
    if (error) throw error;
  }

  return { id: goalId, ...fields, ...planUpdate };
}

export async function completeDevelopmentPlan(goalId) {
  const client = requireSupabase();
  const { error } = await client
    .from("development_plans")
    .update({ status: "completed", progress: 100 })
    .eq("id", goalId);
  if (error) throw error;
}

export async function loadMyDevelopmentPlans(type) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from("development_plans")
    .select("id, title, start_date, end_date, status, progress")
    .eq("employee_id", user.id)
    .eq("type", type.toLowerCase())
    .order("created_at", { ascending: false });

  if (error) throw error;
  const today = new Date().toISOString().slice(0, 10);
  return (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    status: planStatusLabel(row.status, row.end_date && row.end_date < today),
    start_date: row.start_date,
    target_date: row.end_date || "",
    progress: row.progress ?? 0,
  }));
}

function mapTimeGoal(row) {
  const employee = firstRelation(row.employee);
  const department = firstRelation(employee?.department);
  return {
    id: row.id,
    period: row.period ? `${row.period[0].toUpperCase()}${row.period.slice(1)}` : "",
    team: department?.name || "Unassigned",
    personId: employee?.employee_number || employee?.id || row.employee_id,
    personName: employee?.full_name || "",
    targetUserId: row.employee_id,
    targetRole: employee?.role || "employee",
    goal: row.title,
    status: row.status === "completed" ? "Completed" : "Ongoing",
    progress: row.progress ?? 0,
  };
}

export async function loadTimeGoals() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("goals")
    .select(`
      id,
      employee_id,
      title,
      status,
      progress,
      period,
      employee:profiles!goals_employee_id_fkey(
        id,
        employee_number,
        full_name,
        role,
        department:departments(name)
      )
    `)
    .not("period", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTimeGoal);
}

export async function createTimeGoal(goal) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (!goal.targetUserId) throw new Error("A valid employee or supervisor must be selected.");

  const { data, error } = await client
    .from("goals")
    .insert({
      employee_id: goal.targetUserId,
      title: goal.goal,
      status: "in_progress",
      progress: goal.progress ?? 0,
      period: goal.period.toLowerCase(),
      created_by: user.id,
    })
    .select(`
      id,
      employee_id,
      title,
      status,
      progress,
      period,
      employee:profiles!goals_employee_id_fkey(
        id,
        employee_number,
        full_name,
        role,
        department:departments(name)
      )
    `)
    .single();
  if (error) throw error;
  return mapTimeGoal(data);
}

function mapReviewCycle(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    status: row.status === "draft" ? "Pending..." : row.status,
    reviewType: row.review_type || "Performance Review",
    active: row.status === "active",
    appliesTo: row.applies_to || "both",
  };
}

export async function loadReviewCycles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("review_cycles")
    .select("id, name, description, start_date, end_date, status, review_type, applies_to")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReviewCycle);
}

export async function createReviewCycle(cycle) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from("review_cycles")
    .insert({
      name: cycle.name,
      description: cycle.description || null,
      start_date: cycle.startDate,
      end_date: cycle.endDate,
      status: cycle.active ? "active" : "draft",
      review_type: cycle.reviewType || null,
      applies_to: cycle.appliesTo || "both",
      created_by: user.id,
    })
    .select("id, name, description, start_date, end_date, status, review_type, applies_to")
    .single();
  if (error) throw error;
  return mapReviewCycle(data);
}

export async function deleteReviewCycle(cycleId) {
  const client = requireSupabase();
  const { error } = await client.from("review_cycles").delete().eq("id", cycleId);
  if (error) throw error;
}

function mapParMeeting(row) {
  if (!row) return null;
  const date = new Date(row.scheduled_at);
  return {
    id: row.id,
    reviewId: row.review_id,
    employeeId: row.employee_id,
    date: date.toISOString().slice(0, 10),
    time: date.toTimeString().slice(0, 5),
    status: row.status === "scheduled" ? "Scheduled" : row.status,
  };
}

export async function loadParMeeting(reviewId) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  let query = client
    .from("par_meetings")
    .select("id, review_id, employee_id, supervisor_id, scheduled_at, status")
    .order("scheduled_at", { ascending: false })
    .limit(1);

  if (reviewId) query = query.eq("review_id", reviewId);
  else query = query.or(`employee_id.eq.${user.id},supervisor_id.eq.${user.id}`);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return mapParMeeting(data);
}

export async function saveParMeeting(meeting, { reviewId, employeeId } = {}) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  let review;

  if (reviewId) {
    const { data, error } = await client
      .from("reviews")
      .select("id, employee_id, supervisor_id")
      .eq("id", reviewId)
      .single();
    if (error) throw error;
    review = data;
  } else {
    let query = client
      .from("reviews")
      .select("id, employee_id, supervisor_id")
      .eq("supervisor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (employeeId) query = query.eq("employee_id", employeeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    review = data;
  }

  if (!review) throw new Error("No review is available for PAR meeting scheduling.");
  const scheduledAt = new Date(`${meeting.date}T${meeting.time}:00`).toISOString();
  const payload = {
    review_id: review.id,
    employee_id: review.employee_id,
    supervisor_id: review.supervisor_id || user.id,
    scheduled_at: scheduledAt,
    status: "scheduled",
    created_by: user.id,
  };

  const { data, error } = await client
    .from("par_meetings")
    .upsert(payload, { onConflict: "review_id" })
    .select("id, review_id, employee_id, supervisor_id, scheduled_at, status")
    .single();
  if (error) throw error;
  return mapParMeeting(data);
}

export async function loadReviewProgress(reviewId) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  let query = client
    .from("reviews")
    .select("id, status, employee_submitted_at, supervisor_submitted_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (reviewId) query = query.eq("id", reviewId);
  else query = query.or(`employee_id.eq.${user.id},supervisor_id.eq.${user.id},hr_partner_id.eq.${user.id}`);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}
