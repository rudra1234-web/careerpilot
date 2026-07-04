package com.careerpilot.progress;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface WeakAreaRepository extends MongoRepository<WeakArea, String> {
    List<WeakArea> findByUserIdOrderByAvgScoreAsc(String userId);
    Optional<WeakArea> findByUserIdAndTag(String userId, String tag);
}
