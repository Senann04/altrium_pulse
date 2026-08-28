import {
  createReviewCycle,
  deleteReviewCycle,
  loadReviewCycles,
} from "./workflowService";

let reviewCycles = [];
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getReviewCycles() {
  return reviewCycles;
}

export async function refreshReviewCycles() {
  reviewCycles = await loadReviewCycles();
  notify();
  return reviewCycles;
}

export async function addReviewCycle(cycle) {
  const saved = await createReviewCycle(cycle);
  reviewCycles = [saved, ...reviewCycles];
  notify();
  return saved;
}

export async function removeReviewCycle(cycleId) {
  await deleteReviewCycle(cycleId);
  reviewCycles = reviewCycles.filter((cycle) => cycle.id !== cycleId);
  notify();
}

export function subscribeToReviewCycles(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
