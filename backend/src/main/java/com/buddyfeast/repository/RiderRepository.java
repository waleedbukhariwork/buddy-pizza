package com.buddyfeast.repository;

import com.buddyfeast.entity.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RiderRepository extends JpaRepository<Rider, Long> {
    Optional<Rider> findByRiderId(String riderId);
}
