package com.smarthire.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthire.model.ChatRequest;
import com.smarthire.model.MatchRequest;
import com.smarthire.model.MatchResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Wraps the Anthropic Messages API for the two SmartHire use cases:
 * ranking candidates against a job description, and answering user
 * questions via the HireBot assistant.
 */
@Service
public class ClaudeService {

    private final ObjectMapper objectMapper;
    private AnthropicClient client;

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${smarthire.model:claude-opus-4-6}")
    private String model;

    public ClaudeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException(
                    "ANTHROPIC_API_KEY is not set. Provide it via the ANTHROPIC_API_KEY " +
                    "environment variable (see .env.example).");
        }
        this.client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
    }

    private static final String MATCH_SYSTEM = """
            You are an expert technical recruiter screening candidates against a job description.
            For each candidate, judge how well their resume evidences the required skills and seniority.
            Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape:
            {
              "jdSkills": ["skill", ...],
              "results": [
                {
                  "name": "candidate name",
                  "score": 0-100 integer fit score,
                  "years": integer years of experience or null,
                  "matchedSkills": ["..."],
                  "missingSkills": ["..."],
                  "summary": "one or two sentence verdict",
                  "questions": ["tailored interview question", ...]
                }
              ]
            }
            Sort results by score descending. Keep summaries concise and factual — do not invent
            experience the resume does not state.
            """;

    public MatchResponse match(MatchRequest req) {
        StringBuilder user = new StringBuilder();
        user.append("JOB DESCRIPTION:\n").append(req.jobDescription()).append("\n\n");
        int i = 1;
        for (MatchRequest.ResumeInput r : req.resumes()) {
            String name = StringUtils.hasText(r.name()) ? r.name() : "Candidate " + i;
            user.append("RESUME [").append(name).append("]:\n").append(r.text()).append("\n\n");
            i++;
        }

        MessageCreateParams params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(4096L)
                .system(MATCH_SYSTEM)
                .addUserMessage(user.toString())
                .build();

        String json = stripFences(textOf(client.messages().create(params)));
        try {
            return objectMapper.readValue(json, MatchResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse model response as JSON: " + e.getMessage(), e);
        }
    }

    private static final String CHAT_SYSTEM = """
            You are HireBot, a friendly assistant embedded in the SmartHire app.
            SmartHire lets a recruiter paste a job description, add candidate resumes,
            and get an AI-ranked shortlist with skill gaps and interview questions.
            Guide the user through: (1) pasting the job description on the left,
            (2) adding one or more resumes on the right (paste text or upload a .txt file),
            (3) clicking "Run screening" to see ranked candidates.
            Answer questions about how to use the app and about the results. Be concise and
            encouraging. If asked something unrelated to hiring or this app, gently steer back.
            """;

    public String chat(ChatRequest req) {
        MessageCreateParams.Builder builder = MessageCreateParams.builder()
                .model(model)
                .maxTokens(1024L)
                .system(CHAT_SYSTEM);

        if (req.history() != null) {
            for (ChatRequest.ChatMessage m : req.history()) {
                if ("assistant".equalsIgnoreCase(m.role())) {
                    builder.addAssistantMessage(m.content());
                } else {
                    builder.addUserMessage(m.content());
                }
            }
        }
        builder.addUserMessage(req.message());

        return textOf(client.messages().create(builder.build()));
    }

    private static String textOf(Message message) {
        return message.content().stream()
                .flatMap(block -> block.text().stream())
                .map(text -> text.text())
                .collect(Collectors.joining())
                .trim();
    }

    /** Remove ```json ... ``` fences if the model wrapped its JSON. */
    private static String stripFences(String s) {
        String t = s.trim();
        if (t.startsWith("```")) {
            int nl = t.indexOf('\n');
            if (nl > 0) t = t.substring(nl + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }
}
