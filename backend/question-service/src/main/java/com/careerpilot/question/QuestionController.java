package com.careerpilot.question;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionGenerationService generationService;
    private final AnswerFeedbackService feedbackService;
    private final InterviewQuestionRepository repository;
    private final UsageLimiter usageLimiter;

    /**
     * Generate tailored questions from resume skills + target role.
     * Optionally targets the gap between the resume and a pasted job description.
     * Guarded by a per-user daily quota (429 when exhausted).
     */
    @PostMapping("/generate")
    public List<InterviewQuestion> generate(@RequestBody GenerateRequest request) {
        usageLimiter.checkAndCount(request.userId());
        return generationService.generate(request);
    }

    /** Evaluate a candidate answer and return structured feedback. */
    @PostMapping("/{questionId}/feedback")
    public Map<String, Object> feedback(@PathVariable String questionId,
                                        @RequestBody Map<String, String> body) {
        return feedbackService.evaluate(questionId, body.get("answer"));
    }

    @GetMapping
    public List<InterviewQuestion> list(@RequestParam String userId,
                                        @RequestParam(defaultValue = "DSA") String category) {
        return repository.findByUserIdAndCategory(userId, category);
    }

    /**
     * Practice history (server-side pagination): answered questions, newest
     * first. Paged responses keep payloads O(page) instead of O(user history).
     */
    @GetMapping("/history")
    public Page<InterviewQuestion> history(@RequestParam String userId,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "5") int size) {
        return repository.findByUserIdAndAnsweredAtNotNull(userId,
                PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "answeredAt")));
    }

    /** Question bank (server-side pagination): everything generated, newest first. */
    @GetMapping("/bank")
    public Page<InterviewQuestion> bank(@RequestParam String userId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "8") int size) {
        return repository.findByUserId(userId,
                PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    /** Remaining generation quota for today (for the UI). */
    @GetMapping("/quota")
    public Map<String, Object> quota(@RequestParam String userId) {
        return usageLimiter.status(userId);
    }

    public record GenerateRequest(String userId, String targetRole, String skills,
                                  String category, int count, String jobDescription) {}
}
