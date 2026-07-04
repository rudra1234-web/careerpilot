package com.careerpilot.user.saga;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, String> {
    List<OutboxEvent> findTop50ByPublishedFalseOrderByCreatedAtAsc();
}
