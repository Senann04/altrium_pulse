import { supabase } from "../lib/supabase";
import { parseSelfAssessment } from "./reviewService";

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

function firstRelation(value) {
  return Array.isArray(value) ? value[0] : value;
}

export async function loadAssignedPeerRequests() {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data, error } = await client
    .from("feedback_requests")
    .select(`
      id,
      review_id,
      status,
      due_date,
      responded_at,
      review:reviews!feedback_requests_review_id_fkey(
        id,
        status,
        employee:profiles!reviews_employee_id_fkey(id, employee_number, full_name, job_title),
        cycle:review_cycles(id, name, end_date)
      )
    `)
    .eq("reviewer_id", user.id)
    .eq("feedback_type", "peer")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((request) => {
    const review = firstRelation(request.review);
    const employee = firstRelation(review?.employee);
    const cycle = firstRelation(review?.cycle);
    return {
      id: request.id,
      reviewId: request.review_id,
      status: request.status,
      dueDate: request.due_date,
      respondedAt: request.responded_at,
      reviewStatus: review?.status || "not_started",
      employeeId: employee?.id || "",
      employeeNumber: employee?.employee_number || "",
      employeeName: employee?.full_name || "Employee",
      employeeJobTitle: employee?.job_title || "",
      cycleName: cycle?.name || "Review cycle",
      cycleEndDate: cycle?.end_date || "",
    };
  });
}

export async function submitAssignedPeerFeedback(request, feedback) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  if (!request?.id) throw new Error("A valid feedback request is required.");
  if (!feedback.strengths?.trim() || !feedback.improvements?.trim()) {
    throw new Error("Complete both structured feedback questions.");
  }
  const rating = Number(feedback.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Choose a rating between 1 and 5.");
  }

  const { error } = await client
    .from("review_feedback")
    .insert({
      request_id: request.id,
      review_id: request.reviewId,
      reviewer_id: user.id,
      subject_id: request.employeeId,
      feedback_type: "peer",
      visibility: "management_only",
      strengths: feedback.strengths.trim(),
      improvements: feedback.improvements.trim(),
      comments: feedback.comments?.trim() || null,
      rating,
    });

  if (error) throw error;
  return { requestId: request.id, submitted: true };
}

