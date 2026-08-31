import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ===== GITHUB PAGES CONFIGURATION =====
// Set this to "/<your-repo-name>/" before deploying to GitHub Pages.
// Example: if your repo is https://github.com/yourname/data-escape-room
// then base should be "/data-escape-room/".
// If deploying to a custom domain or the root of a user/org page
// (yourname.github.io), set base to "/".
const REPO_NAME = 'data-escape-room';

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
});
