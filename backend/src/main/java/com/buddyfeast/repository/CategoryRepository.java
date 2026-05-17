package com.buddyfeast.repository;

import com.buddyfeast.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsActiveTrueOrderByDisplayOrderAscNameAsc();
    Optional<Category> findByNameIgnoreCase(String name);
}
