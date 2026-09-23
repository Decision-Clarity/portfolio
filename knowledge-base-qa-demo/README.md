# Knowledge-base Q&A — Decision Clarity

**Live demo:** https://knowledge-base-qa-demo.vercel.app/

## Layer 1 — What does this do?

Small businesses have documents, an FAQ, a policy, a getting-started guide,
that answer most of what customers or staff ask, but nobody reads them.
Someone emails support instead and waits for a human to go dig up the
answer.

This demo asks a question and gets back, in about a second, an answer
pulled directly from a fixed set of documents, plus exactly which document
and section it came from. Ask something the documents don't cover and it
says so, instead of inventing a plausible-sounding answer.

Try it live, or read on for how it's built.

## Layer 2 — How's it built?

**Stack:** static HTML/CSS/vanilla JS front end, one Vercel Serverless
Function (`api/ask.js`, Node runtime), no framework.

**Flow:** browser → `POST /api/ask` with the question → the function
scores the question against every document section by keyword overlap →
the top matching sections are sent to the Anthropic Messages API as
context → a structured, schema-validated JSON result comes back, naming
which excerpt (if any) the answer relies on → the page renders the answer
with its source.

```
[ browser ]
  | POST /api/ask { question }
  v
[ Vercel Function: api/ask.js ]
  | 1. validate input (non-empty, <= 300 chars)
  | 2. check per-IP rate limit (Upstash Redis)
  | 3. keyword-score every document section against
  |    the question (retrieval.js) — top 4 matches win
  | 4. if nothing scores above zero, return "not found"
  |    directly, no Anthropic call made
  | 5. otherwise call Anthropic Messages API
  |    (claude-haiku-4-5) with the top excerpts as
  |    context and a Zod output schema
  v
[ Anthropic API ]
  | structured JSON: answerable, answer, citedIndex
  v
[ browser renders the answer + its source ]
```

**Retrieval is keyword/lexical, not semantic — deliberately.** `retrieval.js`
tokenizes the question and every document section into lowercase words,
strips a small stopword list, and scores each section by how many query
words it contains (term-frequency overlap). The top four sections with a
non-zero score become the candidate excerpts. There is no embedding model,
no vector database, and no external API beyond Anthropic's — the whole
technique is arithmetic over word counts. See the capability note on the
page itself and "What's simulated vs. real" below for why this is a
deliberate demo choice, not an oversight.

**Grounding is enforced twice, not just prompted for once:**

1. **Retrieval-side:** if the question shares zero keywords with the
   entire corpus, the function returns "I do not see that in the provided
   documents" directly and never calls Anthropic at all — a clearly
   off-topic question is guaranteed to get the honest answer, for free.
2. **Model-side, then re-checked server-side:** for a question that does
   retrieve candidate excerpts, the model is instructed to answer only
   from them and to name which excerpt (`citedIndex`) supports its answer,
   or say the excerpts don't answer the question. The server then
   independently resolves `citedIndex` back to a real document and
   section; if the model claims an answer but the citation doesn't
   resolve, the server overrides it to the "not found" response rather
   than display an answer it can't attribute. The UI is never shown a
   grounded-looking answer with no real source behind it.

