# Decision Clarity — Portfolio

**Live hub:** https://portfolio-freelance-7d8a.vercel.app/

A live, working portfolio of website templates and AI automation demos.
Every link below goes to a real, deployed project — not a screenshot.

## What this is

Decision Clarity is a freelance studio building two kinds of things:

1. **Website templates** — complete, production-quality template sites
   across common small-business categories. Pick one as a starting shell;
   the paid work is wiring in your own content.
2. **AI automation demos** — small, genuinely functional tools that call
   an LLM server-side to do real work (classification, extraction,
   grounded Q&A), proving working systems rather than static mockups.

This repo is a **monorepo**: each demo lives in its own top-level
directory and deploys as its own independent Vercel project.

## Demos

### Website templates

| Demo | Description | Live | Code |
|---|---|---|---|
| Local service business | Trust-first site for home and field service companies | _coming soon_ | _coming soon_ |
| Restaurant & café | Menu, hours, location, and a reservation/order CTA | _coming soon_ | _coming soon_ |
| Professional services | Credibility-forward site for firms selling expertise | _coming soon_ | _coming soon_ |
| Creator & portfolio | Bold, visual personal site with a projects/gallery section | _coming soon_ | _coming soon_ |
| Product / SaaS landing | Conversion-focused landing page with pricing and signup | _coming soon_ | _coming soon_ |

### AI automation demos

| Demo | Description | Live | Code |
|---|---|---|---|
| AI lead intake | Classifies and summarizes a pasted inquiry via a server-side LLM call | _coming soon_ | _coming soon_ |
| Document / receipt parser | Extracts structured fields from pasted or uploaded text | _coming soon_ | _coming soon_ |
| Knowledge-base Q&A | Answers questions grounded in a small fixed set of documents | _coming soon_ | _coming soon_ |

_(Exactly which 2–3 automation demos ship is decided when that phase of work starts — this table will be trimmed to match.)_

## Tech stack

- Static HTML/CSS/vanilla JS for the hub and every template — no build step, no framework overhead.
- Vercel Serverless Functions (Node) for the AI demos only, so API keys stay server-side.
- Each top-level directory is its own Vercel project (monorepo layout, one repo → many deployments).

## Repo structure

```
portfolio/
├── index.html              # Portfolio hub (this page)
├── styles.css               # Hub styles
├── README.md
├── .gitignore
└── (one top-level directory per demo, added as each is built)
```

## Deploying a new demo

Each demo is deployed as its own Vercel project pointed at a subdirectory
of this repo:

1. Push the new top-level directory to `main`.
2. In Vercel: **Add New → Project → Import** this repo.
3. Set **Root Directory** to the demo's folder (e.g. `local-service-template`).
4. Deploy. Any API keys the demo needs go in that Vercel project's
   **Environment Variables** — never in the repo.
5. Copy the resulting `*.vercel.app` URL into this table and onto the hub page.

## Security

No API key or credential is ever committed to this repo. Anything a
serverless function needs is read from an environment variable configured
directly in that demo's Vercel project settings.

## Contact

[hello@decisionclarity.dev](mailto:hello@decisionclarity.dev)
