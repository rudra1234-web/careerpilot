package com.careerpilot.user;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String keycloakSub;          // subject from JWT

    private String fullName;
    private String email;
    private String targetRole;           // e.g. "Senior Software Architect"
    private String targetCompanyType;    // product / service
    private Integer yearsOfExperience;

    @Column(columnDefinition = "text")
    private String skills;               // comma-separated, extracted from resume

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist void onCreate() { createdAt = updatedAt = Instant.now(); }
    @PreUpdate  void onUpdate() { updatedAt = Instant.now(); }
}
