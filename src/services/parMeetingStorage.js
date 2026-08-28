import {
  loadParMeeting as loadParMeetingFromSupabase,
  saveParMeeting as saveParMeetingToSupabase,
} from "./workflowService";

let parMeeting = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getParMeeting() {
  return parMeeting;
}

export async function refreshParMeeting(reviewId) {
  parMeeting = await loadParMeetingFromSupabase(reviewId);
  notify();
  return parMeeting;
}

export async function saveParMeeting(meeting, context) {
  parMeeting = await saveParMeetingToSupabase(meeting, context);
  notify();
  return parMeeting;
}

export function subscribeToParMeeting(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
