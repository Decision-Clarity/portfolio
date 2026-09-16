# Local service business template — Ridgeline Plumbing & Drain

A trust-first template shell for home and field service businesses
(plumbing, HVAC, electrical, etc.). Static HTML/CSS, no build step,
no dependencies.

## What's placeholder

Everything with a `.example` domain, the `(555)` phone number, the
license number, and the town names is fictional placeholder content —
swap these for the real business's details:

- `index.html` — business name, phone number (`tel:` links appear
  3 times), license number, service list, service area, testimonials
- Favicon and `theme-color` in `<head>` if the new brand needs a
  different accent color (see `styles.css`'s `--accent` token)

## Design notes

Safety-orange accent on a charcoal/putty base — trade-signage colors,
not a generic SaaS palette. Barlow Condensed (display) + Public Sans
(body). No shadows or rounded cards; structure comes from rules and
borders, matching how a real work order or estimate sheet reads.

## Local preview

Open `index.html` directly in a browser, or serve the folder with any
static file server (e.g. `npx serve .`).
