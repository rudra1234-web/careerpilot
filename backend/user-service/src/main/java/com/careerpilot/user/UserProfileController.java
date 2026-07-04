package com.careerpilot.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileRepository repository;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> me(@AuthenticationPrincipal Jwt jwt) {
        return repository.findByKeycloakSub(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Called by the SPA right after login. Creates the profile row on first
     * login (so the name chosen at signup is persisted) and keeps name/email
     * in sync with Keycloak afterwards. Identity comes from the verified JWT
     * only — never from the request body — and resume-extracted skills are
     * deliberately left untouched.
     */
    @PostMapping("/sync")
    public UserProfile sync(@AuthenticationPrincipal Jwt jwt) {
        UserProfile profile = repository.findByKeycloakSub(jwt.getSubject())
                .orElseGet(() -> UserProfile.builder().keycloakSub(jwt.getSubject()).build());
        String name = jwt.getClaimAsString("name");
        profile.setFullName(name != null && !name.isBlank()
                ? name : jwt.getClaimAsString("preferred_username"));
        profile.setEmail(jwt.getClaimAsString("email"));
        return repository.save(profile);
    }

    @PutMapping("/me")
    public UserProfile upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody UserProfile incoming) {
        UserProfile profile = repository.findByKeycloakSub(jwt.getSubject())
                .orElseGet(() -> UserProfile.builder().keycloakSub(jwt.getSubject()).build());
        profile.setFullName(incoming.getFullName());
        profile.setEmail(incoming.getEmail());
        profile.setTargetRole(incoming.getTargetRole());
        profile.setTargetCompanyType(incoming.getTargetCompanyType());
        profile.setYearsOfExperience(incoming.getYearsOfExperience());
        profile.setSkills(incoming.getSkills());
        return repository.save(profile);
    }
}
