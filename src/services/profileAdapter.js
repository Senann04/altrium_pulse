import { supabase } from "../lib/supabase";

const REVIEW_STAGE_ORDER = [
  { key: "self-assessment", label: "Self Assessment" },
  { key: "peer-review", label: "Peer Review" },
  { key: "supervisor-review", label: "Supervisor Review" },
  { key: "normalization", label: "Normalization" },
  { key: "par-meeting", label: "PAR Meeting" },
  { key: "pdp-pip", label: "PDP & PIP" },
];

const REVIEW_ACTIVE_STAGE = {
  not_started: 0,
  self_review: 0,
  peer_feedback: 1,
  supervisor_review: 2,
  hr_review: 3,
  reopened: 0,
};

const REVIEW_STATUS_LABELS = {
  not_started: "Not started",
  self_review: "Self assessment",
  peer_feedback: "Peer feedback",
  supervisor_review: "Supervisor review",
  hr_review: "HR review",
  completed: "Completed",
  reopened: "Reopened",
};

function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dashboardDate(value) {
  if (!value) return { day: "--", month: "TBD" };
  const date = new Date(`${value}T00:00:00`);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en", { month: "short" }).toUpperCase(),
  };
}

function reviewStages(status) {
  if (status === "completed") {
    return REVIEW_STAGE_ORDER.map((stage) => ({ ...stage, status: "Completed" }));
  }

  const activeIndex = REVIEW_ACTIVE_STAGE[status] ?? 0;
  return REVIEW_STAGE_ORDER.map((stage, index) => ({
    ...stage,
    status: index < activeIndex ? "Completed" : index === activeIndex ? "In progress" : "Pending",
  }));
}

function planStatus(row) {
  const today = new Date().toISOString().slice(0, 10);
  if (row.status === "completed") return "Completed";
  if (row.status === "cancelled") return "Cancelled";
  if (row.end_date && row.end_date < today) return "Overdue";
  if (row.status === "active") return "Ongoing";
  return "Pending";
}

function average(rows, field) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) / rows.length);
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function parseSelfAssessment(summary) {
  if (!summary) return Array(5).fill("");
  try {
    const parsed = JSON.parse(summary);
    if (parsed?.version === 1 && Array.isArray(parsed.answers)) {
      return Array.from({ length: 5 }, (_, index) => String(parsed.answers[index] ?? ""));
    }
  } catch {
    // Older free-text summaries remain visible as the first response.
  }
  return [summary, "", "", "", ""];
}

function makeTask(date, title, detail, page) {
  return { ...dashboardDate(date), date, title, detail, page };
}

function dashboardTasks(role, cycle, meeting) {
  if (!cycle) return [];

  if (role === "employee") {
    const tasks = [
      makeTask(cycle.self_review_due, "Self-assessment deadline", "Complete your assessment before the review moves forward", "feedback"),
      makeTask(cycle.feedback_due, "Feedback window closes", "Finish any outstanding peer feedback", "feedback"),
    ];
    if (meeting) {
      tasks.push(makeTask(meeting.scheduled_at.slice(0, 10), "PAR meeting", formatDateTime(meeting.scheduled_at), "current-review"));
    } else {
      tasks.push(makeTask(cycle.end_date, "Review cycle closes", "Check every stage before the cycle is completed", "current-review"));
    }
    return tasks;
  }

  if (role === "supervisor") {
    return [
      makeTask(cycle.self_review_due, "Team self-assessments due", "Check that every direct report has responded", "team"),
      makeTask(cycle.feedback_due, "Feedback window closes", "Complete outstanding team feedback", "feedback"),
      makeTask(cycle.supervisor_review_due, "Supervisor reviews due", "Submit your assessments for this cycle", "current-review"),
    ];
  }

  if (role === "hr_partner") {
    return [
      makeTask(cycle.self_review_due, "Self-review checkpoint", "Monitor participation across your assigned team", "review-cycle"),
      makeTask(cycle.feedback_due, "Feedback checkpoint", "Follow up on outstanding feedback", "review-cycle"),
      makeTask(cycle.end_date, "Review cycle closes", "Complete the remaining HR actions", "review-cycle"),
    ];
  }

  return [
    makeTask(cycle.feedback_due, "Feedback checkpoint", "Review organisation-wide participation", "dashboard"),
    makeTask(cycle.supervisor_review_due, "Management checkpoint", "Review performance completion and risks", "dashboard"),
    makeTask(cycle.end_date, "Review cycle closes", "Prepare the final performance view", "dashboard"),
  ];
}

