// Sign-in and cloud sync for the PSI planner (psi-planner/cloud.js), against a mocked Supabase project.
// config.js is replaced per test; GoTrue (/auth/v1) and PostgREST (/rest/v1) are faked with page.route.
import { test, expect } from './fixtures.mjs';

const PAGE = '/psi-planner/';
const KEY = 'psi-grid-v2';
const SB = 'https://testproj.supabase.co';
const SB_KEY = 'sb-testproj-auth-token';
const UID = '6b1f8a52-1d3c-4c0e-9a51-7f0f2f9d1e01';
const EMAIL = 'planner@example.com';
const PASSWORD = 'correct-horse';
const TOKEN = 'test-access-token';

const session = (email = EMAIL) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: TOKEN, refresh_token: 'test-refresh-token', expires_in: 3600, expires_at: now + 3600, token_type: 'bearer',
    user: { id: UID, email, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-10-01T00:00:00Z' },
  };
};
const cloudItem = code => ({
  code, desc: 'Cloud item', uom: 'EA', boh: 50, p: { autoPlan: false },
  wk: { start: '2026-10-19', n: 12, fc: Array(12).fill(10), so: Array(12).fill(0), firm: Array(12).fill(0), ss: Array(12).fill(0), cap: Array(12).fill(0) },
  mo: { start: '2026-10', n: 12, fc: Array(12).fill(40), so: Array(12).fill(0), firm: Array(12).fill(0), ss: Array(12).fill(0), cap: Array(12).fill(0) },
});
const cloudState = (...codes) => ({ view: 'weekly', active: 0, items: codes.map(cloudItem) });

let tick = 0;
const stamp = () => new Date(Date.UTC(2026, 9, 20, 9, 0, 0) + ++tick * 1000).toISOString().replace('Z', '+00:00');

// Fake Supabase. `m.row` is the user's psi_workspaces row (or null). Every request is logged in `m.log`.
async function mockSupabase(page, opts = {}) {
  const m = { row: opts.row ?? null, log: [], email: opts.email ?? EMAIL, patchDelay: 0, failSave: null, ...opts };
  await page.route('**/psi-planner/config.js', r => r.fulfill({
    contentType: 'text/javascript',
    body: `window.PSI_CONFIG=Object.freeze({supabaseUrl:'${SB}',supabaseAnonKey:'test-anon-key',googleSignIn:true});`,
  }));
  await page.route(`${SB}/**`, async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method();
    const cors = {
      'access-control-allow-origin': req.headers().origin || '*',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': req.headers()['access-control-request-headers'] || '*',
      'access-control-expose-headers': 'content-range',
    };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    let body = null;
    try { body = req.postDataJSON(); } catch { body = req.postData(); }
    const entry = { method, path: url.pathname, params: Object.fromEntries(url.searchParams), headers: req.headers(), body };
    m.log.push(entry);
    const json = (status, data, extra = {}) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json', ...extra }, body: JSON.stringify(data) });

    if (url.pathname === '/auth/v1/token') {
      if (url.searchParams.get('grant_type') === 'password') {
        if (body.password !== PASSWORD) return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        return json(200, session(m.email));
      }
      if (url.searchParams.get('grant_type') === 'pkce') return json(200, session(m.email));
      if (url.searchParams.get('grant_type') === 'refresh_token') return json(200, session(m.email));
    }
    if (url.pathname === '/auth/v1/signup') return json(200, { id: UID, email: body.email, aud: 'authenticated', role: '', confirmation_sent_at: '2026-10-20T09:00:00Z', identities: [{}] });
    if (url.pathname === '/auth/v1/otp') return json(200, {});
    if (url.pathname === '/auth/v1/recover') return json(200, {});
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === '/auth/v1/user') return json(200, session(m.email).user);
    if (url.pathname === '/auth/v1/authorize') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Google</title>' });

    if (url.pathname === '/rest/v1/psi_workspaces') {
      const uidOk = (url.searchParams.get('user_id') ?? `eq.${body?.user_id}`) === `eq.${UID}`;
      if (method === 'GET') return json(200, m.row && uidOk ? [{ data: m.row.data, updated_at: m.row.updated_at }] : []);
      if (m.failSave) return json(m.failSave.status, m.failSave.body);
      if (method === 'PATCH') {
        if (m.patchDelay) await new Promise(r => setTimeout(r, m.patchDelay));
        if (!m.row || !uidOk || url.searchParams.get('updated_at') !== `eq.${m.row.updated_at}`) return json(200, []);
        m.row = { data: body.data, updated_at: stamp() };
        return json(200, [{ updated_at: m.row.updated_at }]);
      }
      if (method === 'POST') {
        m.row = { data: body.data, updated_at: stamp() };
        return json(201, [{ updated_at: m.row.updated_at }]);
      }
    }
    return json(404, { message: `unmocked ${method} ${url.pathname}` });
  });
  m.saves = () => m.log.filter(e => e.path === '/rest/v1/psi_workspaces' && e.method !== 'GET');
  return m;
}

