package com.buddyfeast.repository;

import com.buddyfeast.entity.Product;
import com.buddyfeast.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByIsAvailableTrue();
}