function dashboardStats(role, { employees, reviews, allReviews, goals, plans, feedbackRequests, latestRating }) {
  const completedReviews = reviews.filter((review) => review.status === "completed").length;
  const startedReviews = reviews.filter((review) => review.status !== "not_started").length;
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const overduePlans = plans.filter((plan) => planStatus(plan) === "Overdue").length;
  const pendingFeedback = feedbackRequests.filter((request) => request.status === "pending").length;

  if (role === "employee") {
    const stages = reviews[0] ? reviewStages(reviews[0].status) : [];
    const completeStages = stages.filter((stage) => stage.status === "Completed").length;
    const activeStages = stages.filter((stage) => stage.status === "In progress").length;
    const reviewProgress = stages.length
      ? Math.round(((completeStages + activeStages * 0.5) / stages.length) * 100)
      : 0;
    return [
      { label: "Review progress", value: `${reviewProgress}%`, trend: `${completeStages}/${stages.length || 6} stages complete`, tone: "gold" },
      { label: "Goals completed", value: `${completedGoals}/${goals.length}`, trend: `${Math.max(0, goals.length - completedGoals)} remaining`, tone: "green" },
      { label: "Overall rating", value: latestRating ?? "–", trend: latestRating ? "Latest completed cycle" : "No completed rating", tone: "blue" },
    ];
  }

  if (role === "supervisor") {
    return [
      { label: "Team members", value: String(employees.length).padStart(2, "0"), trend: "Active direct reports", tone: "gold" },
      { label: "Reviews on track", value: `${percentage(startedReviews, reviews.length)}%`, trend: `${startedReviews}/${reviews.length} started`, tone: "green" },
      { label: "Feedback pending", value: String(pendingFeedback).padStart(2, "0"), trend: "Assigned to you", tone: "blue" },
    ];
  }

  if (role === "hr_partner") {
    return [
      { label: "Cycle completion", value: `${percentage(completedReviews, reviews.length)}%`, trend: `${completedReviews}/${reviews.length} completed`, tone: "gold" },
      { label: "Active reviews", value: String(reviews.length - completedReviews).padStart(2, "0"), trend: `${employees.length} assigned employees`, tone: "green" },
      { label: "Actions required", value: String(overduePlans + reviews.filter((review) => review.status === "not_started").length).padStart(2, "0"), trend: "Overdue or not started", tone: "blue" },
    ];
  }

  const ratedReviews = allReviews.filter((review) => review.status === "completed" && review.overall_rating !== null);
  return [
    { label: "Review completion", value: `${percentage(completedReviews, reviews.length)}%`, trend: `${completedReviews}/${reviews.length} completed`, tone: "gold" },
    { label: "Goal progress", value: `${average(goals, "progress")}%`, trend: `${goals.length} active records`, tone: "green" },
    { label: "Average rating", value: ratedReviews.length ? (ratedReviews.reduce((sum, review) => sum + Number(review.overall_rating), 0) / ratedReviews.length).toFixed(1) : "–", trend: "Completed cycles", tone: "blue" },
  ];
}

