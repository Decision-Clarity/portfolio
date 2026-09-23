const SESSION_LIMIT = 5;
const SESSION_KEY = "kbQaUsesRemaining";

const form = document.getElementById("ask-form");
const textarea = document.getElementById("question-text");
const charCount = document.getElementById("char-count");
const submitBtn = document.getElementById("submit-btn");
const sessionNote = document.getElementById("session-note");
const resultPanel = document.getElementById("result-panel");
const errorPanel = document.getElementById("error-panel");

function getRemainingUses() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored === null ? SESSION_LIMIT : parseInt(stored, 10);
  } catch {
    return SESSION_LIMIT;
  }
}

function setRemainingUses(count) {
  try {
    sessionStorage.setItem(SESSION_KEY, String(count));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — the server-side
    // rate limit still applies, this is just a UX nicety.
  }
}

function renderSessionState() {
  const remaining = getRemainingUses();
  if (remaining <= 0) {
    sessionNote.textContent = "You've used all 5 free tries this session — refresh in a new tab to reset the counter.";
    submitBtn.disabled = true;
  } else {
    sessionNote.textContent = `${remaining} of ${SESSION_LIMIT} tries left this session.`;
    submitBtn.disabled = false;
  }
}

textarea.addEventListener("input", () => {
  charCount.textContent = `${textarea.value.length} / 300`;
});

function showError(message) {
  resultPanel.hidden = true;
  errorPanel.hidden = false;
  errorPanel.textContent = message;
}

function clearError() {
  errorPanel.hidden = true;
  errorPanel.textContent = "";
}

function renderResult(result) {
  clearError();

  document.getElementById("result-answer").textContent = result.answer;

  const sourceEl = document.getElementById("result-source");
  if (result.answerable && result.source) {
    sourceEl.textContent = `Source: ${result.source.docTitle} — ${result.source.sectionTitle}`;
    sourceEl.classList.remove("answer-source-empty");
  } else {
    sourceEl.textContent = "Source: not found in the provided documents";
    sourceEl.classList.add("answer-source-empty");
  }

  resultPanel.hidden = false;
  resultPanel.classList.remove("is-visible");
  // Force a reflow so the transition re-triggers even if the panel was
  // already unhidden a moment ago (e.g. two submissions in a row).
  void resultPanel.offsetWidth;
  resultPanel.classList.add("is-visible");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (getRemainingUses() <= 0) {
    return;
  }

  const question = textarea.value.trim();
  if (!question) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  submitBtn.setAttribute("aria-label", "Asking…");
  clearError();
  resultPanel.hidden = true;
  resultPanel.classList.remove("is-visible");

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || "Something went wrong. Try again.");
      return;
    }

    setRemainingUses(getRemainingUses() - 1);
    renderResult(data.result);
  } catch {
    showError("Couldn't reach the demo — check your connection and try again.");
  } finally {
    submitBtn.classList.remove("is-loading");
    submitBtn.removeAttribute("aria-label");
    renderSessionState();
  }
});

renderSessionState();
