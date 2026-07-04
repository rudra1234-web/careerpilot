package com.careerpilot.question;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InterviewQuestionRepository extends MongoRepository<InterviewQuestion, String> {
    List<InterviewQuestion> findByUserIdAndCategory(String userId, String category);

    /** Practice history: only questions the user actually answered, newest first. */
    List<InterviewQuestion> findByUserIdAndAnsweredAtNotNullOrderByAnsweredAtDesc(String userId);

    /** Question bank: everything generated for this user, newest first. */
    List<InterviewQuestion> findByUserIdOrderByCreatedAtDesc(String userId);
}
