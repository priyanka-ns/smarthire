// SmartHire — demo-mode data & heuristic matcher.
// Used when no backend is configured (e.g. the public GitHub Pages demo),
// so the whole app is clickable without a Claude API key. When the Spring
// Boot backend is connected, real AI responses replace everything here.
(function () {
  "use strict";

  const SAMPLE_JD = `Senior Backend Engineer (Java / Spring Boot)

We are hiring a Senior Backend Engineer to build scalable REST APIs for our
recruitment platform. You will design services, own data models, and mentor
junior engineers.

Must have:
- 4+ years building backend services in Java
- Strong Spring Boot, Spring Data JPA, REST API design
- Relational databases (MySQL/PostgreSQL) and SQL tuning
- Experience with cloud deployment (AWS/GCP) and CI/CD
- Solid understanding of system design and concurrency

Nice to have:
- Kafka or other messaging systems
- Docker / Kubernetes
- Exposure to AI/LLM integration`;

  const SAMPLE_RESUMES = [
    {
      name: "Aarav Sharma",
      text: `Aarav Sharma — Backend Engineer
5 years experience. Java, Spring Boot, Spring Data JPA, REST APIs, MySQL,
PostgreSQL, query optimization. Deployed microservices on AWS with Jenkins
CI/CD and Docker. Led a team of 3. Built a Kafka-based event pipeline.`,
    },
    {
      name: "Neha Verma",
      text: `Neha Verma — Software Engineer
2 years experience. Java, Spring Boot basics, REST APIs, MySQL. Familiar with
Git and unit testing. Looking to grow into backend architecture. No cloud
deployment experience yet.`,
    },
    {
      name: "Rohan Iyer",
      text: `Rohan Iyer — Full-Stack Developer
6 years experience. Node.js, React, some Java. PostgreSQL, MongoDB. Strong
system design, built high-throughput APIs, Docker + Kubernetes on GCP, CI/CD.
Mentored juniors. Limited recent Spring Boot work.`,
    },
  ];

  // Very small keyword-based "matcher" — purely to make the demo feel real.
  // The production version uses the Claude API for semantic scoring.
  function tokenize(s) {
    return (s || "").toLowerCase().match(/[a-z+#.]+/g) || [];
  }

  const SKILL_LIBRARY = [
    "java", "spring", "boot", "jpa", "hibernate", "rest", "api", "mysql",
    "postgresql", "sql", "aws", "gcp", "azure", "ci/cd", "jenkins", "docker",
    "kubernetes", "kafka", "microservices", "system", "design", "concurrency",
    "node", "react", "mongodb", "git", "testing", "llm", "ai",
  ];

  function extractSkills(text) {
    const toks = new Set(tokenize(text));
    return SKILL_LIBRARY.filter((s) => toks.has(s.replace("/", "")) || toks.has(s));
  }

  function demoMatch(jd, resumes) {
    const jdSkills = extractSkills(jd);
    const jdSet = new Set(jdSkills);
    const results = resumes.map((r) => {
      const rSkills = extractSkills(r.text);
      const rSet = new Set(rSkills);
      const matched = jdSkills.filter((s) => rSet.has(s));
      const missing = jdSkills.filter((s) => !rSet.has(s));
      // crude years extraction
      const ym = (r.text.match(/(\d+)\s*year/i) || [])[1];
      const years = ym ? parseInt(ym, 10) : null;
      const base = jdSkills.length ? matched.length / jdSkills.length : 0;
      const expBoost = years ? Math.min(years / 6, 1) * 0.15 : 0;
      const score = Math.round(Math.min(base * 0.85 + expBoost, 1) * 100);
      return {
        name: r.name,
        score,
        years,
        matchedSkills: matched,
        missingSkills: missing,
        summary:
          score >= 75
            ? "Strong fit — covers most required skills and seniority."
            : score >= 50
            ? "Moderate fit — solid basics with a few notable gaps."
            : "Weak fit — several key requirements are not evidenced.",
        questions: buildQuestions(matched, missing),
      };
    });
    results.sort((a, b) => b.score - a.score);
    return { results, jdSkills };
  }

  function buildQuestions(matched, missing) {
    const qs = [];
    if (matched.includes("spring"))
      qs.push("Walk me through how you structure a Spring Boot service — controllers, services, repositories — and why.");
    if (matched.includes("system") || matched.includes("design"))
      qs.push("Describe a system you designed for scale. What were the bottlenecks and how did you address them?");
    if (missing.includes("kafka"))
      qs.push("You haven't listed messaging systems — how would you decouple services that need async communication?");
    if (missing.includes("aws") || missing.includes("gcp"))
      qs.push("How comfortable are you owning cloud deployment and CI/CD end to end?");
    qs.push("Tell me about a time you mentored a junior engineer through a hard problem.");
    return qs.slice(0, 4);
  }

  // Canned chatbot answers for demo mode (keyword-routed).
  function demoChat(message) {
    const m = (message || "").toLowerCase();
    if (/upload|resume|cv|file/.test(m))
      return "To add candidates: click **\u201cAdd Resume\u201d**, then either paste the resume text or upload a .txt/.pdf file. You can add several — SmartHire ranks them all against the JD. Try the **\u201cLoad sample data\u201d** button to see it instantly.";
    if (/job|jd|description|paste/.test(m))
      return "Paste the full **job description** in the left box (title, must-haves, nice-to-haves). The more detail, the better the skill extraction and scoring.";
    if (/score|match|rank|how.*work/.test(m))
      return "Each candidate gets a **fit score (0\u2013100)** based on how many required skills their resume evidences, weighted by seniority. You also get matched vs. missing skills and tailored interview questions.";
    if (/start|begin|how.*use|help|guide/.test(m))
      return "Here\u2019s the flow: **1)** paste the JD on the left, **2)** add one or more resumes on the right, **3)** hit **\u201cRun screening\u201d**. Want me to load sample data so you can see it now? Click **\u201cLoad sample data\u201d**.";
    if (/api|key|backend|real|live|deploy/.test(m))
      return "This public demo runs **client-side with mock AI** so it\u2019s clickable without an API key. Connect the Spring Boot backend (see the README) with a Claude API key and you get **real semantic matching** and AI answers here.";
    return "I\u2019m HireBot \uD83D\uDC4B \u2014 I can guide you through pasting a JD, uploading resumes, and reading the scores. Ask me things like \u201chow do I upload a resume?\u201d or click **\u201cLoad sample data\u201d** to explore.";
  }

  window.SmartHireDemo = { SAMPLE_JD, SAMPLE_RESUMES, demoMatch, demoChat };
})();
