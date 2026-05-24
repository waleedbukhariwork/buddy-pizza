package com.buddyfeast.controller;

import com.buddyfeast.dto.SubCategoryDTO;
import com.buddyfeast.entity.Category;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.service.SubCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryService subCategoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getActiveCategories() {
        return ResponseEntity.ok(
            categoryRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc()
        );
    }

    @GetMapping("/{categoryId}/subcategories")
    public ResponseEntity<List<SubCategoryDTO>> getSubCategories(@PathVariable Long categoryId) {
        return ResponseEntity.ok(subCategoryService.getByCategoryId(categoryId));
    }
}
