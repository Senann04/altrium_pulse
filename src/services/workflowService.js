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
    actionItems: (row.actions || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      ownerId: item.owner_id,
      dueDate: item.due_date,
      status: item.status,
      completedAt: item.completed_at,
    })),
    evidence: row.evidence || "",
    reason: row.reason || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    employeeAgreementStatus: row.employee_agreement_status || "pending",
    employeeAgreedAt: row.employee_agreed_at,
    supervisorAgreementStatus: row.supervisor_agreement_status || "pending",
    supervisorAgreedAt: row.supervisor_agreed_at,
  };
}

export async function loadPeopleDirectory({ includeSupervisors = true, managedOnly = false } = {}) {
  const client = requireSupabase();
  const user = managedOnly ? await requireCurrentUser() : null;
  let query = client
    .from("profiles")
    .select("id, employee_number, full_name, role, manager_id, hr_partner_id, department:departments!profiles_department_id_fkey(name)")
    .eq("is_active", true)
    .order("full_name");

  if (!includeSupervisors) query = query.eq("role", "employee");
  else query = query.in("role", ["employee", "supervisor"]);

  if (managedOnly) {
    const { data: managerProfile, error: managerError } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (managerError) throw managerError;

    // Profile RLS already returns the HRBP's assigned-team/project union.
    if (managerProfile.role === "supervisor") query = query.eq("manager_id", user.id);
    else if (!["hr_partner", "senior_management"].includes(managerProfile.role)) query = query.eq("id", user.id);
  }

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
  reason,
  start_date,
  end_date,
  employee_agreement_status,
  employee_agreed_at,
  supervisor_agreement_status,
  supervisor_agreed_at,
  employee_id,
  employee:profiles!development_plans_employee_id_fkey(
    id,
    employee_number,
    full_name,
    department:departments!profiles_department_id_fkey(name)
  ),
  actions:development_plan_actions(id, title, description, owner_id, due_date, status, completed_at)
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
  await requireCurrentUser();
  if (!goal.employeeUserId) throw new Error("A valid employee must be selected.");

  const actionItems = Array.isArray(goal.actionItems)
    ? goal.actionItems.filter((item) => item.title?.trim())
    : goal.actionItem?.trim()
      ? [{ title: goal.actionItem.trim(), dueDate: goal.endDate || null }]
      : [];
  const { data: plan, error: planError } = await client.rpc("create_development_plan", {
    p_employee_id: goal.employeeUserId,
    p_review_id: goal.reviewId || null,
    p_type: type.toLowerCase(),
    p_title: goal.goal,
    p_reason: goal.reason,
    p_start_date: goal.startDate,
    p_end_date: goal.endDate,
    p_actions: actionItems.map((item) => ({
      title: item.title.trim(),
      description: item.description?.trim() || item.title.trim(),
      dueDate: item.dueDate,
    })),
  });

  if (planError) throw planError;
  const savedPlan = firstRelation(plan);

  const { data: saved, error: loadError } = await client
    .from("development_plans")
    .select(assignedPlanSelect)
    .eq("id", savedPlan.id)
    .single();

  if (loadError) throw loadError;
  return mapAssignedPlan(saved);
}

export async function updateDevelopmentPlan(goalId, fields) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("update_draft_development_plan", {
    p_plan_id: goalId,
    p_title: String(fields.goal || "").trim(),
    p_progress: Number(fields.progress ?? 0),
  });
  if (error) throw error;
  return firstRelation(data);
}

export async function loadMyDevelopmentPlans(type) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from("development_plans")
    .select("id, title, reason, start_date, end_date, status, progress, employee_agreement_status, employee_agreed_at, supervisor_agreement_status, supervisor_agreed_at, actions:development_plan_actions(id, title, description, owner_id, due_date, status, completed_at)")
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
    reason: row.reason || "",
    employeeAgreementStatus: row.employee_agreement_status || "pending",
    employeeAgreedAt: row.employee_agreed_at,
    supervisorAgreementStatus: row.supervisor_agreement_status || "pending",
    supervisorAgreedAt: row.supervisor_agreed_at,
    actionItems: row.actions || [],
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
        department:departments!profiles_department_id_fkey(name)
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
        department:departments!profiles_department_id_fkey(name)
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
    status: row.status === "draft" ? "Draft" : row.status === "closed" ? "Closed" : "Active",
    reviewType: row.review_type || "Performance Review",
    active: row.status === "active",
    appliesTo: row.applies_to || "both",
    selfReviewDue: row.self_review_due || "",
    feedbackDue: row.feedback_due || "",
    supervisorReviewDue: row.supervisor_review_due || "",
  };
}

export async function loadReviewCycles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("review_cycles")
    .select("id, name, description, start_date, end_date, self_review_due, feedback_due, supervisor_review_due, status, review_type, applies_to")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReviewCycle);
}

export async function createReviewCycle(cycle) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client
    .rpc("create_review_cycle", {
      p_name: cycle.name,
      p_description: cycle.description || "",
      p_start_date: cycle.startDate,
      p_end_date: cycle.endDate,
      p_self_review_due: cycle.selfReviewDue || null,
      p_feedback_due: cycle.feedbackDue || null,
      p_supervisor_review_due: cycle.supervisorReviewDue || null,
      p_review_type: cycle.reviewType || "Performance Review",
      p_applies_to: cycle.appliesTo || "both",
    });
  if (error) throw error;
  return mapReviewCycle(firstRelation(data));
}

