package com.careerpilot.user.saga;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Polling publisher: relays unpublished outbox rows to Kafka.
 * Production alternative: Debezium CDC on the outbox table (log-based,
 * lower latency, no polling) — great interview comparison to make.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void publishPending() {
        repository.findTop50ByPublishedFalseOrderByCreatedAtAsc().forEach(event -> {
            kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload());
            event.setPublished(true);
            repository.save(event);
            log.info("Outbox -> Kafka: topic={} aggregateId={}", event.getTopic(), event.getAggregateId());
        });
    }
}
