package com.buddyfeast.repository;

import com.buddyfeast.entity.Product;
import com.buddyfeast.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByIsAvailableTrue();

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND " +
           "(:q IS NULL OR :q = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchAvailable(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND p.category.id = :categoryId AND " +
           "(:q IS NULL OR :q = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchAvailableByCategory(@Param("q") String q, @Param("categoryId") Long categoryId, Pageable pageable);
}
