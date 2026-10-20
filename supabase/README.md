# PSI Planning Grid – Supabase setup

The planner at `/psi-planner/` runs in demo mode until `psi-planner/config.js` has a Supabase URL and anon key. Demo data stays in the visitor's browser. Signed-in users get one private workspace row in `public.psi_workspaces`.

## One-time setup

1. Create a project at supabase.com (free tier is enough). Pick the Mumbai region (`ap-south-1`) for low latency from India.
2. SQL editor → paste and run `migrations/20261020000000_psi_workspaces.sql`.
3. Authentication → URL Configuration
   - Site URL: `https://panshulbh16.github.io/psi-planner/`
   - Redirect URLs: `https://panshulbh16.github.io/psi-planner/` and `http://127.0.0.1:4173/psi-planner/`
4. Authentication → Providers → Email: keep "Confirm email" on. Authentication → Policies (or Auth settings): minimum password length 8, enable leaked-password protection if your plan has it.
5. Optional Google sign-in: Authentication → Providers → Google, add the OAuth client ID and secret from Google Cloud, then set `googleSignIn: true` in `config.js`.
6. Project Settings → API: copy the Project URL and the `anon` public key into `psi-planner/config.js`. Never put the `service_role` key in this repo.

## Security model

- The anon key is public by design. Row-level security is forced on the table, `anon` has no grants, and every policy checks `auth.uid() = user_id`, so a user can only read and write their own row.
- The client refuses to save above 900 KB of compact JSON. The database cap is 2 MB of jsonb text, because jsonb's text form adds spaces and runs 1.2–1.4× larger.
- Saves use optimistic concurrency on `updated_at`. If another device saved first, the user chooses to load the latest version or overwrite it.
- Sign-in uses the PKCE flow. Tokens in the URL are removed after sign-in.
- The page has a strict Content-Security-Policy: scripts only from this site, network calls only to this site and `*.supabase.co`, no inline scripts, no third-party fonts. The Supabase client is self-hosted in `psi-planner/vendor/`.
- GitHub Pages can't send `frame-ancestors`, so the page refuses to render inside a frame.
- On sign-out the app goes back to the demo data; signed-in data is never written to the demo storage key.
