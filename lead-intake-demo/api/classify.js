import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod/v4";

// Hard cost ceiling. These two caps bound the worst-case spend of a single
// request regardless of whether the rate limiter is ever bypassed.
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 500;

// Real per-IP protection: Upstash Redis, not an in-memory counter, so it
// holds across cold starts and across the multiple lambda instances Vercel
// may run concurrently.
const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "lead-intake",
});

const MODEL = "claude-haiku-4-5";

const LeadSchema = z.object({
  category: z.enum([
    "new_business",
    "support_request",
    "vendor_pitch",
    "job_inquiry",
    "spam",
    "other",
  ]),
  urgency: z.enum(["low", "medium", "high"]),
  summary: z.string().max(280),
  contact: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    company: z.string().nullable(),
  }),
});

const SYSTEM_PROMPT = `You classify inbound business inquiries for a small service company's intake queue.
Read the pasted text and return only the structured fields you're asked for.
Extract contact details only if they literally appear in the text — never invent a name, email, phone, or company.
"spam" means unsolicited advertising or clearly automated junk, not just an unfamiliar sender.
Keep the summary to one plain sentence a staff member could scan in a queue.`;

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

  const { text } = req.body ?? {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Paste some inquiry text first." });
  }

  if (text.length > MAX_INPUT_CHARS) {
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
    // token caps below still bound worst-case cost per request even with
    // the rate limiter skipped — this is defense in depth, not the only
    // guard.
    console.error("classify: rate limiter unavailable, proceeding without it", error);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("classify: ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: "CONFIG_ERROR", message: "Demo is misconfigured — check back soon." });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
      output_config: { format: zodOutputFormat(LeadSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return res.status(422).json({
        error: "PARSE_ERROR",
        message: "Couldn't classify that inquiry — try rephrasing it.",
      });
    }

    return res.status(200).json({ result: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "UPSTREAM_RATE_LIMITED", message: "The model is busy — try again shortly." });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("classify: Anthropic API error", error.status, error.message);
      return res.status(502).json({ error: "UPSTREAM_ERROR", message: "The classifier is temporarily unavailable." });
    }
    console.error("classify: unexpected error", error);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: "Something went wrong on our end." });
  }
}
