package com.smarthire.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record MatchRequest(
        @NotBlank String jobDescription,
        @NotEmpty List<ResumeInput> resumes
) {
    public record ResumeInput(String name, @NotBlank String text) {}
}
