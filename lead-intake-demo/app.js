const SESSION_LIMIT = 5;
const SESSION_KEY = "leadIntakeUsesRemaining";

const form = document.getElementById("intake-form");
const textarea = document.getElementById("inquiry");
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

const CATEGORY_LABELS = {
  new_business: "New business",
  support_request: "Support request",
  vendor_pitch: "Vendor pitch",
  job_inquiry: "Job inquiry",
  spam: "Spam",
  other: "Other",
};

function renderResult(result) {
  clearError();

  const categoryEl = document.getElementById("result-category");
  categoryEl.textContent = CATEGORY_LABELS[result.category] ?? result.category;
  categoryEl.className = `badge badge-${result.category}`;

  const urgencyEl = document.getElementById("result-urgency");
  urgencyEl.textContent = result.urgency;
  urgencyEl.className = `badge badge-urgency-${result.urgency}`;

  document.getElementById("result-summary").textContent = result.summary;

  const contact = result.contact ?? {};
  const contactList = document.getElementById("result-contact");
  contactList.innerHTML = "";
  const fields = [
    ["Name", contact.name],
    ["Email", contact.email],
    ["Phone", contact.phone],
    ["Company", contact.company],
  ];
  for (const [label, value] of fields) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value || "Not given";
    contactList.append(dt, dd);
  }

  resultPanel.hidden = false;
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
  submitBtn.textContent = "Classifying…";
  clearError();
  resultPanel.hidden = true;

  try {
    const response = await fetch("/api/classify", {
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
    showError("Couldn't reach the classifier — check your connection and try again.");
  } finally {
    submitBtn.textContent = "Classify inquiry";
    renderSessionState();
  }
});

renderSessionState();
