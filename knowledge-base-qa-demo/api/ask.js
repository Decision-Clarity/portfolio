import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod/v4";
import { CORPUS } from "../corpus.js";
import { buildChunks, selectTopChunks } from "../retrieval.js";

// Hard cost ceiling. These two caps bound the worst-case spend of a single
// request regardless of whether the rate limiter is ever bypassed.
const MAX_INPUT_CHARS = 300;
const MAX_OUTPUT_TOKENS = 500;
const TOP_K_CHUNKS = 4;

// Real per-IP protection: Upstash Redis, not an in-memory counter, so it
// holds across cold starts and across the multiple lambda instances Vercel
// may run concurrently. Own prefix so this demo's quota is independent of
// lead-intake's and the receipt extractor's even though all three share the
// same Redis database.
const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(40, "1 h"),
  prefix: "kb-qa",
});

const MODEL = "claude-haiku-4-5";

// Built once per cold start — the corpus is small and fixed.
const CHUNKS = buildChunks(CORPUS);

const NOT_FOUND_MESSAGE = "I do not see that in the provided documents.";

const AnswerSchema = z.object({
  answerable: z.boolean(),
  answer: z.string(),
  citedIndex: z.number().int().nullable(),
});

const SYSTEM_PROMPT = `You answer questions about Northbound Scheduler, a fictional appointment-scheduling product, using ONLY the numbered excerpts provided in the user message.
Never use outside knowledge, even if you happen to know something about scheduling software in general — the excerpts are the only source of truth.
If the excerpts answer the question, set answerable to true, write a clear and specific answer using the details actually present in the excerpts (quote numbers, steps, and policy terms exactly as written), and set citedIndex to the number of the single excerpt that most directly supports your answer.
If the excerpts do not contain the answer, set answerable to false, set answer to "${NOT_FOUND_MESSAGE}", and set citedIndex to null.
Never guess or fill in a plausible-sounding answer that isn't actually stated in the excerpts.`;

function buildUserMessage(question, candidates) {
  const excerpts = candidates
    .map((chunk, i) => `[${i + 1}] Document: ${chunk.docTitle} — Section: ${chunk.sectionTitle}\n${chunk.text}`)
    .join("\n\n");
  return `Question: ${question}\n\nExcerpts:\n${excerpts}`;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Use POST." });
  }

  const { question } = req.body ?? {};

  if (typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Type a question first." });
  }

  if (question.length > MAX_INPUT_CHARS) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: `That's too long for this demo (max ${MAX_INPUT_CHARS} characters).`,
    });
  }

  const ip = getClientIp(req);
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);
    if (!success) {
      const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "RATE_LIMITED",
        message: "This demo is rate-limited to keep it free for everyone — try again in a bit.",
        limit,
        remaining,
      });
    }
  } catch (error) {
    // Fail open, not closed: if Redis itself is unreachable, a transient
    // outage shouldn't take the whole demo down. The hard input/output
    // token caps still bound worst-case cost per request even with the
    // rate limiter skipped — this is defense in depth, not the only guard.
    console.error("ask: rate limiter unavailable, proceeding without it", error);
  }

  // Retrieval happens before the Anthropic call, not just as a prompt
  // decoration: a question with zero keyword overlap with the corpus never
  // reaches the model at all, so "not in the documents" is guaranteed for
  // clearly off-topic questions rather than left to the model's judgment.
  const candidates = selectTopChunks(question, CHUNKS, TOP_K_CHUNKS);

  if (candidates.length === 0) {
    return res.status(200).json({
      result: { answerable: false, answer: NOT_FOUND_MESSAGE, source: null },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ask: ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: "CONFIG_ERROR", message: "Demo is misconfigured — check back soon." });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(question, candidates) }],
      output_config: { format: zodOutputFormat(AnswerSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return res.status(422).json({
        error: "PARSE_ERROR",
        message: "Couldn't answer that — try rephrasing your question.",
      });
    }

    const parsed = response.parsed_output;

    // Resolve the model's citedIndex back to a real document/section. If the
    // model says answerable but the citation doesn't resolve to a real
    // candidate, don't display an answer we can't attribute — that would
    // undercut the whole "grounded, admits when it doesn't know" premise.
    let source = null;
    if (parsed.answerable && parsed.citedIndex !== null) {
      const index = parsed.citedIndex - 1;
      if (index >= 0 && index < candidates.length) {
        source = { docTitle: candidates[index].docTitle, sectionTitle: candidates[index].sectionTitle };
      }
    }
    const answerable = parsed.answerable && source !== null;

    return res.status(200).json({
      result: {
        answerable,
        answer: answerable ? parsed.answer : NOT_FOUND_MESSAGE,
        source,
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "UPSTREAM_RATE_LIMITED", message: "The model is busy — try again shortly." });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("ask: Anthropic API error", error.status, error.message);
      return res.status(502).json({ error: "UPSTREAM_ERROR", message: "The demo is temporarily unavailable." });
    }
    console.error("ask: unexpected error", error);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: "Something went wrong on our end." });
  }
}
