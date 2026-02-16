# CivicVerify

**Your Voice. Verified.**

CivicVerify is the verified polling platform where real, identity-verified citizens shape the policies that affect their lives. Unlike traditional polling, every CivicVerify respondent is identity-verified — no bots, no duplicates, no fabricated data.

## Live Demo

The app includes demo accounts to explore all three user roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civicverify.org | admin123 |
| Citizen | citizen@test.com | test123 |
| Organization | org@test.com | test123 |

## Features

### Landing Page
- Full marketing homepage with mission statement, how it works, trust/privacy section
- Organization pricing tiers (Standard $3.50, Refined $5.00, Precision $7.50+)
- Mobile-responsive design

### Admin Dashboard
- **Dashboard** — KPI cards (verified users, responses, revenue, verification rate) + active survey list
- **Review Queue** — Approve/reject organization-submitted surveys
- **Surveys** — Searchable survey management table
- **Respondents** — Full respondent database with detail view, stats cards
- **Clients** — Organization client management with tier tracking
- **Analytics** — Response growth chart + monthly revenue breakdown
- **Settings** — Platform configuration

### Citizen App
- Browse and take active surveys (5Q and 10Q formats)
- Likert scale question interface
- Impact tracking (surveys completed, questions answered)
- Account management with verification status

### Organization Portal
- Organization dashboard with active surveys, responses, tier info
- Survey list with status tracking
- CivicVerify value proposition

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool
- **Pure CSS** — No Tailwind/CSS framework dependency
- **DM Sans + Libre Baskerville** — Typography

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Framework preset: **Vite**
4. Deploy

### Netlify
1. Push to GitHub
2. Import on [netlify.com](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`

### Manual
```bash
npm run build
# Upload contents of /dist to any static hosting
```

## Project Structure

```
civicverify-app/
├── index.html          # Entry HTML
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── public/
│   └── favicon.svg     # Shield favicon
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Full application (single-file)
```

## Business Model

CivicVerify operates on a civic duty model — citizens participate for free to have their verified voice heard. Revenue comes from organizations purchasing access to verified polling data:

| Tier | Price | Format |
|------|-------|--------|
| Standard | $3.50/response | 5-question surveys |
| Refined | $5.00/response | 10-question surveys |
| Precision | $7.50+/response | Custom research |

## Supabase Integration (Production)

The app is designed for Supabase backend integration. See `CivicVerify_Developer_Handoff.docx` for complete database schema, API endpoints, and implementation guide.

---

**CivicVerify** — Independent. Nonpartisan. Verified.
