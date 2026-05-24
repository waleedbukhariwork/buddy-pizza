package com.buddyfeast.repository;

import com.buddyfeast.entity.Product;
import com.buddyfeast.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByIsAvailableTrue();

    @Query("SELECT p FROM Product p WHERE COALESCE(p.deleted, false) = false")
    List<Product> findNotDeleted();

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND COALESCE(p.deleted, false) = false AND " +
           "(:q IS NULL OR :q = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchAvailable(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isAvailable = true AND COALESCE(p.deleted, false) = false AND p.category.id = :categoryId AND " +
           "(:q IS NULL OR :q = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Product> searchAvailableByCategory(@Param("q") String q, @Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND COALESCE(p.deleted, false) = false")
    long countByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.subCategory.id = :subCategoryId AND COALESCE(p.deleted, false) = false")
    long countBySubCategoryId(@Param("subCategoryId") Long subCategoryId);

    @Modifying
    @Query("UPDATE Product p SET p.subCategory = null WHERE p.subCategory.id = :subCategoryId")
    void clearSubCategory(@Param("subCategoryId") Long subCategoryId);
}
