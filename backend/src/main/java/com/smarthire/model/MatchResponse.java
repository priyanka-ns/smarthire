package com.smarthire.model;

import java.util.List;

public record MatchResponse(List<CandidateResult> results, List<String> jdSkills) {

    public record CandidateResult(
            String name,
            int score,
            Integer years,
            List<String> matchedSkills,
            List<String> missingSkills,
            String summary,
            List<String> questions
    ) {}
}
