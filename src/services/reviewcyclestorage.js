const STORAGE_KEY = "altriumPulse_reviewCycles";
const EVENT_NAME = "review-cycles-updated";

/* temporary frontend persistence until Supabase is connected */

export function getReviewCycles() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveReviewCycles(cycles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cycles));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToReviewCycles(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}