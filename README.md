# tacticdev-site

This repository contains the tacticdev chat application UI, designed to work with a separate backend API.

## Configuration

### API Backend

This chat application requires a backend API server. Configure the API URL in `index.html`:

```javascript
// In index.html, set your backend API URL:
window.TACTICDEV_API_URL = 'https://api.tacticdev.com';
```

Or set it via environment variable or script tag before loading the app:

```html
<script>
  window.TACTICDEV_API_URL = 'https://your-api-server.com';
</script>
<script src="/app.js"></script>
```

If no API URL is configured, the app will show helpful error messages when attempting to chat.

For the backend implementation, see the `tacticdev-worker` repository.

## Contents

- `index.html` — chat application UI
- `styles.css`, `app.js`, `logo.svg` — application assets

## Run locally

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

For local development with a backend API, start your API server (e.g., tacticdev-worker) and configure the URL in `index.html`.

## Deployment

This repo includes a GitHub Actions workflow that deploys the repository to GitHub Pages on pushes to `main`.

If you prefer Cloudflare Pages or another host, you can replace the workflow with your preferred deployment action.

**Important:** When deploying, make sure to configure `window.TACTICDEV_API_URL` in `index.html` to point to your backend API server, otherwise the chat functionality will not work and users will receive error messages.

## Notes
- This was created as a clean split from the monorepo; history was not preserved. The monorepo still contains the chat app (vector).
- For the backend server implementation, see the `tacticdev-worker` repository.
- The 405 error occurs when no backend API is configured. Set `window.TACTICDEV_API_URL` to fix this.