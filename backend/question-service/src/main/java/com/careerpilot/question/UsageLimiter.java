package com.careerpilot.question;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Per-user daily quota on question generation - protects the AI API bill and
 * forms the basis of a free/paid pricing tier. In-memory is sufficient for a
 * single instance; move the counter to Redis/Mongo when scaling out.
 */
@Component
public class UsageLimiter {

    private final int dailyLimit;
    private final Map<String, AtomicInteger> counts = new ConcurrentHashMap<>();
    private volatile LocalDate day = LocalDate.now();

    public UsageLimiter(@Value("${usage.daily-generation-limit:25}") int dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public synchronized void checkAndCount(String userId) {
        rollDayIfNeeded();
        AtomicInteger n = counts.computeIfAbsent(userId, k -> new AtomicInteger());
        if (n.get() >= dailyLimit) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily question-generation limit reached (" + dailyLimit + "/day). Try again tomorrow.");
        }
        n.incrementAndGet();
    }

    public Map<String, Object> status(String userId) {
        rollDayIfNeeded();
        int used = counts.getOrDefault(userId, new AtomicInteger()).get();
        return Map.of("limit", dailyLimit, "used", used, "remaining", Math.max(0, dailyLimit - used));
    }

    private void rollDayIfNeeded() {
        LocalDate today = LocalDate.now();
        if (!today.equals(day)) {
            counts.clear();
            day = today;
        }
    }
}
