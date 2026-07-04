package com.careerpilot.progress;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Exposed to the roadmap-planning agent as an Action Group.
 * The OpenAPI schema in aws/bedrock-agent/action-group-schema.json must
 * stay in sync with these endpoints.
 */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final WeakAreaRepository repository;
    private final AiSentimentService sentimentService;

    /** Agent action: read weakest areas, sorted worst-first. */
    @GetMapping("/{userId}/weak-areas")
    public List<WeakArea> weakAreas(@PathVariable String userId) {
        return repository.findByUserIdOrderByAvgScoreAsc(userId);
    }

    /** Confidence/tone signal on a written answer via the AI provider. */
    @PostMapping("/sentiment")
    public Map<String, Object> sentiment(@RequestBody Map<String, String> body) {
        return sentimentService.detectSentiment(body.get("text"));
    }
}
