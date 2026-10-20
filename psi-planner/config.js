/* Public Supabase settings for the PSI Planning Grid.
   The anon key is designed to be public: row-level security in supabase/migrations decides what each user can read and write.
   Leave both values empty to run in demo mode only (no sign-in, data stays in the browser). */
window.PSI_CONFIG = Object.freeze({
  supabaseUrl: '',
  supabaseAnonKey: '',
  googleSignIn: false
});
