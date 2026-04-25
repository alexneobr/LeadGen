# LeadsGen

> Extract business contact info from Google Maps — search by business type and location, export results to CSV.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square)](https://alexneobr.github.io/LeadGen/)

## Features

- Search Google Maps businesses by type and location (e.g. "Marketing Agency in New York")
- Configurable result count — 10, 20, 50, or 100 leads per search
- Results table with: business name, category, phone, website, address, rating, review count, Maps link
- One-click CSV export
- Real-time status updates while the scraper runs
- Clean, responsive UI — no frameworks, no dependencies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Data source | [Apify](https://apify.com) — `compass~crawler-google-places` actor |
| API | Apify REST API (called directly from the browser) |
| Hosting | GitHub Pages |

## Setup Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/alexneobr/LeadGen.git
   cd LeadGen
   ```

2. **Get an Apify API token**
   - Sign up at [apify.com](https://apify.com)
   - Go to **Settings → Integrations** and copy your API token

3. **Create `config.js`** (this file is gitignored — never commit it)
   ```js
   const CONFIG = {
     APIFY_TOKEN: 'your_apify_token_here'
   };
   ```

4. **Open the app**
   ```
   Open index.html in your browser
   ```
   No build step, no server required.

## Screenshots

> Screenshots coming soon

## License

MIT
