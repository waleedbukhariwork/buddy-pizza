package com.buddyfeast.repository;

import com.buddyfeast.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {
    @Query("SELECT d FROM Deal d WHERE d.isActive = true AND COALESCE(d.deleted, false) = false")
    List<Deal> findActiveNotDeleted();

    @Query("SELECT d FROM Deal d WHERE COALESCE(d.deleted, false) = false")
    List<Deal> findNotDeleted();
}