export async function loadSupervisorReviewOperations() {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const { data: reviews, error: reviewsError } = await client
    .from("reviews")
    .select(`
      id,
      status,
      employee_summary,
      employee_submitted_at,
      supervisor_summary,
      supervisor_rating,
      supervisor_submitted_at,
      overall_rating,
      completed_at,
      due_date,
      employee:profiles!reviews_employee_id_fkey(id, employee_number, full_name, job_title, department:departments!profiles_department_id_fkey(name)),
      cycle:review_cycles(id, name, start_date, end_date, status)
    `)
    .eq("supervisor_id", user.id)
    .order("created_at", { ascending: false });
  if (reviewsError) throw reviewsError;

  const reviewRows = reviews || [];
  if (!reviewRows.length) return [];
  const reviewIds = reviewRows.map((review) => review.id);
  const employeeIds = reviewRows
    .map((review) => firstRelation(review.employee)?.id)
    .filter(Boolean);

  const [feedbackResult, requestResult, meetingResult, planResult, historyResult] = await Promise.all([
    client.rpc("get_management_review_feedback", { p_review_ids: reviewIds }),
    client
      .from("feedback_requests")
      .select("id, review_id, reviewer_id, status, due_date, reviewer:profiles!feedback_requests_reviewer_id_fkey(id, employee_number, full_name)")
      .in("review_id", reviewIds)
      .order("created_at", { ascending: true }),
    client
      .from("par_meetings")
      .select("id, review_id, scheduled_at, status, notes")
      .in("review_id", reviewIds),
    client
      .from("development_plans")
      .select("id, review_id, employee_id, type, title, reason, start_date, end_date, status, progress, employee_agreement_status, employee_agreed_at, supervisor_agreement_status, supervisor_agreed_at, actions:development_plan_actions(id, title, description, owner_id, due_date, status, completed_at)")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),
    client
      .from("reviews")
      .select("id, employee_id, status, overall_rating, completed_at, supervisor_summary, hr_comments, cycle:review_cycles(name, start_date, end_date)")
      .in("employee_id", employeeIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
  ]);

  const failed = [feedbackResult, requestResult, meetingResult, planResult, historyResult]
    .find((result) => result.error);
  if (failed) throw failed.error;

  return reviewRows.map((review) => {
    const employee = firstRelation(review.employee);
    const department = firstRelation(employee?.department);
    const cycle = firstRelation(review.cycle);
    const feedback = (feedbackResult.data || [])
      .filter((item) => item.review_id === review.id)
      .map((item) => ({
        ...item,
        reviewerName: item.reviewer_name || "Assigned reviewer",
        reviewerNumber: item.reviewer_number || "",
      }));
    const requests = (requestResult.data || [])
      .filter((item) => item.review_id === review.id)
      .map((item) => {
        const reviewer = firstRelation(item.reviewer);
        return {
          ...item,
          reviewerName: reviewer?.full_name || "Assigned reviewer",
        };
      });
    const meeting = (meetingResult.data || []).find((item) => item.review_id === review.id) || null;
    const plans = (planResult.data || []).filter((plan) => (
      plan.employee_id === employee?.id && (!plan.review_id || plan.review_id === review.id)
    ));
    const history = (historyResult.data || [])
      .filter((item) => item.employee_id === employee?.id && item.id !== review.id)
      .map((item) => ({ ...item, cycle: firstRelation(item.cycle) }));

    return {
      id: review.id,
      status: review.status,
      dueDate: review.due_date,
      employeeId: employee?.id || "",
      employeeNumber: employee?.employee_number || "",
      employeeName: employee?.full_name || "Employee",
      employeeJobTitle: employee?.job_title || "",
      team: department?.name || "Unassigned",
      cycleName: cycle?.name || "Review cycle",
      cycleStatus: cycle?.status || "draft",
      selfAssessment: parseSelfAssessment(review.employee_summary),
      employeeSubmittedAt: review.employee_submitted_at,
      supervisorSummary: review.supervisor_summary || "",
      supervisorRating: review.supervisor_rating ?? "",
      supervisorSubmittedAt: review.supervisor_submitted_at,
      overallRating: review.overall_rating,
      completedAt: review.completed_at,
      peerFeedback: feedback,
      peerRequests: requests,
      meeting,
      plans,
      history,
    };
  });
}

export async function respondToPlanAgreement(planId, decision) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("respond_to_plan_agreement", {
    p_plan_id: planId,
    p_decision: decision,
  });
  if (error) throw error;
  return firstRelation(data);
}

export async function updateDevelopmentActionStatus(actionId, status) {
  const client = requireSupabase();
  await requireCurrentUser();
  if (!actionId || !["not_started", "in_progress", "completed"].includes(status)) {
    throw new Error("Choose a valid development action status.");
  }
  const { data, error } = await client
    .from("development_plan_actions")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", actionId)
    .select("id, status, completed_at")
    .single();
  if (error) throw error;
  return data;
}

export async function loadNormalizationQueue() {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("get_normalization_queue");
  if (error) throw error;
  return data || [];
}

export async function saveNormalizationDecision(reviewId, decision) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("save_normalization_decision", {
    p_review_id: reviewId,
    p_status: decision.status,
    p_normalized_rating: decision.status === "approved" ? Number(decision.rating) : null,
    p_rationale: decision.rationale,
  });
  if (error) throw error;
  return firstRelation(data);
}

export async function loadVisibleProjects() {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client
    .from("projects")
    .select(`
      id,
      code,
      name,
      description,
      status,
      start_date,
      end_date,
      department:departments!projects_department_id_fkey(name),
      members:project_members(
        responsibility,
        user:profiles!project_members_user_id_fkey(id, employee_number, full_name, job_title)
      )
    `)
    .order("name");
  if (error) throw error;
  return (data || []).map((project) => ({
    ...project,
    departmentName: firstRelation(project.department)?.name || "Cross-functional",
    members: (project.members || []).map((membership) => ({
      responsibility: membership.responsibility || "Contributor",
      ...firstRelation(membership.user),
    })),
  }));
}

export async function loadWorkflowAudit(reviewId) {
  const client = requireSupabase();
  await requireCurrentUser();
  let query = client
    .from("workflow_audit_log")
    .select("id, actor_id, entity_type, entity_id, review_id, employee_id, action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (reviewId) query = query.eq("review_id", reviewId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
