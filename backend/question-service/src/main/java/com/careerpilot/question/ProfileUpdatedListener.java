package com.careerpilot.question;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;

/**
 * SAGA "Start Prep Plan" — Step 3 (question-service).
 * Consumes profile.updated, generates the initial question set via Bedrock.
 * On success -> questions.generated (saga completes).
 * On failure -> plan.failed (user-service compensates by reverting skills).
 *
 * Idempotency note: the Outbox gives at-least-once delivery, so this handler
 * may fire twice for the same event. A production version should keep a
 * processed-event-id store (e.g. Mongo collection keyed by eventId) and skip
 * duplicates — worth mentioning in interviews.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileUpdatedListener {

    private final QuestionGenerationService generationService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(topics = "profile.updated")
    @SneakyThrows
    public void onProfileUpdated(String payload) {
        Map<String, Object> event = mapper.readValue(payload, Map.class);
        String userId = (String) event.get("userId");

        try {
            var request = new QuestionController.GenerateRequest(
                    userId,
                    (String) event.getOrDefault("targetRole", "Senior Software Engineer"),
                    (String) event.get("skills"),
                    "DSA",
                    5,
                    null);
            var questions = generationService.generate(request);

            kafkaTemplate.send("questions.generated", userId, Map.of(
                    "userId", userId, "count", questions.size()));
            log.info("SAGA step 3 complete: {} questions generated for {}",
                    questions.size(), userId);

        } catch (Exception e) {
            // COMPENSATION EVENT — tells user-service to undo its step
            log.error("SAGA step 3 failed for {} -> emitting plan.failed", userId, e);
            kafkaTemplate.send("plan.failed", userId, Map.of(
                    "userId", userId,
                    "previousSkills", event.getOrDefault("previousSkills", ""),
                    "reason", e.getMessage() == null ? "generation error" : e.getMessage()));
        }
    }
}
