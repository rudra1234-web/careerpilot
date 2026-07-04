package com.careerpilot.user.saga;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * OUTBOX PATTERN
 * Problem it solves: "update the DB AND publish to Kafka" is two systems —
 * if the app crashes between them you get inconsistency (dual-write problem).
 * Solution: write the event to this table IN THE SAME DB TRANSACTION as the
 * business change. A separate publisher relays rows to Kafka afterwards.
 * At-least-once delivery -> consumers must be idempotent.
 */
@Entity
@Table(name = "outbox_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String aggregateId;   // e.g. userId
    private String topic;         // Kafka topic to publish to
    @Column(columnDefinition = "text")
    private String payload;       // JSON
    private boolean published;
    private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }
}
