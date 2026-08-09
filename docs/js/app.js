// SmartHire — main UI logic (JD input, resume management, screening results).
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  let resumes = []; // { name, text }

  function renderResumes() {
    const wrap = $("resumeList");
    if (!resumes.length) {
      wrap.innerHTML = '<div class="text-muted small text-center py-3">No resumes added yet. Click \u201cAdd Resume\u201d or \u201cLoad sample data\u201d.</div>';
      return;
    }
    wrap.innerHTML = resumes
      .map(
        (r, i) => `
      <div class="d-flex align-items-start justify-content-between border rounded p-2 mb-2 bg-white">
        <div class="me-2">
          <div class="fw-semibold">${esc(r.name)}</div>
          <div class="text-muted small text-truncate" style="max-width: 260px;">${esc(r.text.slice(0, 90))}\u2026</div>
        </div>
        <button class="btn btn-sm btn-outline-danger" data-remove="${i}"><i class="bi bi-trash"></i></button>
      </div>`
      )
      .join("");
  }

  function scoreClass(s) {
    return s >= 75 ? "success" : s >= 50 ? "warning" : "danger";
  }

  function renderResults(data) {
    const { results } = data;
    const el = $("results");
    if (!results.length) {
      el.innerHTML = '<div class="text-muted text-center py-5">No candidates to score.</div>';
      return;
    }
    el.innerHTML = results
      .map((r, i) => {
        const cls = scoreClass(r.score);
        const matched = (r.matchedSkills || [])
          .map((s) => `<span class="badge text-bg-success-subtle text-success-emphasis me-1 mb-1">${esc(s)}</span>`)
          .join("");
        const missing = (r.missingSkills || [])
          .map((s) => `<span class="badge text-bg-danger-subtle text-danger-emphasis me-1 mb-1">${esc(s)}</span>`)
          .join("");
        const qs = (r.questions || [])
          .map((q) => `<li>${esc(q)}</li>`)
          .join("");
        return `
        <div class="card mb-3 result-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="mb-0">${i === 0 ? '<i class="bi bi-trophy-fill text-warning me-1"></i>' : ""}${esc(r.name)}
                ${r.years ? `<span class="text-muted fw-normal small">\u00b7 ${esc(r.years)} yrs</span>` : ""}</h5>
              <span class="badge fs-6 text-bg-${cls}">${r.score}<span class="fs-6">/100</span></span>
            </div>
            <div class="progress mb-3" style="height:6px;">
              <div class="progress-bar bg-${cls}" style="width:${r.score}%"></div>
            </div>
            <p class="mb-2">${esc(r.summary || "")}</p>
            ${matched ? `<div class="small text-muted mb-1">Matched skills</div><div class="mb-2">${matched}</div>` : ""}
            ${missing ? `<div class="small text-muted mb-1">Gaps</div><div class="mb-2">${missing}</div>` : ""}
            ${qs ? `<details><summary class="fw-semibold text-primary">Suggested interview questions</summary><ul class="mt-2 mb-0">${qs}</ul></details>` : ""}
          </div>
        </div>`;
      })
      .join("");
  }

  // Resume add modal
  let resumeModal;
  function openAddResume() {
    $("resName").value = "";
    $("resText").value = "";
    resumeModal.show();
  }

  async function readFile(file) {
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.readAsText(file);
    });
  }

  function setBusy(on) {
    $("runBtn").disabled = on;
    $("runBtn").innerHTML = on
      ? '<span class="spinner-border spinner-border-sm me-1"></span>Screening\u2026'
      : '<i class="bi bi-magic me-1"></i>Run screening';
  }

  async function run() {
    const jd = $("jd").value.trim();
    if (!jd) return alert("Paste a job description first.");
    if (!resumes.length) return alert("Add at least one resume.");
    setBusy(true);
    try {
      const data = await window.SmartHireApi.match(jd, resumes);
      renderResults(data);
      $("resultsWrap").classList.remove("d-none");
      $("results").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      alert("Screening failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    const d = window.SmartHireDemo;
    $("jd").value = d.SAMPLE_JD;
    resumes = d.SAMPLE_RESUMES.map((r) => ({ ...r }));
    renderResumes();
  }

  function init() {
    resumeModal = new bootstrap.Modal($("resumeModal"));
    renderResumes();

    // banner: demo vs connected
    const banner = $("modeBanner");
    if (window.SmartHireApi.usingBackend()) {
      banner.className = "alert alert-success py-2 small mb-3";
      banner.innerHTML = '<i class="bi bi-plug-fill me-1"></i>Connected to backend \u2014 using real AI matching.';
    } else {
      banner.className = "alert alert-info py-2 small mb-3";
      banner.innerHTML = '<i class="bi bi-info-circle me-1"></i><strong>Demo mode</strong> \u2014 running client-side with mock AI so you can explore without a backend. Connect the Spring Boot API (see README) for real Claude-powered matching.';
    }

    $("addResumeBtn").addEventListener("click", openAddResume);
    $("sampleBtn").addEventListener("click", loadSample);
    $("runBtn").addEventListener("click", run);

    $("saveResumeBtn").addEventListener("click", async () => {
      const file = $("resFile").files[0];
      let text = $("resText").value.trim();
      let name = $("resName").value.trim();
      if (file && !text) text = await readFile(file);
      if (file && !name) name = file.name.replace(/\.[^.]+$/, "");
      if (!text) return alert("Paste resume text or choose a file.");
      resumes.push({ name: name || "Candidate " + (resumes.length + 1), text });
      $("resFile").value = "";
      renderResumes();
      resumeModal.hide();
    });

    $("resumeList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-remove]");
      if (b) {
        resumes.splice(Number(b.getAttribute("data-remove")), 1);
        renderResumes();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
