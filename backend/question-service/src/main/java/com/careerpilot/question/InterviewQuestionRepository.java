package com.careerpilot.question;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InterviewQuestionRepository extends MongoRepository<InterviewQuestion, String> {
    List<InterviewQuestion> findByUserIdAndCategory(String userId, String category);

    /** Practice history (paged): only answered questions; sort via Pageable. */
    Page<InterviewQuestion> findByUserIdAndAnsweredAtNotNull(String userId, Pageable pageable);

    /** Question bank (paged): everything generated for this user. */
    Page<InterviewQuestion> findByUserId(String userId, Pageable pageable);
}
