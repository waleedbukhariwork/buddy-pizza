package com.buddyfeast.repository;

import com.buddyfeast.entity.OtpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpRecord, Long> {

    Optional<OtpRecord> findTopByIdentifierAndUsedFalseOrderByCreatedAtDesc(String identifier);

    @Modifying
    @Query("DELETE FROM OtpRecord o WHERE o.identifier = :identifier")
    void deleteAllByIdentifier(String identifier);

    @Modifying
    @Query("DELETE FROM OtpRecord o WHERE o.expiresAt < :now")
    void deleteExpiredBefore(LocalDateTime now);
}