// Fresh storage once per test (reloads keep it); optional pre-seeded storage; CSP violation recorder.
async function boot(page, seed = {}) {
  await page.addInitScript(seed => {
    if (!sessionStorage.getItem('psi-test-cleared')) {
      localStorage.clear();
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
      sessionStorage.setItem('psi-test-cleared', '1');
    }
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  }, seed);
}
test.afterEach(async ({ page }) => {
  if (page.isClosed()) return;
  expect(await page.evaluate(() => window.__csp || []), 'CSP violations').toEqual([]);
});

// For tests where the mock returns an HTTP error on purpose: the browser logs "Failed to load resource" for it.
// Allow exactly those console errors and still fail on anything else.
function allowHttpErrors(page, statuses) {
  return allowConsole(page, new RegExp(`Failed to load resource: the server responded with a status of (${statuses.join('|')})`), `expected HTTP ${statuses.join('/')} from mocked Supabase`);
}
function allowConsole(page, re, why) {
  test.info().annotations.push({ type: 'allow-console-errors', description: why });
  const other = [];
  page.on('pageerror', e => other.push(`pageerror: ${e.message}`));
  page.on('console', msg => { if (msg.type() === 'error' && !re.test(msg.text())) other.push(`console: ${msg.text()}`); });
  return () => expect(other, 'unexpected browser errors').toEqual([]);
}

const status = page => page.locator('#account .acct-status');
const tabCodes = page => page.locator('#tabs [data-tab] .code').allInnerTexts();
const demoKey = page => page.evaluate(k => localStorage.getItem(k), KEY);

async function open(page) {
  await page.goto(PAGE);
  await expect(page.locator('#psi tbody tr').first()).toBeVisible();
}
async function signIn(page, password = PASSWORD) {
  await page.locator('#signInBtn').click();
  await expect(page.locator('#authDlg')).toBeVisible();
  await page.locator('#authEmail').fill(EMAIL);
  await page.locator('#authPw').fill(password);
  await page.locator('#authSignIn').click();
}

test('demo mode when config is empty: chip, banner, no sign-in', async ({ page }) => {
  await boot(page);
  await open(page);
  await expect(page.locator('#account')).toHaveText('Demo mode');
  await expect(page.locator('#account .acct-chip')).toBeVisible();
  await expect(page.locator('#signInBtn')).toHaveCount(0);
  await expect(page.locator('#demoBar')).toBeVisible();
  await expect(page.locator('#demoBar')).toHaveText('Demo mode. Your data stays in this browser only.');
  await expect(page.locator('#signInLink')).toHaveCount(0);
  await expect(page.locator('#authDlg')).toBeHidden();
  expect(await page.evaluate(() => window.PSICloud.enabled)).toBe(false);
});

