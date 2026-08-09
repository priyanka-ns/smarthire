// SmartHire — HireBot: floating guidance chatbot.
// Answers user doubts and walks them through uploading JD + resumes.
(function () {
  "use strict";

  const history = [];
  let panel, log, input, sendBtn;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // minimal markdown: **bold** and \u201c\u201d already literal
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  function addMsg(text, who) {
    const wrap = document.createElement("div");
    wrap.className = "hb-msg hb-" + who;
    wrap.innerHTML = `<div class="hb-bubble">${fmt(text)}</div>`;
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function typing(on) {
    let t = document.getElementById("hb-typing");
    if (on && !t) {
      t = document.createElement("div");
      t.id = "hb-typing";
      t.className = "hb-msg hb-bot";
      t.innerHTML = '<div class="hb-bubble hb-dots"><span></span><span></span><span></span></div>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) {
      t.remove();
    }
  }

  async function send(text) {
    const msg = (text || input.value).trim();
    if (!msg) return;
    input.value = "";
    addMsg(msg, "user");
    history.push({ role: "user", content: msg });
    typing(true);
    try {
      const { reply } = await window.SmartHireApi.chat(msg, history);
      typing(false);
      addMsg(reply, "bot");
      history.push({ role: "assistant", content: reply });
    } catch (e) {
      typing(false);
      addMsg("Sorry, I couldn't reach the assistant. In demo mode I still work \u2014 try asking about uploading resumes.", "bot");
    }
  }

  function toggle(open) {
    const show = open == null ? panel.classList.contains("d-none") : open;
    panel.classList.toggle("d-none", !show);
    if (show) input.focus();
  }

  function mount() {
    const root = document.createElement("div");
    root.id = "hirebot";
    root.innerHTML = `
      <button id="hb-launch" class="btn btn-primary rounded-circle shadow" title="Ask HireBot">
        <i class="bi bi-chat-dots-fill"></i>
      </button>
      <div id="hb-panel" class="card shadow-lg d-none">
        <div class="card-header d-flex align-items-center justify-content-between text-bg-primary">
          <span class="fw-semibold"><i class="bi bi-robot me-2"></i>HireBot</span>
          <button id="hb-close" class="btn btn-sm btn-close btn-close-white"></button>
        </div>
        <div id="hb-log" class="card-body"></div>
        <div class="hb-quick px-2 pb-2 d-flex flex-wrap gap-1">
          <button class="btn btn-sm btn-outline-secondary" data-q="How do I use this?">How to use?</button>
          <button class="btn btn-sm btn-outline-secondary" data-q="How do I upload a resume?">Upload resume</button>
          <button class="btn btn-sm btn-outline-secondary" data-q="How does the score work?">Scoring</button>
        </div>
        <div class="card-footer p-2">
          <div class="input-group">
            <input id="hb-input" class="form-control" placeholder="Ask a question...">
            <button id="hb-send" class="btn btn-primary"><i class="bi bi-send"></i></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);

    panel = document.getElementById("hb-panel");
    log = document.getElementById("hb-log");
    input = document.getElementById("hb-input");
    sendBtn = document.getElementById("hb-send");

    document.getElementById("hb-launch").addEventListener("click", () => toggle());
    document.getElementById("hb-close").addEventListener("click", () => toggle(false));
    sendBtn.addEventListener("click", () => send());
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    root.querySelectorAll(".hb-quick [data-q]").forEach((b) =>
      b.addEventListener("click", () => send(b.getAttribute("data-q")))
    );

    addMsg("Hi, I\u2019m HireBot \uD83D\uDC4B I\u2019ll guide you through screening candidates. Paste a job description, add resumes, then hit **Run screening**. New here? Ask me anything or tap a suggestion below.", "bot");
  }

  document.addEventListener("DOMContentLoaded", mount);
})();
