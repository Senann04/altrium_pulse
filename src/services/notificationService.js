import { supabase } from "../lib/supabase";

export async function markNotificationsRead(notificationIds) {
  if (!supabase || !notificationIds.length) return;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Authentication required.");
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", auth.user.id)
    .in("id", notificationIds);
  if (error) throw error;
}