test.describe('cloud sync @smoke', () => {
  test('sign in with no saved row uploads the current plans', async ({ page }) => {
    await boot(page);
    const m = await mockSupabase(page);
    await open(page);
    await expect(page.locator('#signInBtn')).toBeVisible();
    await expect(page.locator('#demoBar')).toContainText('Sign in to save plans to your account');
    await expect(page.locator('#authGoogle')).toHaveCount(1);
    await page.locator('#c-fc-0').fill('555');
    await signIn(page);
    await expect(page.locator('#authDlg')).toBeHidden();
    await expect(status(page)).toHaveText('Saved');
    await expect(page.locator('#account .acct-email')).toHaveText(EMAIL);
    await expect(page.locator('#demoBar')).toBeHidden();
    await expect(page.locator('#toast')).toHaveText('Saved your current plans to your account');

    const login = m.log.find(e => e.path === '/auth/v1/token');
    expect(login.params.grant_type).toBe('password');
    expect(login.body).toMatchObject({ email: EMAIL, password: PASSWORD });
    const get = m.log.find(e => e.path === '/rest/v1/psi_workspaces' && e.method === 'GET');
    expect(get.params).toMatchObject({ user_id: `eq.${UID}` });
    expect(get.headers.authorization).toBe(`Bearer ${TOKEN}`);
    const saves = m.saves();
    expect(saves).toHaveLength(1);
    expect(saves[0].method).toBe('POST');
    expect(saves[0].headers.prefer).toContain('resolution=merge-duplicates');
    expect(saves[0].headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(saves[0].headers.apikey).toBe('test-anon-key');
    expect(saves[0].body.user_id).toBe(UID);
    expect(saves[0].body.data.items.map(i => i.code)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
    expect(saves[0].body.data.items[0].wk.fc[0]).toBe(555);
    await expect(page.locator('#authPw')).toHaveValue('');
    expect(m.log.some(e => e.path.startsWith('/rest/') && /token/.test(JSON.stringify(e.params)))).toBe(false);
  });

  test('editing after sign-in saves once, debounced, guarded by updated_at', async ({ page }) => {
    await boot(page);
    const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
    await open(page);
    await signIn(page);
    await expect(status(page)).toHaveText('Saved');
    await page.waitForTimeout(1500);
    expect(m.saves(), 'loading a row must not write it back').toHaveLength(0);
    const before = m.row.updated_at;
    m.patchDelay = 600;
    await page.evaluate(() => {
      window.__st = [];
      new MutationObserver(() => {
        const t = document.querySelector('#account .acct-status')?.textContent;
        if (t && window.__st.at(-1) !== t) window.__st.push(t);
      }).observe(document.getElementById('account'), { childList: true, subtree: true });
    });
    await page.locator('#c-fc-0').fill('');
    await page.locator('#c-fc-0').pressSequentially('1234', { delay: 40 });
    await expect(status(page)).toHaveText('Unsaved changes');
    expect(m.saves(), 'nothing is sent while typing').toHaveLength(0);
    await expect.poll(() => page.evaluate(() => window.__st)).toEqual(['Unsaved changes', 'Saving…', 'Saved']);
    const saves = m.saves();
    expect(saves).toHaveLength(1);
    expect(saves[0].method).toBe('PATCH');
    expect(saves[0].params).toMatchObject({ user_id: `eq.${UID}`, updated_at: `eq.${before}` });
    expect(saves[0].body.data.items[0].wk.fc[0]).toBe(1234);
    expect(saves[0].body).not.toHaveProperty('user_id');

    // The next save is guarded by the updated_at the first save returned.
    const afterFirst = m.row.updated_at;
    expect(afterFirst).not.toBe(before);
    m.patchDelay = 0;
    await page.locator('#c-fc-1').fill('9');
    await expect.poll(() => m.saves().length).toBe(2);
    expect(m.saves()[1].params.updated_at).toBe(`eq.${afterFirst}`);
    await expect(status(page)).toHaveText('Saved');
  });
});

test('sign-in dialog validates input before calling Supabase', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page);
  await open(page);
  await page.locator('#demoBar #signInLink').click();
  const dlg = page.locator('#authDlg');
  await expect(dlg).toBeVisible();
  await expect(page.locator('#authTitle')).toHaveText('Sign in to save your plans');
  await expect(page.locator('#authEmail')).toBeFocused();
  await page.locator('#authEmail').fill('not-an-email');
  await page.locator('#authPw').fill('longenough');
  await page.locator('#authSignIn').click();
  await expect(page.locator('#authMsg')).toHaveText('Enter a valid email address.');
  await expect(page.locator('#authMsg')).toHaveClass(/err/);
  await expect(page.locator('#authEmail')).toBeFocused();
  await page.locator('#authEmail').fill(EMAIL);
  await page.locator('#authPw').fill('short');
  await page.locator('#authSignIn').click();
  await expect(page.locator('#authMsg')).toHaveText('Enter a password of at least 8 characters.');
  await expect(page.locator('#authPw')).toBeFocused();
  await page.locator('#authSignUp').click();
  await expect(page.locator('#authMsg')).toHaveText('Enter a password of at least 8 characters.');
  await page.locator('#authEmail').fill('');
  await page.locator('#authMagic').click();
  await expect(page.locator('#authMsg')).toHaveText('Enter a valid email address.');
  await page.locator('#authForgot').click();
  await expect(page.locator('#authMsg')).toHaveText('Enter a valid email address.');
  expect(m.log.filter(e => e.path.startsWith('/auth/'))).toHaveLength(0);
  await page.locator('#authClose').click();
  await expect(dlg).toBeHidden();
  await page.locator('#signInBtn').click();
  await expect(page.locator('#authMsg')).toHaveText('');
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
});

