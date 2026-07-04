package com.careerpilot.question;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionGenerationService {

    private final AiService ai;
    private final InterviewQuestionRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        You are an expert technical interviewer for product-based companies.
        Respond ONLY with a JSON array. No markdown, no preamble.
        Each element: {"question": "...", "difficulty": "EASY|MEDIUM|HARD",
                       "idealAnswerOutline": "..."}
        """;

    @SneakyThrows
    public List<InterviewQuestion> generate(QuestionController.GenerateRequest req) {
        String userPrompt = """
            Candidate target role: %s
            Candidate skills: %s
            Generate %d %s interview questions calibrated to this profile.
            """.formatted(req.targetRole(), req.skills(), req.count(), req.category());

        // JD-targeted mode: focus questions on the gap between the candidate's
        // resume skills and what the job description actually demands.
        if (req.jobDescription() != null && !req.jobDescription().isBlank()) {
            userPrompt += """

                The candidate is applying to this job description:
                ---
                %s
                ---
                Prioritize questions that probe the GAP between the candidate's
                current skills and this job's requirements.
                """.formatted(req.jobDescription().substring(0,
                    Math.min(4000, req.jobDescription().length())));
        }

        String raw = ai.invoke(SYSTEM_PROMPT, userPrompt)
                .replaceAll("(?s)```json|```", "").trim();

        List<GeneratedQuestion> parsed =
                mapper.readValue(raw, new TypeReference<>() {});

        List<InterviewQuestion> questions = parsed.stream()
                .map(g -> InterviewQuestion.builder()
                        .userId(req.userId())
                        .category(req.category())
                        .question(g.question())
                        .difficulty(g.difficulty())
                        .idealAnswerOutline(g.idealAnswerOutline())
                        .createdAt(Instant.now())
                        .build())
                .toList();

        return repository.saveAll(questions);
    }

    record GeneratedQuestion(String question, String difficulty, String idealAnswerOutline) {}
}