export async function setReviewCycleStatus(cycleId, status) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("set_review_cycle_status", {
    p_cycle_id: cycleId,
    p_status: status,
  });
  if (error) throw error;
  return mapReviewCycle(firstRelation(data));
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
    notes: row.notes || "",
  };
}

export async function loadParMeeting(reviewId) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  let query = client
    .from("par_meetings")
    .select("id, review_id, employee_id, supervisor_id, scheduled_at, status, notes")
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
    status: meeting.status || "scheduled",
    notes: meeting.notes?.trim() || null,
    created_by: user.id,
  };

  const { data, error } = await client
    .from("par_meetings")
    .upsert(payload, { onConflict: "review_id" })
    .select("id, review_id, employee_id, supervisor_id, scheduled_at, status, notes")
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

const reviewStatusLabels = {
  not_started: "Not started",
  self_review: "Self assessment",
  peer_feedback: "Peer feedback",
  supervisor_review: "Supervisor review",
  hr_review: "HR review",
  completed: "Completed",
  reopened: "Reopened",
};

export async function loadHrReviewOperations() {
  const client = requireSupabase();
  await requireCurrentUser();

  const [reviewsResult, requestsResult, meetingsResult, normalizationResult, directory] = await Promise.all([
    client
      .from("reviews")
      .select(`
        id,
        status,
        due_date,
        supervisor_summary,
        supervisor_rating,
        hr_comments,
        overall_rating,
        completed_at,
        cycle:review_cycles(id, name, status, start_date, end_date),
        employee:profiles!reviews_employee_id_fkey(
          id,
          employee_number,
          full_name,
          department_id,
          department:departments!profiles_department_id_fkey(name)
        )
      `)
      .order("created_at", { ascending: false }),
    client
      .from("feedback_requests")
      .select(`
        id,
        review_id,
        reviewer_id,
        feedback_type,
        status,
        due_date,
        reviewer:profiles!feedback_requests_reviewer_id_fkey(id, employee_number, full_name)
      `)
      .eq("feedback_type", "peer")
      .order("created_at", { ascending: false }),
    client
      .from("par_meetings")
      .select("id, review_id, scheduled_at, status, notes"),
    client
      .from("normalization_decisions")
      .select("review_id, status, proposed_rating, normalized_rating, rationale, decided_at"),
    loadPeopleDirectory({ includeSupervisors: false, managedOnly: true }),
  ]);

  if (reviewsResult.error) throw reviewsResult.error;
  if (requestsResult.error) throw requestsResult.error;
  if (meetingsResult.error) throw meetingsResult.error;
  if (normalizationResult.error) throw normalizationResult.error;

  const reviews = reviewsResult.data || [];
  const reviewIds = new Set(reviews.map((review) => review.id));
  const requests = (requestsResult.data || []).filter((request) => reviewIds.has(request.review_id));

  return reviews
    .map((review) => {
      const cycle = firstRelation(review.cycle);
      const employee = firstRelation(review.employee);
      const department = firstRelation(employee?.department);
      const peerRequests = requests
        .filter((request) => request.review_id === review.id)
        .map((request) => {
          const reviewer = firstRelation(request.reviewer);
          return {
            id: request.id,
            reviewerId: request.reviewer_id,
            reviewerName: reviewer?.full_name || "Assigned reviewer",
            reviewerNumber: reviewer?.employee_number || "",
            status: request.status,
            dueDate: request.due_date,
          };
        });
      const meeting = (meetingsResult.data || []).find((item) => item.review_id === review.id) || null;
      const normalization = (normalizationResult.data || []).find((item) => item.review_id === review.id) || null;

      return {
        id: review.id,
        employeeId: employee?.id || "",
        employeeNumber: employee?.employee_number || "",
        employeeName: employee?.full_name || "Employee",
        team: department?.name || "Unassigned",
        cycleName: cycle?.name || "Review cycle",
        cycleStatus: cycle?.status || "draft",
        cycleStartDate: cycle?.start_date || "",
        cycleEndDate: cycle?.end_date || "",
        status: reviewStatusLabels[review.status] || review.status,
        statusKey: review.status,
        dueDate: review.due_date,
        supervisorSummary: review.supervisor_summary || "",
        supervisorRating: review.supervisor_rating,
        hrComments: review.hr_comments || "",
        overallRating: review.overall_rating,
        completedAt: review.completed_at,
        meeting,
        normalization,
        peerRequests,
        reviewerOptions: directory.filter((person) => person.userId !== employee?.id),
      };
    })
    .sort((left, right) => {
      const leftActive = left.cycleStatus === "active" ? 0 : 1;
      const rightActive = right.cycleStatus === "active" ? 0 : 1;
      return leftActive - rightActive || left.employeeName.localeCompare(right.employeeName);
    });
}

export async function assignPeerReviewer(reviewId, reviewerId, dueDate = null) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (!reviewId || !reviewerId) throw new Error("Select an employee and peer reviewer first.");

  const { data, error } = await client
    .from("feedback_requests")
    .upsert({
      review_id: reviewId,
      reviewer_id: reviewerId,
      feedback_type: "peer",
      visibility: "management_only",
      status: "pending",
      due_date: dueDate || null,
      assigned_by: user.id,
      responded_at: null,
    }, { onConflict: "review_id,reviewer_id,feedback_type" })
    .select("id, review_id, reviewer_id, status, due_date")
    .single();

  if (error) throw error;
  return data;
}