test('wrong password shows a friendly message and stays signed out', async ({ page }) => {
  await boot(page);
  const done = allowHttpErrors(page, [400]);
  await mockSupabase(page);
  await open(page);
  await signIn(page, 'wrong-password');
  await expect(page.locator('#authMsg')).toHaveText('Email or password is wrong.');
  await expect(page.locator('#authDlg')).toBeVisible();
  await expect(page.locator('#authSignIn')).toBeEnabled();
  await expect(page.locator('#signInBtn')).toBeVisible();
  expect(await page.evaluate(() => window.PSICloud.user)).toBeNull();
  done();
});

test('signing in with a saved row loads it into the grid', async ({ page }) => {
  await boot(page);
  await mockSupabase(page, { row: { data: { ...cloudState('CLOUD-777', 'CLOUD-888'), view: 'monthly', active: 1 }, updated_at: stamp() } });
  await open(page);
  await expect.poll(() => demoKey(page)).not.toBeNull();
  const demoBefore = await demoKey(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  await expect(page.locator('#toast')).toHaveText('Loaded your saved plans');
  expect(await tabCodes(page)).toEqual(['CLOUD-777', 'CLOUD-888']);
  await expect(page.locator('#tabs [data-tab="1"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#vMonthly')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#c-fc-0')).toHaveValue('40');
  await page.waitForTimeout(600);
  expect(await demoKey(page)).toBe(demoBefore);
  await page.locator('#c-fc-0').fill('41');
  await page.waitForTimeout(600);
  expect(await demoKey(page), 'edits while signed in stay out of the demo key').toBe(demoBefore);
});

test('a restored session loads cloud data without touching the demo storage key', async ({ page }) => {
  await boot(page, { [SB_KEY]: JSON.stringify(session()) });
  await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await page.goto(PAGE);
  await expect(status(page)).toHaveText('Saved');
  expect(await tabCodes(page)).toEqual(['CLOUD-777']);
  await page.waitForTimeout(800);
  const demo = await demoKey(page);
  expect(demo === null || !demo.includes('CLOUD-777'), 'cloud data written to the demo key').toBe(true);
});

test('conflict: load the latest version', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  m.row = { data: cloudState('OTHER-DEVICE'), updated_at: stamp() };
  await page.locator('#c-fc-0').fill('42');
  await expect(status(page)).toHaveText('Conflict');
  const bar = page.locator('#demoBar');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveClass(/warn/);
  await expect(bar).toContainText('These plans were changed on another device.');
  await page.locator('#cfLoad').click();
  await expect(status(page)).toHaveText('Saved');
  expect(await tabCodes(page)).toEqual(['OTHER-DEVICE']);
  await expect(bar).toBeHidden();
  await page.locator('#c-fc-0').fill('43');
  await expect.poll(() => m.row.data.items[0].wk.fc[0]).toBe(43);
  await expect(status(page)).toHaveText('Saved');
});

test('conflict: keep mine and overwrite', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  m.row = { data: cloudState('OTHER-DEVICE'), updated_at: stamp() };
  await page.locator('#c-fc-0').fill('42');
  await expect(status(page)).toHaveText('Conflict');
  await page.locator('#cfKeep').click();
  await expect(status(page)).toHaveText('Saved');
  const last = m.saves().at(-1);
  expect(last.method).toBe('POST');
  expect(last.body.user_id).toBe(UID);
  expect(m.row.data.items[0].code).toBe('CLOUD-777');
  expect(m.row.data.items[0].wk.fc[0]).toBe(42);
  expect(await tabCodes(page)).toEqual(['CLOUD-777']);
  await expect(page.locator('#demoBar')).toBeHidden();
});

