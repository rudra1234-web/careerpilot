package com.careerpilot.question;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

/**
 * Compound indexes match the three read paths (bank, history, category list)
 * so every query is an index scan instead of a full collection scan.
 */
@Document("interview_questions")
@CompoundIndexes({
    @CompoundIndex(name = "user_created", def = "{'userId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "user_answered", def = "{'userId': 1, 'answeredAt': -1}"),
    @CompoundIndex(name = "user_category", def = "{'userId': 1, 'category': 1}")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InterviewQuestion {
    @Id
    private String id;
    private String userId;
    private String category;      // DSA | SYSTEM_DESIGN | BEHAVIORAL | JAVA | SPRING | <resume skill>
    private String question;
    private String difficulty;    // EASY | MEDIUM | HARD
    private String idealAnswerOutline;
    private Instant createdAt;

    // --- Filled in once the user answers (practice history / review) ---
    private String userAnswer;
    private Integer score;
    private List<String> strengths;
    private List<String> gaps;
    private String improvedAnswer;
    private String weakAreaTag;
    private Instant answeredAt;
}
