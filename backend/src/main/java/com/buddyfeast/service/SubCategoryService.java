package com.buddyfeast.service;

import com.buddyfeast.dto.SubCategoryDTO;
import com.buddyfeast.entity.Category;
import com.buddyfeast.entity.SubCategory;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.repository.ProductRepository;
import com.buddyfeast.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubCategoryService {

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<SubCategoryDTO> getByCategoryId(Long categoryId) {
        return subCategoryRepository.findByCategoryIdAndIsActiveTrueOrderByDisplayOrderAscNameAsc(categoryId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long countProducts(Long subCategoryId) {
        return productRepository.countBySubCategoryId(subCategoryId);
    }

    private SubCategoryDTO toDTO(SubCategory sub) {
        return SubCategoryDTO.builder()
            .id(sub.getId())
            .name(sub.getName())
            .displayOrder(sub.getDisplayOrder())
            .isActive(sub.getIsActive())
            .categoryId(sub.getCategory() != null ? sub.getCategory().getId() : null)
            .categoryName(sub.getCategory() != null ? sub.getCategory().getName() : null)
            .productCount(productRepository.countBySubCategoryId(sub.getId()))
            .build();
    }

    public SubCategoryDTO create(Long categoryId, String name, Integer displayOrder) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        SubCategory saved = subCategoryRepository.save(SubCategory.builder()
            .name(name.trim())
            .displayOrder(displayOrder)
            .isActive(true)
            .category(category)
            .build());
        return toDTO(saved);
    }

    public SubCategoryDTO update(Long id, String name, Integer displayOrder, Boolean isActive) {
        SubCategory sub = subCategoryRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SubCategory not found"));
        if (name != null) sub.setName(name.trim());
        if (displayOrder != null) sub.setDisplayOrder(displayOrder);
        if (isActive != null) sub.setIsActive(isActive);
        return toDTO(subCategoryRepository.save(sub));
    }

    @Transactional
    public void delete(Long id) {
        subCategoryRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SubCategory not found"));
        // Clear the FK on any products before deleting
        productRepository.clearSubCategory(id);
        subCategoryRepository.deleteById(id);
    }
}
