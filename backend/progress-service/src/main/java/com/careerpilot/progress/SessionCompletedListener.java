package com.careerpilot.progress;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.Map;

/**
 * Consumes session.completed events emitted by question-service after each
 * answered question. Maintains rolling weak-area scores that the Bedrock
 * Agent reads (via /api/progress/{userId}/weak-areas) to plan the roadmap.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionCompletedListener {

    private final WeakAreaRepository repository;

    @KafkaListener(topics = "session.completed")
    public void onSessionCompleted(Map<String, Object> event) {
        String userId = (String) event.get("userId");
        String tag = (String) event.get("weakAreaTag");
        String category = (String) event.get("category");
        double score = ((Number) event.get("score")).doubleValue();

        WeakArea area = repository.findByUserIdAndTag(userId, tag)
                .orElseGet(() -> WeakArea.builder()
                        .userId(userId).tag(tag).category(category)
                        .avgScore(score).attempts(0).build());

        double newAvg = (area.getAvgScore() * area.getAttempts() + score)
                        / (area.getAttempts() + 1);
        area.setAvgScore(newAvg);
        area.setAttempts(area.getAttempts() + 1);
        area.setLastAttemptAt(Instant.now());
        repository.save(area);

        log.info("Updated weak area {} for user {} -> avg {}", tag, userId, newAvg);
    }
}