test('a failed save shows Not saved with Try again, and server text is not rendered as HTML', async ({ page }) => {
  await boot(page);
  const done = allowHttpErrors(page, [500]);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  m.failSave = { status: 500, body: { code: 'XX000', message: '<img src=x id=pwn>boom', details: null, hint: null } };
  await page.locator('#c-fc-0').fill('42');
  await expect(status(page)).toHaveText('Not saved');
  const bar = page.locator('#demoBar');
  await expect(bar).toContainText('Not saved. <img src=x id=pwn>boom');
  await expect(page.locator('#pwn')).toHaveCount(0);
  m.failSave = null;
  await page.locator('#retrySave').click();
  await expect(status(page)).toHaveText('Saved');
  await expect(bar).toBeHidden();
  expect(m.row.data.items[0].wk.fc[0]).toBe(42);
  done();
});

test('a load error can be retried', async ({ page }) => {
  await boot(page);
  const done = allowHttpErrors(page, [503]);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  let failGet = true;
  await page.route(`${SB}/rest/v1/psi_workspaces**`, async (route, req) => {
    if (failGet && req.method() === 'GET') return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: '{"message":"Service unavailable"}' });
    return route.fallback();
  });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Not saved');
  await expect(page.locator('#demoBar')).toContainText('Could not load your plans.');
  await page.locator('#c-fc-0').fill('42');
  await page.waitForTimeout(1500);
  expect(m.saves(), 'never overwrite the cloud row before it loaded').toHaveLength(0);
  failGet = false;
  await page.locator('#retrySave').click();
  await expect(status(page)).toHaveText('Saved');
  expect(await tabCodes(page)).toEqual(['CLOUD-777']);
  done();
});

test('plans over 900 KB are not sent', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  await page.evaluate(() => { S.items[0].desc = 'x'.repeat(950000); });
  await page.locator('#c-fc-0').fill('42');
  await expect(status(page)).toHaveText('Not saved');
  await expect(page.locator('#demoBar')).toContainText('Not saved: the plan is over 900 KB. Remove items or periods.');
  await page.waitForTimeout(300);
  expect(m.saves()).toHaveLength(0);
  await page.locator('#fDesc').fill('Short again');
  await expect(status(page)).toHaveText('Saved');
  expect(m.saves()).toHaveLength(1);
});

