const STORAGE_KEY = "altriumPulse_assignedTimeGoals";
const EVENT_NAME = "assigned-time-goals-updated";

/* Temporary frontend persistence until HR Assign Goals is connected to Supabase. */

export function getAssignedTimeGoals() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAssignedTimeGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function addAssignedTimeGoal(goal) {
  const goals = getAssignedTimeGoals();
  saveAssignedTimeGoals([goal, ...goals]);
}

export function subscribeToAssignedTimeGoals(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}