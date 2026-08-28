const STORAGE_KEY = "altriumPulse_parMeeting";
const EVENT_NAME = "par-meeting-updated";

/* Temporary frontend persistence until PAR meetings are connected to Supabase. */

export function getParMeeting() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveParMeeting(meeting) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meeting));
  /* notifies listeners in the SAME tab; localStorage's own "storage"
     event only fires in other tabs */
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToParMeeting(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}