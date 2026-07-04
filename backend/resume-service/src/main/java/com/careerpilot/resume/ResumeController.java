package com.careerpilot.resume;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * Upload a resume (PDF/PNG/JPG): stored locally, parsed by the AI service,
     * skills flow to user-service via the resume.parsed SAGA event.
     */
    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam String userId,
                                      @RequestParam MultipartFile file) throws Exception {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "userId must not be blank - resume events need an owner");
        }
        return resumeService.processResume(userId, file);
    }
}