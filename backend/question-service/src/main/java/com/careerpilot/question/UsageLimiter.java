package com.careerpilot.question;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Map;

/**
 * Per-user daily quota on question generation, backed by Redis so it stays
 * correct when question-service runs as N replicas (an in-memory counter
 * would give each instance its own quota). Keys expire automatically after
 * 48h; the date inside the key provides the actual daily rollover.
 */
@Component
public class UsageLimiter {

    private final int dailyLimit;
    private final StringRedisTemplate redis;

    public UsageLimiter(@Value("${usage.daily-generation-limit:25}") int dailyLimit,
                        StringRedisTemplate redis) {
        this.dailyLimit = dailyLimit;
        this.redis = redis;
    }

    private String key(String userId) {
        return "quota:gen:" + LocalDate.now() + ":" + userId;
    }

    public void checkAndCount(String userId) {
        String k = key(userId);
        Long used = redis.opsForValue().increment(k);
        if (used != null && used == 1L) {
            redis.expire(k, Duration.ofHours(48));
        }
        if (used != null && used > dailyLimit) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily question-generation limit reached (" + dailyLimit + "/day). Try again tomorrow.");
        }
    }

    public Map<String, Object> status(String userId) {
        String v = redis.opsForValue().get(key(userId));
        int used = v == null ? 0 : Integer.parseInt(v);
        return Map.of("limit", dailyLimit, "used", Math.min(used, dailyLimit),
                      "remaining", Math.max(0, dailyLimit - used));
    }
}