test('create account asks the user to confirm their email', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page);
  await open(page);
  await page.locator('#signInBtn').click();
  await page.locator('#authEmail').fill('new@example.com');
  await page.locator('#authPw').fill('a-new-password');
  await page.locator('#authSignUp').click();
  await expect(page.locator('#authMsg')).toHaveText('Check your inbox and click the confirmation link to finish creating your account.');
  await expect(page.locator('#authMsg')).toHaveClass(/ok/);
  const req = m.log.find(e => e.path === '/auth/v1/signup');
  expect(req.body).toMatchObject({ email: 'new@example.com', password: 'a-new-password', code_challenge_method: 's256' });
  expect(req.params.redirect_to).toBe('http://127.0.0.1:4173/psi-planner/');
  await expect(page.locator('#signInBtn')).toBeVisible();
});

test('magic link and forgot password show their confirmations', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page);
  await open(page);
  await page.locator('#signInBtn').click();
  await page.locator('#authEmail').fill(EMAIL);
  await page.locator('#authMagic').click();
  await expect(page.locator('#authMsg')).toHaveText('Sign-in link sent. Open it on this device.');
  const otp = m.log.find(e => e.path === '/auth/v1/otp');
  expect(otp.body).toMatchObject({ email: EMAIL, create_user: true });
  expect(otp.params.redirect_to).toBe('http://127.0.0.1:4173/psi-planner/');
  await page.locator('#authForgot').click();
  await expect(page.locator('#authMsg')).toHaveText('If an account exists for this email, a reset link is on its way.');
  const rec = m.log.find(e => e.path === '/auth/v1/recover');
  expect(rec.body.email).toBe(EMAIL);
  expect(rec.params.redirect_to).toBe('http://127.0.0.1:4173/psi-planner/');
});

test('a password reset link opens the new-password form and saves it', async ({ page }) => {
  // The PKCE verifier supabase-js stores for a reset request ends in /PASSWORD_RECOVERY.
  await boot(page, { [`${SB_KEY}-code-verifier`]: JSON.stringify('v'.repeat(56) + '/PASSWORD_RECOVERY') });
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await page.goto(PAGE + '?code=reset-code-123');
  await expect(page.locator('#authDlg')).toBeVisible();
  await expect(page.locator('#authTitle')).toHaveText('Set a new password');
  await expect(page.locator('#resetForm')).toBeVisible();
  await expect(page.locator('#authForm')).toBeHidden();
  expect(m.log.find(e => e.path === '/auth/v1/token').params.grant_type).toBe('pkce');
  expect(new URL(page.url()).search).toBe('');
  await page.locator('#resetPw').fill('new-password-1');
  await page.locator('#resetPw2').fill('new-password-2');
  await page.locator('#resetForm button[type=submit]').click();
  await expect(page.locator('#authMsg')).toHaveText('The two passwords don’t match.');
  await page.locator('#resetPw2').fill('new-password-1');
  await page.locator('#resetForm button[type=submit]').click();
  await expect(page.locator('#authDlg')).toBeHidden();
  await expect(page.locator('#toast')).toHaveText('Password updated');
  const put = m.log.find(e => e.path === '/auth/v1/user' && e.method === 'PUT');
  expect(put.body.password).toBe('new-password-1');
  await expect(status(page)).toHaveText('Saved');
});

