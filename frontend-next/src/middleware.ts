// Middleware intentionally left minimal.
// Auth is handled client-side via AuthProvider + useAuth hook.
// Supabase JS stores sessions in localStorage (not cookies),
// so server-side cookie checks would block authenticated users.

export { };
