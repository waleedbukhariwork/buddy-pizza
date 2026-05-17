package com.buddyfeast.repository;

import com.buddyfeast.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {
    List<Deal> findByIsActiveTrue();
}
