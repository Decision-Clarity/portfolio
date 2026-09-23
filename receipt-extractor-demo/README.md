# Receipt & invoice extractor — Decision Clarity

**Live demo:** _pending deploy_

## Layer 1 — What does this do?

Small businesses spend real time typing receipts and invoices into a
spreadsheet or bookkeeping tool by hand, copying vendor, date, total,
and line items out of an email one field at a time.

This demo pastes in the text of a receipt, invoice, or order
confirmation and gets back, in about a second, the fields a bookkeeper
would key in manually: vendor, date, total, invoice number, and each
line item with its amount. It's the same data entry a back-office
person does by hand, done automatically as the text comes in.

Try it live, or read on for how it's built.

## Layer 2 — How's it built?

**Stack:** static HTML/CSS/vanilla JS front end, one Vercel Serverless
Function (`api/parse.js`, Node runtime), no framework.

**Flow:** browser → `POST /api/parse` with the pasted text → the
function calls the Anthropic Messages API server-side → a structured,
schema-validated JSON result comes back → the page renders it.

```
[ browser ]
  | POST /api/parse { text }
  v
[ Vercel Function: api/parse.js ]
  | 1. validate input (non-empty, <= 4000 chars)
  | 2. check per-IP rate limit (Upstash Redis)
  | 3. call Anthropic Messages API (claude-haiku-4-5)
  |    with a Zod output schema — the SDK validates
  |    the response against it before returning
  v
[ Anthropic API ]
  | structured JSON: vendor, date, total, invoiceNumber, lineItems
  v
[ browser renders the result ]
```

**The AI call** (`@anthropic-ai/sdk`'s `client.messages.parse()`) uses
`output_config.format` with a Zod schema (`ReceiptSchema` in
`api/parse.js`), so the SDK — not hand-written JSON parsing —
guarantees the shape of what comes back: nullable vendor/date/total/
invoice-number fields and a list of line items, each with a
description and a nullable amount (the model is instructed never to
invent a value that isn't literally in the text).

**The API key** (`ANTHROPIC_API_KEY`) lives only in this Vercel
project's environment variables. It is never sent to the browser,
never appears in client-side JS, and isn't in this repo.

**Text only, deliberately.** This demo's input is pasted text — the
kind of content that shows up in an email body — not a file upload.
The same extraction pipeline runs against uploaded PDFs and scanned
documents in a production build; this demo scopes to text so it stays
fast and free to run publicly with no file-handling attack surface.
The page says so directly, next to the input.

## Layer 3 — Does this hold up as a real system?

This is a scoped demo, not a production bookkeeping pipeline — no
auth, no persistence, no admin dashboard, no file upload. What follows
is what *was* built to make "demo" not mean "fragile."

**Cost control is layered, not single-point:**

1. **Hard input cap** — requests over 4,000 characters are rejected
   before the API call, bounding worst-case input tokens.
2. **Hard output cap** — `max_tokens: 500` on every call bounds
   worst-case output tokens regardless of what the model tries to write.
3. **Real per-IP rate limiting** — `@upstash/ratelimit` backed by an
   Upstash Redis database (sliding window, 40 requests/hour/IP), under
   its own key prefix (`document-parser`) so this demo's quota is
   independent of lead-intake's even though both share the same Redis
   database. This is external, durable state — not an in-memory
   counter — so it holds across cold starts and across whichever of
   Vercel's lambda instances happens to handle a given request.
4. **Session-visible use cap** — the page also enforces 5 uses per
   browser session via `sessionStorage`, shown to the user as a
   countdown. This is a UX convenience, not a security control: it's
   trivially reset (new tab, cleared storage). The Redis rate limit and
   the token/length caps above are the actual protection; the session
   cap just gives an honest user a clear signal before they'd hit it.

**Failure modes, handled explicitly, not just the happy path:**

| Failure | Response |
|---|---|
| Empty or missing text | `400 VALIDATION_ERROR` |
| Text over 4,000 chars | `400 VALIDATION_ERROR` |
| Rate limit exceeded (per-IP) | `429 RATE_LIMITED`, with `Retry-After` |
| Upstash Redis itself unreachable | Fails **open** — request proceeds without the per-IP limit, logged server-side. The token/length caps still bound cost; a transient Redis outage shouldn't take the demo down. |
| Anthropic API itself rate-limits us | `429 UPSTREAM_RATE_LIMITED` |
| Anthropic API error (5xx, etc.) | `502 UPSTREAM_ERROR` |
| Model refuses / output fails schema validation | `422 PARSE_ERROR` |
| `ANTHROPIC_API_KEY` missing (misconfiguration) | `500 CONFIG_ERROR`, logged server-side |
| Network failure reaching the function at all | Client-side catch, generic retry message |

Every error path returns a typed `error` code and a plain-language
`message` — nothing leaks a stack trace or raw upstream error text to
the client; anything unexpected is logged server-side via
`console.error` (visible in Vercel's function logs) instead.

**What's simulated vs. real:** the AI call is real — this is a genuine
`claude-haiku-4-5` request, not a canned response. What's simulated is
the business context: there's no real bookkeeping system behind this,
no accounting software it writes to, and "nothing you paste is
stored" is literally true — the function has no database and never
writes the input anywhere. A real deployment for a client would add
exactly two things this demo deliberately leaves out: file upload
(PDF/scanned-image ingestion, extracted server-side before the same
Claude call runs) and writing the extracted result somewhere (a
bookkeeping tool, a spreadsheet, an accounts-payable queue) instead of
just rendering it on the page.

**Model choice:** `claude-haiku-4-5` — cheap and fast, which matters
for a public demo with no user-level cost accounting. The model ID is
hardcoded as a constant in `api/parse.js` rather than resolved at
runtime; if Anthropic retires this identifier, the fix is a one-line
change, not a redesign.

**Known tradeoff, accepted deliberately:** the per-IP rate limit is
genuinely per-IP, not per-person — a shared office network or NAT
could hit the ceiling faster than one individual would. For a free
public demo, 40 requests/hour/IP is a generous ceiling in practice;
it was not tuned against real traffic because none exists yet.

## Local development

```bash
npm install
vercel dev
```

Requires `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_KV_REST_API_URL`, and
`UPSTASH_REDIS_REST_KV_REST_API_TOKEN` in a local `.env` (see `.env.example`) —
none of these are committed to the repo.
