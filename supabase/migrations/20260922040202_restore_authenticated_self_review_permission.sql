-- The public wrapper runs with security invoker and calls this private helper
-- as the authenticated user. Keep anonymous access blocked.
revoke all on function private.save_self_review(uuid, text, boolean) from anon;
grant execute on function private.save_self_review(uuid, text, boolean) to authenticated;
