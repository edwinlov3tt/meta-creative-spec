# Meta Creative Preview Generator  

Vanilla JavaScript application for Facebook/Instagram ad creative design.

🚀 Live: Connected to Vercel auto-deployment (static assets + Node functions)
📦 Repository: https://github.com/edwinlov3tt/meta-creative-spec

## Serverless API

This project now uses Vercel serverless functions:

- `api/facebook-page` – verifies Facebook pages via Meta worker with fallbacks
- `api/generate-copy` – calls Anthropic Claude to produce ad copy

Set `ANTHROPIC_API_KEY` (and optionally `FACEBOOK_WORKER_URL`) in your Vercel project or `.env` when using `vercel dev` locally.
