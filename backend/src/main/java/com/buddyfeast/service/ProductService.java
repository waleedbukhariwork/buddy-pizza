package com.buddyfeast.service;

import com.buddyfeast.dto.ProductDTO;
import com.buddyfeast.entity.Category;
import com.buddyfeast.entity.Product;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public ProductDTO getProductById(Long id) {
        return productRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new RuntimeException("Product not found"));
    }
    
    public Product createProduct(ProductDTO productDetails) {
        Product product = Product.builder()
            .name(productDetails.getName())
            .description(productDetails.getDescription())
            .price(productDetails.getPrice())
            .category(resolveCategory(productDetails))
            .isAvailable(productDetails.getIsAvailable() != null ? productDetails.getIsAvailable() : true)
            .isHot(productDetails.getIsHot() != null ? productDetails.getIsHot() : false)
            .hasSizes(productDetails.getHasSizes() != null ? productDetails.getHasSizes() : false)
            .build();
        
        return productRepository.save(product);
    }
    
    public Product updateProduct(Long id, ProductDTO productDetails) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setIsAvailable(productDetails.getIsAvailable());
        product.setIsHot(productDetails.getIsHot());
        product.setHasSizes(productDetails.getHasSizes());
        product.setCategory(resolveCategory(productDetails));
        
        return productRepository.save(product);
    }
    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    private ProductDTO convertToDTO(Product product) {
        return ProductDTO.builder()
            .id(product.getId())
            .name(product.getName())
            .description(product.getDescription())
            .price(product.getPrice())
            .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
            .category(product.getCategory() != null ? product.getCategory().getName() : "")
            .isAvailable(product.getIsAvailable())
            .isHot(product.getIsHot())
            .hasSizes(product.getHasSizes())
            .build();
    }
    
    private Category resolveCategory(ProductDTO productDetails) {
        if (productDetails.getCategoryId() != null) {
            return categoryRepository.findById(productDetails.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        }
        
        if (productDetails.getCategory() != null && !productDetails.getCategory().isBlank()) {
            return categoryRepository.findByNameIgnoreCase(productDetails.getCategory().trim())
                .orElseGet(() -> categoryRepository.save(Category.builder()
                    .name(productDetails.getCategory().trim())
                    .isActive(true)
                    .build()));
        }
        
        throw new RuntimeException("Category is required");
    }
}
