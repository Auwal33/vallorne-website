# Deployment layout for existing Vallorne site

The old GitHub `main` branch contained a single `index.html` at repository root. To preserve automatic Cloudflare Pages hosting under the same build-output setting, the new bilingual site has its static HTML and `assets/` directly in repository root.

Use Cloudflare Pages Git integration with production branch `main`, framework None, no build step required, output directory `.`. Functions live in `functions/api/` with shared logic in `functions/_server/`. External form services require configuration before accepting submissions.

If the deployment fails, inspect the Cloudflare Pages build-output directory before changing DNS.
