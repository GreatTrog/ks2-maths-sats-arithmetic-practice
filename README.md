<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/14tYOnxlKliCH3KpjWhXDp0iBz43Idk7S

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

1. Make sure the repo is named `ks2-maths-sats-arithmetic-practice` (or update `vite.config.ts`/`package.json` to match your repo name) so the production base path aligns with `/REPO_NAME/`.
2. Install dependencies (if not already) and build the production bundle:
   `npm install`
   `npm run build`
3. Push the generated `dist/` directory to GitHub Pages using the new helper script:
   `npm run deploy`
   This runs `gh-pages -d dist` and publishes to the `gh-pages` branch; configure your repository's Pages settings to serve from that branch.
   The helper script keeps the cache directory inside your OS temp folder (`<os temp>/gh-pages-cache`) so the intermediate clone path stays short enough for Windows. If you run `gh-pages` directly, set `CACHE_DIR` yourself (e.g., `set "CACHE_DIR=C:/gh-pages-cache" && gh-pages -d dist` on PowerShell/Command Prompt).
4. If you need a custom base URL (for a different repo or subfolder), set `VITE_BASE_PATH` before building (e.g., `VITE_BASE_PATH=/custom-path/ npm run build`); the config falls back to the repo name when the variable is absent.