**The AI call** (`@anthropic-ai/sdk`'s `client.messages.parse()`) uses
`output_config.format` with a Zod schema (`AnswerSchema` in
`api/ask.js`), so the SDK — not hand-written JSON parsing — guarantees the
shape of what comes back: a boolean `answerable`, the `answer` text, and a
nullable `citedIndex` pointing at one of the numbered excerpts the model
was given.

**The API key** (`ANTHROPIC_API_KEY`) lives only in this Vercel project's
environment variables. It is never sent to the browser, never appears in
client-side JS, and isn't in this repo.

**The corpus is fixed and fictional**, four documents about a made-up
scheduling product, "Northbound Scheduler" (`corpus.js`): an FAQ, a
Refund & Cancellation Policy, a Getting Started Guide, and a Product
Overview & Features page. Each document is split into sections at load
time (`retrieval.js`'s `buildChunks()`); a section is the unit retrieval
scores and cites.

## Layer 3 — Does this hold up as a real system?

This is a scoped demo, not a production support pipeline, no document
upload, no corpus management UI, no auth, no persistence. What follows is
what *was* built to make "demo" not mean "fragile."

**Cost control is layered, not single-point:**

1. **Hard input cap** — questions over 300 characters are rejected before
   the API call, bounding worst-case input tokens.
2. **Hard output cap** — `max_tokens: 500` on every call bounds
   worst-case output tokens regardless of what the model tries to write.
3. **Retrieval short-circuit** — a question with zero keyword overlap with
   the corpus never reaches the Anthropic API at all; only questions that
   plausibly relate to the documents incur a model call.
4. **Real per-IP rate limiting** — `@upstash/ratelimit` backed by an
   Upstash Redis database (sliding window, 40 requests/hour/IP), under its
   own key prefix (`kb-qa`) so this demo's quota is independent of the
   other two demos' even though all three share the same Redis database.
   This is external, durable state, not an in-memory counter, so it holds
   across cold starts and across whichever of Vercel's lambda instances
   happens to handle a given request.
5. **Session-visible use cap** — the page also enforces 5 uses per browser
   session via `sessionStorage`, shown to the user as a countdown. This is
   a UX convenience, not a security control: it's trivially reset (new
   tab, cleared storage). The Redis rate limit and the token/length caps
   above are the actual protection; the session cap just gives an honest
   user a clear signal before they'd hit it.

**Failure modes, handled explicitly, not just the happy path:**

| Failure | Response |
|---|---|
| Empty or missing question | `400 VALIDATION_ERROR` |
| Question over 300 chars | `400 VALIDATION_ERROR` |
| Rate limit exceeded (per-IP) | `429 RATE_LIMITED`, with `Retry-After` |
| Upstash Redis itself unreachable | Fails **open** — request proceeds without the per-IP limit, logged server-side. The token/length caps and the retrieval short-circuit still bound cost; a transient Redis outage shouldn't take the demo down. |
| Question shares no keywords with the corpus | `200`, `answerable: false`, no Anthropic call made |
| Model claims answerable but citation doesn't resolve | Server overrides to the "not found" response rather than show an unattributed answer |
| Anthropic API itself rate-limits us | `429 UPSTREAM_RATE_LIMITED` |
| Anthropic API error (5xx, etc.) | `502 UPSTREAM_ERROR` |
| Model refuses / output fails schema validation | `422 PARSE_ERROR` |
| `ANTHROPIC_API_KEY` missing (misconfiguration) | `500 CONFIG_ERROR`, logged server-side |
| Network failure reaching the function at all | Client-side catch, generic retry message |

Every error path returns a typed `error` code and a plain-language
`message`, nothing leaks a stack trace or raw upstream error text to the
client; anything unexpected is logged server-side via `console.error`
(visible in Vercel's function logs) instead.

**What's simulated vs. real:** the AI call is real, this is a genuine
`claude-haiku-4-5` request, not a canned response, and the retrieval
scoring genuinely selects which excerpts get sent. What's simulated is the
business context: there's no real scheduling product behind "Northbound
Scheduler," and the corpus is fixed at four documents rather than a real
company's full document set. A production deployment for a client would
add exactly what the capability note on the page says it would: vector
embeddings and semantic search over the client's actual, larger, and
changing document set, likely with a document upload/management surface,
neither of which this demo needs to make its point about grounded,
source-cited answers.

**Model choice:** `claude-haiku-4-5`, cheap and fast, which matters for a
public demo with no user-level cost accounting. The model ID is hardcoded
as a constant in `api/ask.js` rather than resolved at runtime; if
Anthropic retires this identifier, the fix is a one-line change, not a
redesign.

**Known tradeoff, accepted deliberately:** keyword retrieval has no
notion of synonyms or paraphrase, a question using different words than
the document ("How do I bring on a new employee?" vs. the guide's "Invite
your team") can score lower or miss entirely even though a human would
recognize the match. This is the exact gap semantic/embedding-based
retrieval closes in a production build, and it's why the capability note
on the page says so directly rather than letting the lexical approach
pass as the real thing.

## Local development

```bash
npm install
vercel dev
```

Requires `ANTHROPIC_API_KEY`, `KV_REST_API_URL`, and `KV_REST_API_TOKEN` in
a local `.env` (see `.env.example`), none of these are committed to the
repo.
