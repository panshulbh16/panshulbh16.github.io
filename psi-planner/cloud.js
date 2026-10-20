/* PSI Planning Grid cloud sync.
   Supabase email/password, magic-link and optional Google sign-in, plus one private workspace row per user
   (table public.psi_workspaces, protected by row-level security). Without config this file only shows demo mode. */
(function () {
  'use strict';

  if (window.top !== window.self) {
    document.documentElement.hidden = true;
    try { window.top.location.replace(window.self.location.href); } catch (e) { /* cross-origin frame: stay hidden */ }
    return;
  }

  const cfg = window.PSI_CONFIG || {};
  const MAX_BYTES = 900000;
  const URL_OK = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(String(cfg.supabaseUrl || ''));
  const enabled = !!(URL_OK && cfg.supabaseAnonKey && window.supabase && typeof window.supabase.createClient === 'function');

  const api = { enabled, user: null, init, schedule, flush };
  window.PSICloud = api;

  let sb = null, hooks = null, timer = null, lastUpdated = null, saving = false, pending = false, loaded = false;
  let status = { kind: 'demo', text: '' };
  const $ = id => document.getElementById(id);
  const here = () => location.origin + location.pathname;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function init(h) {
    hooks = h;
    render();
    if (!enabled) return;
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    sb.auth.onAuthStateChange((event, session) => { setTimeout(() => onAuth(event, session), 0); });
    bindDialog();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', flush);
  }

  async function onAuth(event, session) {
    const u = session && session.user ? session.user : null;
    const changed = (u ? u.id : null) !== (api.user ? api.user.id : null);
    api.user = u;
    if (event === 'PASSWORD_RECOVERY') openDialog('reset');
    if (!u) {
      clearTimeout(timer); timer = null;
      if (changed) { lastUpdated = null; loaded = false; hooks.signedOut(); }
      setStatus('demo');
    } else if (changed) {
      loaded = false;
      closeDialog();
      await pull();
    }
    cleanUrl();
    render();
  }

  function valid(d) {
    return d && typeof d === 'object' && Array.isArray(d.items) && d.items.length > 0 && d.items.length <= 500;
  }

  async function pull() {
    setStatus('loading');
    const { data, error } = await sb.from('psi_workspaces').select('data,updated_at').eq('user_id', api.user.id).maybeSingle();
    if (error) { setStatus('error', 'Could not load your plans. ' + friendly(error)); return; }
    loaded = true;
    if (data && valid(data.data)) {
      lastUpdated = data.updated_at;
      hooks.setState(data.data);
      setStatus('saved');
      hooks.toast('Loaded your saved plans');
    } else {
      lastUpdated = null;
      await push(true);
      if (status.kind === 'saved') hooks.toast('Saved your current plans to your account');
    }
  }

  async function push(force) {
    if (!api.user || !loaded) return;
    if (saving) { pending = true; return; }
    clearTimeout(timer); timer = null;
    const state = hooks.getState();
    const bytes = new Blob([JSON.stringify(state)]).size;
    if (bytes > MAX_BYTES) { setStatus('error', 'Not saved: the plan is over 900 KB. Remove items or periods.'); return; }
    saving = true; setStatus('saving');
    try {
      let res;
      if (lastUpdated && !force) {
        res = await sb.from('psi_workspaces').update({ data: state }).eq('user_id', api.user.id).eq('updated_at', lastUpdated).select('updated_at');
        if (!res.error && res.data.length === 0) { saving = false; pending = false; conflict(); return; }
      } else {
        res = await sb.from('psi_workspaces').upsert({ user_id: api.user.id, data: state }).select('updated_at');
      }
      if (res.error) throw res.error;
      lastUpdated = res.data[0].updated_at;
      setStatus('saved');
    } catch (e) {
      setStatus('error', 'Not saved. ' + friendly(e));
    }
    saving = false;
    if (pending) { pending = false; push(); }
  }

  function schedule() {
    if (!api.user || !loaded) return;
    clearTimeout(timer);
    setStatus('pending');
    timer = setTimeout(() => push(), 1200);
  }
  function flush() { return timer ? push() : Promise.resolve(); }

  function conflict() {
    setStatus('conflict', 'These plans were changed on another device.');
  }

  function friendly(e) {
    const m = String((e && (e.message || e.error_description)) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'Email or password is wrong.';
    if (/Email not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.';
    if (/User already registered/i.test(m)) return 'An account with this email exists. Sign in instead.';
    if (/Password should be at least/i.test(m)) return 'Use a password of at least 8 characters.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'No connection. Check your internet and try again.';
    return m || 'Something went wrong. Try again.';
  }

  function cleanUrl() {
    const u = new URL(location.href);
    let dirty = false;
    for (const k of ['code', 'type', 'error', 'error_code', 'error_description']) if (u.searchParams.has(k)) { u.searchParams.delete(k); dirty = true; }
    if (/access_token|refresh_token|error_description/.test(u.hash)) { u.hash = ''; dirty = true; }
    if (dirty) history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  function setStatus(kind, text) { status = { kind, text: text || '' }; render(); }

  /* ---------- header + banner ---------- */
  function render() {
    const box = $('account'), bar = $('demoBar');
    if (!box || !bar) return;
    if (!enabled) {
      box.innerHTML = '<span class="acct-chip">Demo mode</span>';
      bar.hidden = false;
      bar.innerHTML = '<b>Demo mode.</b> Your data stays in this browser only.';
      return;
    }
    if (!api.user) {
      box.innerHTML = '<button class="btn" type="button" id="signInBtn">Sign in</button>';
      $('signInBtn').addEventListener('click', () => openDialog('signin'));
      bar.hidden = false;
      bar.innerHTML = '<b>Demo mode.</b> Your data stays in this browser only. <button type="button" class="linkish" id="signInLink">Sign in</button> to save plans to your account and open them on any device.';
      $('signInLink').addEventListener('click', () => openDialog('signin'));
      return;
    }
    const label = { loading: 'Loading…', pending: 'Unsaved changes', saving: 'Saving…', saved: 'Saved', error: 'Not saved', conflict: 'Conflict' }[status.kind] || '';
    box.innerHTML = `<span class="acct-status st-${esc(status.kind)}" title="${esc(status.text)}">${esc(label)}</span>`
      + `<span class="acct-email" title="${esc(api.user.email)}">${esc(api.user.email)}</span>`
      + '<button class="btn" type="button" id="signOutBtn">Sign out</button>';
    $('signOutBtn').addEventListener('click', signOut);
    if (status.kind === 'error' || status.kind === 'conflict') {
      bar.hidden = false;
      bar.className = 'demo-bar warn';
      bar.innerHTML = `<b>${esc(status.text)}</b> `
        + (status.kind === 'conflict'
          ? '<button type="button" class="linkish" id="cfLoad">Load the latest version</button> or <button type="button" class="linkish" id="cfKeep">keep mine and overwrite it</button>.'
          : '<button type="button" class="linkish" id="retrySave">Try again</button>');
      if ($('cfLoad')) $('cfLoad').addEventListener('click', () => pull());
      if ($('cfKeep')) $('cfKeep').addEventListener('click', () => push(true));
      if ($('retrySave')) $('retrySave').addEventListener('click', () => push());
    } else {
      bar.hidden = true;
      bar.className = 'demo-bar';
    }
  }

  async function signOut() {
    await flush();
    const { error } = await sb.auth.signOut();
    if (error) hooks.toast(friendly(error));
  }

  /* ---------- sign-in dialog ---------- */
  function bindDialog() {
    const dlg = $('authDlg');
    if (!dlg) return;
    $('authGoogle').hidden = !cfg.googleSignIn;
    $('authOr').hidden = !cfg.googleSignIn;
    $('authClose').addEventListener('click', closeDialog);
    dlg.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
    $('authForm').addEventListener('submit', e => { e.preventDefault(); run('signin'); });
    $('authSignUp').addEventListener('click', () => run('signup'));
    $('authMagic').addEventListener('click', () => run('magic'));
    $('authForgot').addEventListener('click', () => run('forgot'));
    $('authGoogle').addEventListener('click', () => run('google'));
    $('resetForm').addEventListener('submit', e => { e.preventDefault(); run('reset'); });
  }

  function openDialog(view) {
    const dlg = $('authDlg');
    if (!dlg) return;
    $('authForm').hidden = view !== 'signin';
    $('resetForm').hidden = view !== 'reset';
    $('authTitle').textContent = view === 'reset' ? 'Set a new password' : 'Sign in to save your plans';
    msg('');
    if (!dlg.open) dlg.showModal();
    (view === 'reset' ? $('resetPw') : $('authEmail')).focus();
  }
  function closeDialog() { const d = $('authDlg'); if (d && d.open) d.close(); }
  function msg(text, ok) { const m = $('authMsg'); m.textContent = text; m.className = 'auth-msg' + (ok ? ' ok' : text ? ' err' : ''); }
  function busy(on) { $('authDlg').querySelectorAll('button,input').forEach(el => { if (el.id !== 'authClose') el.disabled = on; }); }

  async function run(action) {
    const email = $('authEmail').value.trim(), pw = $('authPw').value;
    const needEmail = ['signin', 'signup', 'magic', 'forgot'].includes(action);
    if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg('Enter a valid email address.'); $('authEmail').focus(); return; }
    if ((action === 'signin' || action === 'signup') && pw.length < 8) { msg('Enter a password of at least 8 characters.'); $('authPw').focus(); return; }
    busy(true); msg('');
    try {
      let r;
      if (action === 'signin') r = await sb.auth.signInWithPassword({ email, password: pw });
      else if (action === 'signup') {
        r = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: here() } });
        if (!r.error && !r.data.session) msg('Check your inbox and click the confirmation link to finish creating your account.', true);
      } else if (action === 'magic') {
        r = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: here(), shouldCreateUser: true } });
        if (!r.error) msg('Sign-in link sent. Open it on this device.', true);
      } else if (action === 'forgot') {
        r = await sb.auth.resetPasswordForEmail(email, { redirectTo: here() });
        if (!r.error) msg('If an account exists for this email, a reset link is on its way.', true);
      } else if (action === 'google') {
        r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } });
      } else if (action === 'reset') {
        const a = $('resetPw').value, b = $('resetPw2').value;
        if (a.length < 8) { msg('Use at least 8 characters.'); busy(false); return; }
        if (a !== b) { msg('The two passwords don’t match.'); busy(false); return; }
        r = await sb.auth.updateUser({ password: a });
        if (!r.error) { closeDialog(); hooks.toast('Password updated'); }
      }
      if (r && r.error) msg(friendly(r.error));
      if (action === 'signin' && r && !r.error) { $('authPw').value = ''; }
    } catch (e) {
      msg(friendly(e));
    }
    busy(false);
  }
})();
