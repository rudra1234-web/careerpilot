package com.careerpilot.resume;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final AiDocumentService ai;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${resume.storage-dir}")
    private String storageDir;

    private static final String PROMPT = """
        You are a resume parser. Read the attached resume and respond with ONLY
        a JSON object (no markdown fences, no other text) of this exact shape:
        {"extractedText": "<3-4 sentence professional summary of the candidate>",
         "detectedSkills": ["<technical skill>", ...]}
        Keep extractedText under 400 characters. detectedSkills must list concrete
        technical skills (languages, frameworks, databases, cloud, tools) actually
        present in the resume, lowercase, max 25 entries.
        """;

    public Map<String, Object> processResume(String userId, MultipartFile file) throws Exception {
        // 1. Store original locally (audit trail; S3 in cloud deployments).
        Path dir = Path.of(storageDir, userId);
        Files.createDirectories(dir);
        Path stored = dir.resolve(System.currentTimeMillis() + "-" + file.getOriginalFilename());
        Files.write(stored, file.getBytes());

        // 2. One AI call replaces OCR + keyword matching:
        //    native PDF/image reading plus semantic skill extraction.
        JsonNode response = ai.extract(file.getBytes(), file.getContentType(), PROMPT);
        StringBuilder textBlocks = new StringBuilder();
        response.path("content").forEach(block -> {
            if ("text".equals(block.path("type").asText())) {
                textBlocks.append(block.path("text").asText());
            }
        });
        String raw = textBlocks.toString().replaceAll("(?s)```json|```", "").trim();
        JsonNode parsed = mapper.readTree(raw);

        String text = parsed.path("extractedText").asText();
        List<String> skills = new ArrayList<>();
        parsed.path("detectedSkills").forEach(n -> skills.add(n.asText()));

        // SAGA "Start Prep Plan" - Step 1: kick off the choreography.
        kafkaTemplate.send("resume.parsed", userId, Map.of(
                "userId", userId,
                "skills", String.join(", ", skills)));

        return Map.of("storedAt", stored.toString(), "extractedText", text, "detectedSkills", skills);
    }
}