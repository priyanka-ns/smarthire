package com.smarthire.controller;

import com.smarthire.model.ChatRequest;
import com.smarthire.model.ChatResponse;
import com.smarthire.model.MatchRequest;
import com.smarthire.model.MatchResponse;
import com.smarthire.service.ClaudeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ScreeningController {

    private final ClaudeService claude;

    public ScreeningController(ClaudeService claude) {
        this.claude = claude;
    }

    @PostMapping("/match")
    public MatchResponse match(@Valid @RequestBody MatchRequest request) {
        return claude.match(request);
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return new ChatResponse(claude.chat(request));
    }
}
