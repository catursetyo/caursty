revoke all on function public.get_guestbook_entries() from public, anon, authenticated;
grant execute on function public.get_guestbook_entries() to anon, authenticated;

revoke all on function public.is_guestbook_owner() from public, anon, authenticated;
grant execute on function public.is_guestbook_owner() to authenticated;

revoke all on function public.submit_guestbook_message(text, text) from public, anon, authenticated;
grant execute on function public.submit_guestbook_message(text, text) to authenticated;

revoke all on function public.reply_to_guestbook(uuid, text) from public, anon, authenticated;
grant execute on function public.reply_to_guestbook(uuid, text) to authenticated;

revoke all on function public.toggle_guestbook_like(uuid) from public, anon, authenticated;
grant execute on function public.toggle_guestbook_like(uuid) to authenticated;

revoke all on function public.moderate_guestbook_entry(uuid, text) from public, anon, authenticated;
grant execute on function public.moderate_guestbook_entry(uuid, text) to authenticated;