test('Google sign-in redirects to Supabase with PKCE', async ({ page }) => {
  await boot(page);
  await mockSupabase(page);
  await open(page);
  await page.locator('#signInBtn').click();
  await expect(page.locator('#authGoogle')).toBeVisible();
  await expect(page.locator('#authOr')).toBeVisible();
  await page.locator('#authGoogle').click();
  await page.waitForURL(`${SB}/auth/v1/authorize**`);
  const u = new URL(page.url());
  expect(u.searchParams.get('provider')).toBe('google');
  expect(u.searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/psi-planner/');
  expect(u.searchParams.get('code_challenge_method')).toBe('s256');
  expect(u.searchParams.get('code_challenge')).toMatch(/^[\w-]{43}$/);
});

test('signing out flushes pending edits and returns to the demo data', async ({ page }) => {
  await boot(page);
  const m = await mockSupabase(page, { row: { data: cloudState('CLOUD-777'), updated_at: stamp() } });
  await open(page);
  await page.locator('#c-fc-0').fill('321');
  await page.waitForTimeout(400);
  const demoBefore = await demoKey(page);
  expect(JSON.parse(demoBefore).items[0].wk.fc[0]).toBe(321);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  await page.locator('#c-fc-0').fill('999');
  await page.locator('#signOutBtn').click();
  await expect(page.locator('#signInBtn')).toBeVisible();
  await expect(page.locator('#toast')).toHaveText('Signed out. Showing demo data.');
  expect(m.row.data.items[0].wk.fc[0], 'pending edit flushed before sign-out').toBe(999);
  expect(m.log.some(e => e.path === '/auth/v1/logout')).toBe(true);
  expect(await tabCodes(page)).toEqual(['FG-1001', 'FG-2040', 'RM-0310']);
  await expect(page.locator('#c-fc-0')).toHaveValue('321');
  await expect(page.locator('#demoBar')).toContainText('Demo mode.');
  expect(await page.evaluate(k => localStorage.getItem(k), SB_KEY)).toBeNull();
  await page.waitForTimeout(400);
  expect(await demoKey(page)).not.toContain('CLOUD-777');
  expect(JSON.parse(await demoKey(page)).items[0].wk.fc[0]).toBe(321);
});

test('account email is shown as text, never as markup', async ({ page }) => {
  await boot(page);
  const evil = '"><img src=x id=pwn>@example.com';
  await mockSupabase(page, { email: evil });
  await open(page);
  await signIn(page);
  await expect(status(page)).toHaveText('Saved');
  await expect(page.locator('#account .acct-email')).toHaveText(evil);
  await expect(page.locator('#pwn')).toHaveCount(0);
});

test('the planner hides itself inside a cross-origin frame', async ({ page }) => {
  // Serve the planner from a second origin by proxying http://planner.test to the test server.
  // (Framing 127.0.0.1 straight from a mocked page trips Chromium's private-network checks.)
  const framer = 'http://framer.test/';
  // Chromium blocks (and logs) the frame's attempt to navigate the cross-origin top window; cloud.js then stays hidden.
  const done = allowConsole(page, /^Unsafe attempt to initiate navigation for frame with URL 'http:\/\/framer\.test\/'/, 'blocked frame-busting navigation');
  await page.route(framer, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>framer</title><iframe src="http://planner.test/psi-planner/" width="800" height="600"></iframe>' }));
  await page.route('http://planner.test/**', async r => {
    const res = await r.fetch({ url: r.request().url().replace('http://planner.test', 'http://127.0.0.1:4173') });
    await r.fulfill({ response: res });
  });
  await page.goto(framer);
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#psi tbody tr').first()).toBeAttached();
  const f = page.frames().find(x => x.url().includes('/psi-planner/'));
  expect(await f.evaluate(() => document.documentElement.hidden)).toBe(true);
  expect(await f.evaluate(() => typeof window.PSICloud)).toBe('undefined');
  await expect(frame.locator('#psi')).toBeHidden();
  expect(page.url()).toBe(framer);
  done();
});

test('the planner breaks out of a same-origin frame', async ({ page }) => {
  await page.route('http://127.0.0.1:4173/__psi-frame-test.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>framer</title><iframe src="/psi-planner/"></iframe>' }));
  await page.goto('/__psi-frame-test.html');
  await page.waitForURL('**/psi-planner/');
  await expect(page.locator('#psi tbody tr').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.hidden)).toBe(false);
});
