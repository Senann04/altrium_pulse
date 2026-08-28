import { supabase } from "../lib/supabase";

const BUCKET = "goal-evidence";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function safeFileName(name) {
  return String(name || "file")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";
}

function validateFile(file) {
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) throw new Error("Each evidence file must be 10 MB or smaller.");
}

async function uploadOne({ planId, actionId = null, kind, file, userId }) {
  const client = requireSupabase();
  validateFile(file);
  const objectPath = `${planId}/${userId}/${kind}-${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await client.storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error: metadataError } = await client
    .from("development_plan_evidence")
    .insert({
      plan_id: planId,
      action_id: actionId,
      uploaded_by: userId,
      kind,
      bucket_id: BUCKET,
      object_path: objectPath,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id, plan_id, action_id, uploaded_by, kind, bucket_id, object_path, file_name, mime_type, size_bytes, created_at")
    .single();

  if (metadataError) {
    await client.storage.from(BUCKET).remove([objectPath]);
    throw metadataError;
  }

  return data;
}

export async function submitGoalEvidence({
  planId,
  actionId = null,
  actionItemFile = null,
  evidenceFile = null,
}) {
  if (!planId) throw new Error("A development plan is required.");
  if (!actionItemFile && !evidenceFile) throw new Error("Choose at least one file to upload.");

  const client = requireSupabase();
  const user = await requireCurrentUser();
  const uploaded = [];

  try {
    if (actionItemFile) {
      uploaded.push(
        await uploadOne({ planId, actionId, kind: "action_item", file: actionItemFile, userId: user.id }),
      );
    }
    if (evidenceFile) {
      uploaded.push(
        await uploadOne({ planId, actionId, kind: "evidence", file: evidenceFile, userId: user.id }),
      );
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) {
      await client.from("development_plan_evidence").delete().in(
        "id",
        uploaded.map((record) => record.id),
      );
      await client.storage.from(BUCKET).remove(uploaded.map((record) => record.object_path));
    }
    throw error;
  }
}

export async function listGoalEvidence(planId) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client
    .from("development_plan_evidence")
    .select("id, plan_id, action_id, uploaded_by, kind, bucket_id, object_path, file_name, mime_type, size_bytes, created_at")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createGoalEvidenceDownloadUrl(objectPath, expiresIn = 300) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(objectPath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteGoalEvidence(record) {
  const client = requireSupabase();
  await requireCurrentUser();
  const { error: storageError } = await client.storage.from(BUCKET).remove([record.object_path]);
  if (storageError) throw storageError;

  const { error: metadataError } = await client
    .from("development_plan_evidence")
    .delete()
    .eq("id", record.id);
  if (metadataError) throw metadataError;
}
