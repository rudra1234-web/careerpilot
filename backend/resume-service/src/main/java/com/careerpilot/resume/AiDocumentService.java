package com.careerpilot.resume;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Sends a resume (PDF or image) to the LLM provider's messages API and gets
 * back structured text + skills in a single call. The model reads documents
 * natively, so there is no separate OCR step and no cloud storage dependency
 * for local dev. Vendor-specific details stay inside this one class.
 */
@Service
public class AiDocumentService {

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public AiDocumentService(@Value("${ai.api-key}") String apiKey,
                             @Value("${ai.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.http = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .build();
    }

    public JsonNode extract(byte[] fileBytes, String contentType, String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "AI provider API key is not set. Set the ANTHROPIC_API_KEY environment " +
                "variable before starting resume-service.");
        }

        String mediaType = contentType == null ? "application/pdf" : contentType;
        String blockType = mediaType.startsWith("image/") ? "image" : "document";
        Map<String, Object> source = Map.of(
                "type", "base64",
                "media_type", mediaType,
                "data", Base64.getEncoder().encodeToString(fileBytes));

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 4000,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", blockType, "source", source),
                                Map.of("type", "text", "text", prompt)))));

        return http.post()
                .uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }
}
