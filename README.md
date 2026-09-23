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

AI automation leads the hub — it's the more defensible, differentiated
work. Website templates follow as a secondary offering.

### AI automation demos

| Demo | Description | Live | Code |
|---|---|---|---|
| AI lead intake | Classifies and summarizes a pasted inquiry via a server-side LLM call | [live](https://lead-intake-demo.vercel.app/) | [code](lead-intake-demo/) |
| Receipt & invoice extractor | Extracts structured fields from pasted receipt, invoice, or order-confirmation text | [live](https://receipt-extractor-demo.vercel.app/) | [code](receipt-extractor-demo/) |
| Knowledge-base Q&A | Answers questions grounded in a small fixed set of documents, with the source shown | [live](https://knowledge-base-qa-demo.vercel.app/) | [code](knowledge-base-qa-demo/) |

### Website templates

| Demo | Description | Live | Code |
|---|---|---|---|
| Local service business | Trust-first site for home and field service companies | [live](https://local-service-template-delta.vercel.app/) | [code](local-service-template/) |
| Professional services | Credibility-forward site for firms selling expertise | [live](https://professional-services-template-six.vercel.app/) | [code](professional-services-template/) |

## Tech stack

- Static HTML/CSS/vanilla JS for the hub and every template — no build step, no framework overhead.
- Vercel Serverless Functions (Node) for the AI demos only, so API keys stay server-side.
- Each top-level directory is its own Vercel project (monorepo layout, one repo → many deployments).

## Repo structure

```
portfolio/
├── index.html                          # Portfolio hub (this page)
├── styles.css                          # Hub styles
├── README.md
├── .gitignore
├── lead-intake-demo/                   # AI automation demo (live)
├── receipt-extractor-demo/             # AI automation demo (live)
├── knowledge-base-qa-demo/             # AI automation demo (live)
├── local-service-template/             # Website template (live)
├── professional-services-template/     # Website template (live)
└── (more top-level directories as future demos ship)
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

[joe@decisionclarity.io](mailto:joe@decisionclarity.io)
