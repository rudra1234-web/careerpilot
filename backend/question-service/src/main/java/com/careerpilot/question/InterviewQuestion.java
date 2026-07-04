package com.careerpilot.question;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document("interview_questions")
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
