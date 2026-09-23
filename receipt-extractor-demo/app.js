const SESSION_LIMIT = 5;
const SESSION_KEY = "receiptExtractorUsesRemaining";

const form = document.getElementById("parse-form");
const textarea = document.getElementById("receipt-text");
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
  charCount.textContent = `${textarea.value.length} / 4000`;
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

  document.getElementById("result-vendor").textContent = result.vendor || "Not given";
  document.getElementById("result-date").textContent = result.date || "Not given";
  document.getElementById("result-total").textContent = result.total || "Not given";
  document.getElementById("result-invoice-number").textContent = result.invoiceNumber || "Not given";

  const lineItemsList = document.getElementById("result-line-items");
  lineItemsList.innerHTML = "";
  const lineItems = result.lineItems ?? [];
  if (lineItems.length === 0) {
    const li = document.createElement("li");
    li.className = "line-item line-item-empty";
    li.textContent = "Not given";
    lineItemsList.append(li);
  } else {
    for (const item of lineItems) {
      const li = document.createElement("li");
      li.className = "line-item";
      const description = document.createElement("span");
      description.className = "line-item-description";
      description.textContent = item.description;
      const amount = document.createElement("span");
      amount.className = "line-item-amount";
      amount.textContent = item.amount || "Not given";
      li.append(description, amount);
      lineItemsList.append(li);
    }
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

  const text = textarea.value.trim();
  if (!text) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  submitBtn.setAttribute("aria-label", "Extracting…");
  clearError();
  resultPanel.hidden = true;
  resultPanel.classList.remove("is-visible");

  try {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || "Something went wrong. Try again.");
      return;
    }

    setRemainingUses(getRemainingUses() - 1);
    renderResult(data.result);
  } catch {
    showError("Couldn't reach the extractor — check your connection and try again.");
  } finally {
    submitBtn.classList.remove("is-loading");
    submitBtn.removeAttribute("aria-label");
    renderSessionState();
  }
});

renderSessionState();
