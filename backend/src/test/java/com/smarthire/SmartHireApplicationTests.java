package com.smarthire;

import com.smarthire.model.MatchRequest;
import com.smarthire.model.MatchResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Lightweight tests that don't require an API key or Spring context.
 * They verify the request/response records serialize as the frontend expects.
 */
class SmartHireApplicationTests {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void matchResponseRoundTrips() throws Exception {
        MatchResponse resp = new MatchResponse(
                List.of(new MatchResponse.CandidateResult(
                        "Aarav", 82, 5,
                        List.of("java", "spring"), List.of("kafka"),
                        "Strong fit.", List.of("Explain your Spring Boot layering."))),
                List.of("java", "spring", "kafka"));

        String json = mapper.writeValueAsString(resp);
        MatchResponse back = mapper.readValue(json, MatchResponse.class);

        assertEquals(1, back.results().size());
        assertEquals(82, back.results().get(0).score());
        assertTrue(back.jdSkills().contains("java"));
    }

    @Test
    void matchRequestDeserializes() throws Exception {
        String json = """
                {"jobDescription":"Java role","resumes":[{"name":"A","text":"Java dev"}]}
                """;
        MatchRequest req = mapper.readValue(json, MatchRequest.class);
        assertEquals("Java role", req.jobDescription());
        assertEquals(1, req.resumes().size());
        assertEquals("A", req.resumes().get(0).name());
    }
}
