package com.careerpilot.question;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Thin wrapper over the LLM provider's messages API.
 * The invoke(system, user) seam keeps the rest of the app vendor-agnostic:
 * swapping the underlying model provider is a one-class change.
 */
@Service
public class AiService {

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public AiService(@Value("${ai.api-key}") String apiKey,
                     @Value("${ai.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.http = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .build();
    }

    public String invoke(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "AI provider API key is not set. Set the ANTHROPIC_API_KEY environment " +
                "variable before starting question-service.");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1500,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );

        JsonNode response = http.post()
                .uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        StringBuilder text = new StringBuilder();
        response.path("content").forEach(block -> {
            if ("text".equals(block.path("type").asText())) {
                text.append(block.path("text").asText());
            }
        });
        return text.toString();
    }
}
