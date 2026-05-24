package com.buddyfeast.controller;

import com.buddyfeast.dto.AdminProfileDTO;
import com.buddyfeast.dto.CategoryRequest;
import com.buddyfeast.dto.DashboardMetricsDTO;
import com.buddyfeast.dto.DealDTO;
import com.buddyfeast.dto.ProductDTO;
import com.buddyfeast.dto.SubCategoryDTO;
import com.buddyfeast.dto.SubCategoryRequest;
import com.buddyfeast.dto.UpdateAdminPasswordRequest;
import com.buddyfeast.dto.UpdateAdminProfileRequest;
import com.buddyfeast.entity.Category;
import com.buddyfeast.entity.Deal;
import com.buddyfeast.entity.Order;
import com.buddyfeast.entity.Product;
import com.buddyfeast.entity.SubCategory;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.repository.OrderRepository;
import com.buddyfeast.repository.RiderRepository;
import com.buddyfeast.service.AdminService;
import com.buddyfeast.service.DealService;
import com.buddyfeast.service.OrderService;
import com.buddyfeast.service.ProductService;
import com.buddyfeast.service.SubCategoryService;
import com.buddyfeast.exception.AppException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/admin")
public class AdminController {
    
    @Autowired
    private AdminService adminService;

    @Autowired
    private DealService dealService;

    @Autowired
    private ProductService productService;
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private SubCategoryService subCategoryService;

    @GetMapping("/profile")
    public ResponseEntity<AdminProfileDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(adminService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<AdminProfileDTO> updateProfile(
            Authentication authentication,
            @RequestBody UpdateAdminProfileRequest request) {
        return ResponseEntity.ok(adminService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
            Authentication authentication,
            @RequestBody UpdateAdminPasswordRequest request) {
        adminService.updatePassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardMetrics());
    }
    
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductDTO product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDTO product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }
    
    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAllByOrderByDisplayOrderAscNameAsc());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CategoryRequest req) {
        Category category = Category.builder()
            .name(req.getName() != null ? req.getName().trim() : "")
            .icon(req.getIcon())
            .displayOrder(req.getDisplayOrder())
            .isActive(req.getIsActive() != null ? req.getIsActive() : true)
            .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryRepository.save(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody CategoryRequest req) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        if (req.getName() != null) category.setName(req.getName().trim());
        if (req.getIcon() != null) category.setIcon(req.getIcon());
        if (req.getDisplayOrder() != null) category.setDisplayOrder(req.getDisplayOrder());
        if (req.getIsActive() != null) category.setIsActive(req.getIsActive());
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        long productCount = productService.countByCategory(id);
        if (productCount > 0) {
            throw new AppException(HttpStatus.CONFLICT,
                "Cannot delete category with " + productCount + " product(s). Remove or reassign them first.");
        }
        categoryRepository.delete(category);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }
    
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long id, 
        @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/orders/{id}/assign-rider")
    public ResponseEntity<Order> assignRider(
        @PathVariable Long id,
        @RequestParam Long riderId) {
        riderRepository.findById(riderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rider not found"));
        return ResponseEntity.ok(orderService.assignRider(id, riderId));
    }

    @GetMapping("/subcategories")
    public ResponseEntity<List<SubCategoryDTO>> getSubCategories(@RequestParam Long categoryId) {
        return ResponseEntity.ok(subCategoryService.getByCategoryId(categoryId));
    }

    @PostMapping("/subcategories")
    public ResponseEntity<SubCategoryDTO> createSubCategory(@RequestBody SubCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subCategoryService.create(req.getCategoryId(), req.getName(), req.getDisplayOrder()));
    }

    @PutMapping("/subcategories/{id}")
    public ResponseEntity<SubCategoryDTO> updateSubCategory(@PathVariable Long id, @RequestBody SubCategoryRequest req) {
        return ResponseEntity.ok(subCategoryService.update(id, req.getName(), req.getDisplayOrder(), req.getIsActive()));
    }

    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<Void> deleteSubCategory(@PathVariable Long id) {
        subCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/deals")
    public ResponseEntity<List<DealDTO>> getAllDeals() {
        return ResponseEntity.ok(dealService.getAllDealsAdmin());
    }

    @PostMapping("/deals")
    public ResponseEntity<DealDTO> createDeal(@Valid @RequestBody Deal deal) {
        Deal created = dealService.createDeal(deal);
        return ResponseEntity.status(HttpStatus.CREATED).body(dealService.getDealById(created.getId()));
    }

    @PutMapping("/deals/{id}")
    public ResponseEntity<DealDTO> updateDeal(@PathVariable Long id, @Valid @RequestBody Deal deal) {
        dealService.updateDeal(id, deal);
        return ResponseEntity.ok(dealService.getDealById(id));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<Void> deleteDeal(@PathVariable Long id) {
        dealService.deleteDeal(id);
        return ResponseEntity.noContent().build();
    }
}
