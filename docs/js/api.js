// SmartHire — API layer.
// If a backend URL is configured (window.SMARTHIRE_API or ?api= query param),
// calls the real Spring Boot backend. Otherwise falls back to demo mode
// (mock AI) so the public GitHub Pages site is fully clickable.
(function () {
  "use strict";

  function backendUrl() {
    const qs = new URLSearchParams(location.search).get("api");
    return (qs || window.SMARTHIRE_API || "").replace(/\/$/, "");
  }

  const usingBackend = () => !!backendUrl();

  async function postJson(path, body) {
    const res = await fetch(backendUrl() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Backend error " + res.status);
    return res.json();
  }

  async function match(jd, resumes) {
    if (usingBackend()) return postJson("/api/match", { jobDescription: jd, resumes });
    // demo mode — brief artificial delay so the spinner is visible
    await new Promise((r) => setTimeout(r, 500));
    return window.SmartHireDemo.demoMatch(jd, resumes);
  }

  async function chat(message, history) {
    if (usingBackend()) return postJson("/api/chat", { message, history });
    await new Promise((r) => setTimeout(r, 350));
    return { reply: window.SmartHireDemo.demoChat(message) };
  }

  window.SmartHireApi = { match, chat, usingBackend, backendUrl };
})();
