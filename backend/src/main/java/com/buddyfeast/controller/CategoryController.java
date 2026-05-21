package com.buddyfeast.controller;

import com.buddyfeast.entity.Category;
import com.buddyfeast.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getActiveCategories() {
        return ResponseEntity.ok(
            categoryRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc()
        );
    }
}
