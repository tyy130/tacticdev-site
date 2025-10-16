# tacticdev-site

This repository contains the static marketing site for tacticdev, extracted from the monorepo.

Contents
- `index.html` — main static site
- `styles.css`, `app.js`, `logo.svg`

Run locally

You can preview the site locally with a static server. Example using Node:

```powershell
# from the repo root
npx http-server -p 8080
# then open http://localhost:8080
```

Or using Python:

```powershell
python -m http.server 8080
```

Deployment

This repo includes a GitHub Actions workflow that deploys the repository to GitHub Pages on pushes to `main`.

If you prefer Cloudflare Pages or another host, you can replace the workflow with your preferred deployment action.

Notes
- This was created as a clean split from the monorepo; history was not preserved. The monorepo still contains the chat app (vector).
- For changes that require server-side APIs, see the `tacticdev-worker` repository.