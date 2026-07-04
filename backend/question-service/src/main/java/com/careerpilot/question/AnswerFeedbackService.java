package com.careerpilot.question;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnswerFeedbackService {

    private final AiService ai;
    private final InterviewQuestionRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        You are a strict but constructive interview coach.
        Respond ONLY with JSON:
        {"score": 1-10, "strengths": ["..."], "gaps": ["..."],
         "improvedAnswer": "...", "weakAreaTag": "one short tag e.g. 'time-complexity'"}
        """;

    @SneakyThrows
    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluate(String questionId, String candidateAnswer) {
        InterviewQuestion q = repository.findById(questionId).orElseThrow();

        String userPrompt = """
            Question: %s
            Ideal answer outline: %s
            Candidate answer: %s
            Evaluate the candidate answer.
            """.formatted(q.getQuestion(), q.getIdealAnswerOutline(), candidateAnswer);

        String raw = ai.invoke(SYSTEM_PROMPT, userPrompt)
                .replaceAll("(?s)```json|```", "").trim();
        Map<String, Object> feedback = mapper.readValue(raw, new TypeReference<>() {});

        // Persist answer + feedback on the question document so the user can
        // revisit the full Q&A (their answer, score, gaps, improved answer)
        // from the roadmap's practice-history view.
        q.setUserAnswer(candidateAnswer);
        q.setScore(((Number) feedback.getOrDefault("score", 0)).intValue());
        q.setStrengths((List<String>) feedback.getOrDefault("strengths", List.of()));
        q.setGaps((List<String>) feedback.getOrDefault("gaps", List.of()));
        q.setImprovedAnswer((String) feedback.getOrDefault("improvedAnswer", ""));
        q.setWeakAreaTag((String) feedback.getOrDefault("weakAreaTag", ""));
        q.setAnsweredAt(Instant.now());
        repository.save(q);

        // Event-driven hook: progress-service consumes this to update weak areas,
        // which the roadmap agent later reads to re-plan the roadmap.
        kafkaTemplate.send("session.completed", q.getUserId(), Map.of(
                "userId", q.getUserId(),
                "questionId", questionId,
                "category", q.getCategory(),
                "score", feedback.get("score"),
                "weakAreaTag", feedback.get("weakAreaTag")
        ));

        return feedback;
    }
}
