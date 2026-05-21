package com.buddyfeast.controller;

import com.buddyfeast.dto.DashboardMetricsDTO;
import com.buddyfeast.dto.DealDTO;
import com.buddyfeast.dto.ProductDTO;
import com.buddyfeast.entity.Category;
import com.buddyfeast.entity.Deal;
import com.buddyfeast.entity.Order;
import com.buddyfeast.entity.Product;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.repository.OrderRepository;
import com.buddyfeast.repository.ProductRepository;
import com.buddyfeast.repository.RiderRepository;
import com.buddyfeast.service.AdminService;
import com.buddyfeast.service.DealService;
import com.buddyfeast.service.OrderService;
import com.buddyfeast.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    private ProductRepository productRepository;
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderService orderService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardMetrics());
    }
    
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody ProductDTO product) {
        return ResponseEntity.ok(productService.createProduct(product));
    }
    
    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody ProductDTO product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }
    
    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getActiveCategories() {
        return ResponseEntity.ok(categoryRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc());
    }
    
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        category.setId(null);
        category.setIsActive(category.getIsActive() != null ? category.getIsActive() : true);
        return ResponseEntity.ok(categoryRepository.save(category));
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
        riderRepository.findById(riderId).orElseThrow();
        return ResponseEntity.ok(orderService.assignRider(id, riderId));
    }

    @GetMapping("/deals")
    public ResponseEntity<List<DealDTO>> getAllDeals() {
        return ResponseEntity.ok(dealService.getAllDealsAdmin());
    }

    @PostMapping("/deals")
    public ResponseEntity<DealDTO> createDeal(@RequestBody Deal deal) {
        Deal created = dealService.createDeal(deal);
        return ResponseEntity.ok(dealService.getDealById(created.getId()));
    }

    @PutMapping("/deals/{id}")
    public ResponseEntity<DealDTO> updateDeal(@PathVariable Long id, @RequestBody Deal deal) {
        dealService.updateDeal(id, deal);
        return ResponseEntity.ok(dealService.getDealById(id));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<Void> deleteDeal(@PathVariable Long id) {
        dealService.deleteDeal(id);
        return ResponseEntity.ok().build();
    }
}
