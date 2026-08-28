import { supabase } from "../lib/supabase";

export const SELF_ASSESSMENT_QUESTIONS = [
  "What did I do last year?",
  "What are my achievements?",
  "What are the challenges I faced?",
  "What did I learn?",
  "What are my future goals?",
];

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

function serializeAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== SELF_ASSESSMENT_QUESTIONS.length) {
    throw new Error("All five self-assessment answers are required.");
  }

  const normalized = answers.map((answer) => String(answer ?? "").trim());
  if (normalized.some((answer) => !answer)) {
    throw new Error("Please answer every self-assessment question.");
  }

  return JSON.stringify({ version: 1, answers: normalized });
}

export function parseSelfAssessment(summary) {
  if (!summary) return Array(SELF_ASSESSMENT_QUESTIONS.length).fill("");

  try {
    const parsed = JSON.parse(summary);
    if (parsed?.version === 1 && Array.isArray(parsed.answers)) {
      return SELF_ASSESSMENT_QUESTIONS.map((_, index) => String(parsed.answers[index] ?? ""));
    }
  } catch {
    // Older free-text summaries remain readable in the first answer field.
  }

  return [summary, ...Array(SELF_ASSESSMENT_QUESTIONS.length - 1).fill("")];
}

const currentReviewSelect = `
  id,
  status,
  employee_summary,
  employee_submitted_at,
  supervisor_summary,
  supervisor_rating,
  supervisor_submitted_at,
  hr_comments,
  overall_rating,
  completed_at,
  due_date,
  cycle:review_cycles(id, name, status, start_date, end_date),
  employee:profiles!reviews_employee_id_fkey(id, employee_number, full_name),
  supervisor:profiles!reviews_supervisor_id_fkey(id, employee_number, full_name),
  hr_partner:profiles!reviews_hr_partner_id_fkey(id, employee_number, full_name)
`;

export async function loadCurrentReview({ role = "employee" } = {}) {
  const client = requireSupabase();
  const user = await requireCurrentUser();
  const roleColumn = {
    employee: "employee_id",
    supervisor: "supervisor_id",
    hr_partner: "hr_partner_id",
  }[role];

  if (!roleColumn) throw new Error(`Unsupported review role: ${role}`);

  const { data, error } = await client
    .from("reviews")
    .select(currentReviewSelect)
    .eq(roleColumn, user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const cycle = firstRelation(data.cycle);
  const employee = firstRelation(data.employee);
  const supervisor = firstRelation(data.supervisor);
  const hrPartner = firstRelation(data.hr_partner);

  return {
    id: data.id,
    status: data.status,
    dueDate: data.due_date,
    cycle: cycle
      ? {
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          startDate: cycle.start_date,
          endDate: cycle.end_date,
        }
      : null,
    employee: employee
      ? { id: employee.id, employeeNumber: employee.employee_number, name: employee.full_name }
      : null,
    supervisor: supervisor
      ? { id: supervisor.id, employeeNumber: supervisor.employee_number, name: supervisor.full_name }
      : null,
    hrPartner: hrPartner
      ? { id: hrPartner.id, employeeNumber: hrPartner.employee_number, name: hrPartner.full_name }
      : null,
    selfAssessment: parseSelfAssessment(data.employee_summary),
    employeeSubmittedAt: data.employee_submitted_at,
    supervisorSummary: data.supervisor_summary || "",
    supervisorRating: data.supervisor_rating,
    supervisorSubmittedAt: data.supervisor_submitted_at,
    hrComments: data.hr_comments || "",
    overallRating: data.overall_rating,
    completedAt: data.completed_at,
  };
}

export async function saveSelfAssessment(reviewId, answers, { submit = false } = {}) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.rpc("save_self_review", {
    p_review_id: reviewId,
    p_summary: serializeAnswers(answers),
    p_submit: submit,
  });
  if (error) throw error;
  return data;
}

export async function saveSupervisorReview(
  reviewId,
  { summary, rating, submit = false },
) {
  const client = requireSupabase();
  await requireCurrentUser();
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 0) {
    throw new Error("A valid non-negative rating is required.");
  }

  const { data, error } = await client.rpc("save_supervisor_review", {
    p_review_id: reviewId,
    p_summary: String(summary ?? "").trim(),
    p_rating: numericRating,
    p_submit: submit,
  });
  if (error) throw error;
  return data;
}

export async function completeHrReview(reviewId, { comments, overallRating = null }) {
  const client = requireSupabase();
  await requireCurrentUser();
  const rating = overallRating === null || overallRating === "" ? null : Number(overallRating);
  if (rating !== null && (!Number.isFinite(rating) || rating < 0)) {
    throw new Error("Overall rating must be a non-negative number.");
  }

  const { data, error } = await client.rpc("complete_hr_review", {
    p_review_id: reviewId,
    p_comments: String(comments ?? "").trim(),
    p_overall_rating: rating,
  });
  if (error) throw error;
  return data;
}
