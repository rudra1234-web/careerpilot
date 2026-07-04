package com.careerpilot.user.saga;

import com.careerpilot.user.UserProfile;
import com.careerpilot.user.UserProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

/**
 * SAGA "Start Prep Plan" — Step 2 (user-service).
 * Choreography saga: no central orchestrator; each service reacts to events
 * and emits the next one. Flow:
 *
 *   resume.parsed (resume-service)
 *     -> [this] update profile skills + outbox 'profile.updated'   <- SAME TX
 *       -> profile.updated -> question-service generates questions
 *         -> questions.generated  (success, saga complete)
 *         -> plan.failed          (compensation event on failure)
 *           -> [this] compensate: revert skills to previous value
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResumeParsedListener {

    private final UserProfileRepository profileRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(topics = "resume.parsed")
    @Transactional  // business update + outbox insert are atomic
    @SneakyThrows
    public void onResumeParsed(Map<String, Object> event) {
        // NOTE: producers publish Map payloads via JsonSerializer, so the
        // JsonDeserializer hands us a Map directly (a String parameter here
        // fails with MessageConversionException and silently drops events).
        String userId = (String) event.get("userId");
        String skills = (String) event.get("skills");

        if (userId == null || userId.isBlank()) {
            log.warn("resume.parsed event without userId - skipping (skills: {})",
                    skills == null ? "" : skills.substring(0, Math.min(40, skills.length())));
            return;
        }

        UserProfile profile = profileRepository.findByKeycloakSub(userId)
                .orElseGet(() -> UserProfile.builder().keycloakSub(userId).build());
        String previousSkills = profile.getSkills();
        profile.setSkills(skills);
        profileRepository.save(profile);

        outboxRepository.save(OutboxEvent.builder()
                .aggregateId(userId)
                .topic("profile.updated")
                .payload(mapper.writeValueAsString(Map.of(
                        "userId", userId,
                        "skills", skills,
                        "previousSkills", previousSkills == null ? "" : previousSkills,
                        "targetRole", "Senior Software Engineer")))
                .build());
        log.info("SAGA step 2: profile updated + profile.updated queued for {}", userId);
    }

    /** Compensation: question generation failed -> revert the skills change. */
    @KafkaListener(topics = "plan.failed")
    @Transactional
    @SneakyThrows
    public void onPlanFailed(Map<String, Object> event) {
        String userId = (String) event.get("userId");
        String previousSkills = (String) event.get("previousSkills");

        profileRepository.findByKeycloakSub(userId).ifPresent(profile -> {
            profile.setSkills(previousSkills);
            profileRepository.save(profile);
            log.warn("SAGA compensation: reverted skills for {} after plan.failed", userId);
        });
    }
}
