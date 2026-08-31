import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ===== GITHUB PAGES CONFIGURATION =====
// Must match the actual GitHub repo name exactly (case and punctuation
// included) — this repo is chaitanyakonda3110/dataescaperoom, so it's
// "dataescaperoom", not "data-escape-room". If deploying to a custom
// domain or the root of a user/org page (yourname.github.io), set base
// to "/" instead.
const REPO_NAME = 'dataescaperoom';

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
});
