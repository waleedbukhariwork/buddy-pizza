package com.buddyfeast.repository;

import com.buddyfeast.entity.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    List<SubCategory> findByCategoryIdAndIsActiveTrueOrderByDisplayOrderAscNameAsc(Long categoryId);
}
