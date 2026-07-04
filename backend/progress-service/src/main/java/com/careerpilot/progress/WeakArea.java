package com.careerpilot.progress;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document("weak_areas")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class WeakArea {
    @Id
    private String id;
    private String userId;
    private String category;      // DSA | SYSTEM_DESIGN | BEHAVIORAL | JAVA | SPRING
    private String tag;           // e.g. "time-complexity", "kafka-partitioning"
    private double avgScore;      // rolling average 1-10
    private int attempts;
    private Instant lastAttemptAt;
}
