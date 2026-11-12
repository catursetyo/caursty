import { isSupabaseConfigured, isTurnstileConfigured, supabase } from './supabase';
import { nestEntries } from './guestbook';

export { isSupabaseConfigured, isTurnstileConfigured };

export async function fetchGuestbook() {
  if (!supabase) throw new Error('Guestbook backend is unavailable.');

  const [{ data: rows, error }, owner] = await Promise.all([
    supabase.rpc('get_guestbook_entries'),
    getOwnerAccess().catch(() => ({ isOwner: false, session: null })),
  ]);

  if (error) throw error;
  return {
    messages: nestEntries(rows ?? []),
    isOwner: owner.isOwner,
    hasSession: Boolean(owner.session),
  };
}

export async function submitGuestbookMessage(entry, captchaToken) {
  await ensureGuestbookSession(captchaToken);
  const { error } = await supabase.rpc('submit_guestbook_message', {
    p_author_name: entry.name,
    p_body: entry.message,
  });
  if (error) throw error;
}

export async function submitOwnerReply(entryId, body) {
  const { error } = await supabase.rpc('reply_to_guestbook', {
    p_body: body,
    p_parent_id: entryId,
  });
  if (error) throw error;
}

export async function toggleRemoteLike(entryId, captchaToken) {
  await ensureGuestbookSession(captchaToken);
  const { error } = await supabase.rpc('toggle_guestbook_like', { p_entry_id: entryId });
  if (error) throw error;
}

export async function moderateGuestbookEntry(entryId, action) {
  const { error } = await supabase.rpc('moderate_guestbook_entry', {
    p_action: action,
    p_entry_id: entryId,
  });
  if (error) throw error;
}

export async function requestOwnerMagicLink(email, captchaToken) {
  if (!supabase) throw new Error('Owner access is unavailable.');
  if (!captchaToken) throw captchaRequiredError();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      captchaToken,
      emailRedirectTo: `${window.location.origin}/owner/login`,
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function getOwnerAccess() {
  if (!supabase) return { isOwner: false, session: null };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session || session.user.is_anonymous) return { isOwner: false, session };

  const { data: isOwner, error } = await supabase.rpc('is_guestbook_owner');
  if (error) throw error;
  return { isOwner: Boolean(isOwner), session };
}

export async function signOutOwner() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export function onOwnerAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => callback());
  return () => data.subscription.unsubscribe();
}

async function ensureGuestbookSession(captchaToken) {
  if (!supabase) throw new Error('Guestbook backend is unavailable.');

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session;
  if (!captchaToken) throw captchaRequiredError();

  const { data: anonymous, error: anonymousError } = await supabase.auth.signInAnonymously({
    options: { captchaToken },
  });
  if (anonymousError) throw anonymousError;
  return anonymous.session;
}

function captchaRequiredError() {
  const error = new Error('Complete the spam verification before continuing.');
  error.code = 'captcha_required';
  return error;
}