export async function loadProfileView(userId) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, employee_number, full_name, email, role, job_title, department_id, manager_id, hr_partner_id")
    .eq("id", userId)
    .single();
  if (profileError) throw profileError;

  const [departmentResult, directoryResult, cyclesResult, reviewsResult, goalsResult, plansResult, notificationsResult, feedbackRequestsResult, feedbackResult, meetingsResult] = await Promise.all([
    profile.department_id
      ? supabase.from("departments").select("id, name").eq("id", profile.department_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("profiles").select("id, employee_number, full_name, email, role, job_title, department_id, manager_id, hr_partner_id").eq("is_active", true).order("full_name"),
    supabase.from("review_cycles").select("id, name, start_date, end_date, self_review_due, feedback_due, supervisor_review_due, status").order("start_date", { ascending: false }),
    supabase.from("reviews").select("id, cycle_id, employee_id, supervisor_id, hr_partner_id, status, employee_summary, employee_submitted_at, supervisor_summary, supervisor_rating, supervisor_submitted_at, hr_comments, overall_rating, completed_at, due_date").order("created_at", { ascending: false }),
    supabase.from("goals").select("id, review_id, employee_id, title, description, target_date, status, progress, period").order("created_at", { ascending: false }),
    supabase.from("development_plans").select("id, review_id, employee_id, type, title, reason, start_date, end_date, status, progress").order("created_at", { ascending: false }),
    supabase.from("notifications").select("id, type, title, message, read_at, created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("feedback_requests").select("id, review_id, reviewer_id, status, due_date").order("created_at", { ascending: false }),
    supabase.from("review_feedback").select("id, review_id, subject_id, strengths, improvements, comments, rating, submitted_at").eq("subject_id", userId).order("submitted_at", { ascending: false }),
    supabase.from("par_meetings").select("id, review_id, employee_id, scheduled_at, status").order("scheduled_at", { ascending: true }),
  ]);

  const results = [departmentResult, directoryResult, cyclesResult, reviewsResult, goalsResult, plansResult, notificationsResult, feedbackRequestsResult, feedbackResult, meetingsResult];
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  const directory = directoryResult.data || [];
  const people = new Map(directory.map((person) => [person.id, person]));
  const cycles = cyclesResult.data || [];
  const activeCycle = cycles.find((cycle) => cycle.status === "active") || null;
  const visibleReviews = reviewsResult.data || [];
  const currentReview = activeCycle
    ? visibleReviews.find((review) => review.cycle_id === activeCycle.id && review.employee_id === userId) || null
    : null;
  const currentMeeting = currentReview
    ? (meetingsResult.data || []).find((meeting) => meeting.review_id === currentReview.id) || null
    : null;

  const scopedEmployees = directory.filter((person) => {
    if (person.role !== "employee") return false;
    if (profile.role === "employee") return person.id === userId;
    if (profile.role === "supervisor") return person.manager_id === userId;
    if (profile.role === "hr_partner") return person.hr_partner_id === userId;
    return profile.role === "senior_management";
  });
  const scopedIds = new Set(scopedEmployees.map((employee) => employee.id));
  const scopedReviews = visibleReviews.filter((review) => (!activeCycle || review.cycle_id === activeCycle.id) && scopedIds.has(review.employee_id));
  const allScopedReviews = visibleReviews.filter((review) => scopedIds.has(review.employee_id));
  const scopedGoals = (goalsResult.data || []).filter((goal) => scopedIds.has(goal.employee_id));
  const scopedPlans = (plansResult.data || []).filter((plan) => scopedIds.has(plan.employee_id));

  const ownGoals = (goalsResult.data || [])
    .filter((goal) => goal.employee_id === userId)
    .map((goal) => ({
      id: goal.id,
      period: goal.period ? `${goal.period[0].toUpperCase()}${goal.period.slice(1)}` : "Other",
      goal: goal.title,
      description: goal.description || "",
      status: goal.status === "completed" ? "Completed" : goal.status === "blocked" ? "Blocked" : "Ongoing",
      progress: goal.progress ?? 0,
      targetDate: goal.target_date,
    }));
  const ownPlans = (plansResult.data || [])
    .filter((plan) => plan.employee_id === userId)
    .map((plan) => ({
      id: plan.id,
      type: plan.type.toUpperCase(),
      title: plan.title,
      status: planStatus(plan),
      start_date: formatDate(plan.start_date),
      target_date: formatDate(plan.end_date),
      targetDateValue: plan.end_date,
      progress: plan.progress ?? 0,
    }));

  const completedReviews = visibleReviews
    .filter((review) => review.employee_id === userId && review.status === "completed")
    .map((review) => {
      const cycle = cycles.find((item) => item.id === review.cycle_id);
      return {
        id: review.id,
        cycleName: cycle?.name || "Completed review",
        startDate: formatDate(cycle?.start_date),
        endDate: formatDate(cycle?.end_date),
        completedAt: formatDate(review.completed_at?.slice(0, 10)),
        rating: review.overall_rating === null ? null : Number(review.overall_rating).toFixed(1),
      };
    });
  const latestCompletedReview = visibleReviews.find((review) => review.employee_id === userId && review.status === "completed");
  const latestFeedback = (feedbackResult.data || [])[0];

  const meeting = currentMeeting
    ? {
        id: currentMeeting.id,
        date: formatDateTime(currentMeeting.scheduled_at).split(",")[0],
        time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(currentMeeting.scheduled_at)),
        status: currentMeeting.status === "scheduled" ? "Scheduled" : currentMeeting.status,
        scheduledAt: currentMeeting.scheduled_at,
      }
    : null;

  const cycleEvents = activeCycle
    ? [
        { id: "self-review-due", date: activeCycle.self_review_due, title: "Self-assessment due", type: "Review" },
        { id: "feedback-due", date: activeCycle.feedback_due, title: "Feedback window closes", type: "Feedback" },
        { id: "supervisor-review-due", date: activeCycle.supervisor_review_due, title: "Supervisor review due", type: "Review" },
        { id: "cycle-end", date: activeCycle.end_date, title: "Review cycle closes", type: "Cycle" },
      ].filter((event) => event.date)
    : [];
  const planEvents = ownPlans
    .filter((plan) => plan.targetDateValue && plan.status !== "Completed")
    .map((plan) => ({ id: `plan-${plan.id}`, date: plan.targetDateValue, title: plan.title, type: plan.type }));
  const meetingEvents = meeting
    ? [{ id: `meeting-${meeting.id}`, date: meeting.scheduledAt.slice(0, 10), title: "PAR meeting", type: "Meeting", time: meeting.time }]
    : [];
  const calendarEvents = [...cycleEvents, ...planEvents, ...meetingEvents].sort((left, right) => left.date.localeCompare(right.date));

  const stages = currentReview ? reviewStages(currentReview.status) : REVIEW_STAGE_ORDER.map((stage) => ({ ...stage, status: "Pending" }));
  const latestRating = latestCompletedReview?.overall_rating === null || latestCompletedReview?.overall_rating === undefined
    ? null
    : Number(latestCompletedReview.overall_rating).toFixed(1);
  const tasks = dashboardTasks(profile.role, activeCycle, currentMeeting).sort((left, right) => (left.date || "9999").localeCompare(right.date || "9999"));

  return {
    role: profile.role,
    data: {
      id: profile.id,
      identifier: profile.employee_number || profile.email || "",
      department: departmentResult.data?.name || "Unassigned team",
      parCycle: activeCycle?.name || "No active review cycle",
      name: profile.full_name || "",
      workEmail: profile.email || "",
      immediateSupervisor: people.get(profile.manager_id)?.full_name || "Not assigned",
      hrBusinessPartner: people.get(profile.hr_partner_id)?.full_name || "Not assigned",
      jobTitle: profile.job_title || "Not assigned",
      teammates: directory
        .filter((person) => person.role === "employee" && person.department_id === profile.department_id && person.id !== userId)
        .map((person) => ({ id: person.id, employeeNumber: person.employee_number || person.id, name: person.full_name, jobTitle: person.job_title || "Employee" })),
      goals: ownGoals,
      developmentPlans: ownPlans,
      notifications: (notificationsResult.data || []).map((notification) => ({ ...notification, createdLabel: formatDateTime(notification.created_at) })),
      currentReview: currentReview
        ? {
            id: currentReview.id,
            cycleName: activeCycle?.name || "Current review",
            status: REVIEW_STATUS_LABELS[currentReview.status] || currentReview.status,
            stages,
            selfAssessment: parseSelfAssessment(currentReview.employee_summary),
            employeeSubmittedAt: currentReview.employee_submitted_at,
          }
        : null,
      meeting,
      completedReviews,
      calendarEvents,
      feedback: {
        overallRating: latestFeedback?.rating ?? latestRating,
        categoryRatings: [],
        strengths: latestFeedback?.strengths || latestCompletedReview?.supervisor_summary || "",
        improvements: latestFeedback?.improvements || latestCompletedReview?.hr_comments || "",
      },
      dashboard: {
        stats: dashboardStats(profile.role, {
          employees: scopedEmployees,
          reviews: scopedReviews,
          allReviews: allScopedReviews,
          goals: scopedGoals,
          plans: scopedPlans,
          feedbackRequests: feedbackRequestsResult.data || [],
          latestRating,
        }),
        tasks,
        planProgress: {
          pdp: average(scopedPlans.filter((plan) => plan.type === "pdp"), "progress"),
          pip: average(scopedPlans.filter((plan) => plan.type === "pip"), "progress"),
        },
        cycleStatus: activeCycle ? "Cycle active" : "No active cycle",
        nextReviewLabel: activeCycle ? `Cycle closes ${formatDate(activeCycle.end_date)}` : "No deadline scheduled",
      },
    },
  };
}
