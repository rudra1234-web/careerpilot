package com.careerpilot.progress;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sentiment/confidence analysis via the LLM provider's messages API.
 * The model judges interview-answer confidence rather than generic text
 * polarity. Vendor-specific details stay inside this one class.
 */
@Service
public class AiSentimentService {

    private static final String PROMPT = """
        Analyze the sentiment and confidence of this interview answer. Respond with
        ONLY a JSON object (no markdown fences) of this exact shape:
        {"sentiment": "<POSITIVE|NEGATIVE|NEUTRAL|MIXED>",
         "scores": {"positive": 0.0, "negative": 0.0, "neutral": 0.0, "mixed": 0.0}}
        The four scores must sum to 1.0.

        Answer to analyze:
        %s
        """;

    private final RestClient http;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String apiKey;
    private final String model;

    public AiSentimentService(@Value("${ai.api-key}") String apiKey,
                              @Value("${ai.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.http = RestClient.builder().baseUrl("https://api.anthropic.com").build();
    }

    public Map<String, Object> detectSentiment(String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "AI provider API key is not set. Set the ANTHROPIC_API_KEY environment " +
                "variable before starting progress-service.");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 300,
                "messages", List.of(Map.of("role", "user", "content", PROMPT.formatted(text))));

        JsonNode response = http.post()
                .uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        StringBuilder textBlocks = new StringBuilder();
        response.path("content").forEach(block -> {
            if ("text".equals(block.path("type").asText())) {
                textBlocks.append(block.path("text").asText());
            }
        });
        try {
            String raw = textBlocks.toString().replaceAll("(?s)```json|```", "").trim();
            JsonNode parsed = mapper.readTree(raw);
            return Map.of(
                    "sentiment", parsed.path("sentiment").asText(),
                    "scores", Map.of(
                            "positive", parsed.path("scores").path("positive").asDouble(),
                            "negative", parsed.path("scores").path("negative").asDouble(),
                            "neutral", parsed.path("scores").path("neutral").asDouble(),
                            "mixed", parsed.path("scores").path("mixed").asDouble()));
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse sentiment response", e);
        }
    }
}
