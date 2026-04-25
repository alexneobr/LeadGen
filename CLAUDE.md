# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step or server required. Open `index.html` directly in a browser:

```powershell
Start-Process "c:\Users\alexn\LeadsGeneration\index.html"
```

## Architecture

Pure frontend app — no framework, no bundler, no dependencies. Four files that load in order via `<script>` tags in `index.html`:

- **`config.js`** — loaded first; exposes `CONFIG.APIFY_TOKEN` as a global used by `app.js`
- **`app.js`** — all application logic; reads `CONFIG` from the global scope

### Apify Integration (`app.js`)

The app calls the Apify REST API directly from the browser. The actor is `compass~crawler-google-places`. Flow:

1. `startRun()` — `POST /acts/compass~crawler-google-places/runs` with `searchStringsArray: ["<businessType> in <location>"]`
2. `pollRun()` — `GET /actor-runs/{runId}` every 4 seconds until status is `SUCCEEDED`
3. `fetchResults()` — `GET /datasets/{datasetId}/items`

To swap the actor, change `ACTOR_ID` at the top of `app.js`. To find valid actor slugs, query:
```
GET https://api.apify.com/v2/store?search=<term>&token=<token>
```

### Key output fields from the actor
`title`, `categoryName`, `phone`, `website`, `address`, `totalScore`, `reviewsCount`, `url`

## Sensitive Files

`config.js` and `.env` are gitignored — they contain the Apify token. `config.js` must exist locally for the app to work; it is not committed.
