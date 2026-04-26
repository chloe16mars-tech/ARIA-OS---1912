/**
 * Local development environment.
 *
 * In dev, `apiUrl` is left empty so the Angular dev-server proxy
 * (proxy.conf.json) routes /api → http://localhost:4000.
 *
 * Run `npm run set-env` after editing .env to regenerate this file
 * (or edit the values in place — they will be overwritten by set-env).
 */
export const environment = {
  production: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  apiUrl: '',
};
