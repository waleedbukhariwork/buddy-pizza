package com.buddyfeast.service;

import com.buddyfeast.dto.PageResponse;
import com.buddyfeast.dto.ProductDTO;
import com.buddyfeast.entity.Category;
import com.buddyfeast.exception.AppException;
import org.springframework.http.HttpStatus;
import com.buddyfeast.entity.Product;
import com.buddyfeast.entity.SubCategory;
import com.buddyfeast.repository.CategoryRepository;
import com.buddyfeast.repository.ProductRepository;
import com.buddyfeast.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    public List<ProductDTO> getAllProducts() {
        return productRepository.findNotDeleted()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        return productRepository.findById(id)
            .filter(p -> !Boolean.TRUE.equals(p.getDeleted()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_QUERY_LENGTH = 200;

    public PageResponse<ProductDTO> searchProducts(String q, Long categoryId, int page, int size) {
        String safeQ = (q == null ? "" : q).strip();
        if (safeQ.length() > MAX_QUERY_LENGTH) safeQ = safeQ.substring(0, MAX_QUERY_LENGTH);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(page, safeSize, Sort.by("name").ascending());
        Page<Product> results = categoryId != null
                ? productRepository.searchAvailableByCategory(safeQ, categoryId, pageable)
                : productRepository.searchAvailable(safeQ, pageable);
        return PageResponse.of(results.map(this::convertToDTO));
    }

    public Product createProduct(ProductDTO productDetails) {
        Product product = Product.builder()
            .name(productDetails.getName())
            .description(productDetails.getDescription())
            .price(productDetails.getPrice())
            .imageUrl(productDetails.getImageUrl())
            .priceSmall(productDetails.getPriceSmall())
            .priceMedium(productDetails.getPriceMedium())
            .priceLarge(productDetails.getPriceLarge())
            .labelSmall(productDetails.getLabelSmall())
            .labelMedium(productDetails.getLabelMedium())
            .labelLarge(productDetails.getLabelLarge())
            .discountPct(productDetails.getDiscountPct())
            .discountAmount(productDetails.getDiscountAmount())
            .sizesJson(productDetails.getSizesJson())
            .category(resolveCategory(productDetails))
            .subCategory(resolveSubCategory(productDetails))
            .isAvailable(productDetails.getIsAvailable() != null ? productDetails.getIsAvailable() : true)
            .isHot(productDetails.getIsHot() != null ? productDetails.getIsHot() : false)
            .hasSizes(productDetails.getHasSizes() != null ? productDetails.getHasSizes() : false)
            .build();

        return productRepository.save(product);
    }

    public Product updateProduct(Long id, ProductDTO productDetails) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));

        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setImageUrl(productDetails.getImageUrl());
        product.setPriceSmall(productDetails.getPriceSmall());
        product.setPriceMedium(productDetails.getPriceMedium());
        product.setPriceLarge(productDetails.getPriceLarge());
        product.setLabelSmall(productDetails.getLabelSmall());
        product.setLabelMedium(productDetails.getLabelMedium());
        product.setLabelLarge(productDetails.getLabelLarge());
        product.setDiscountPct(productDetails.getDiscountPct());
        product.setDiscountAmount(productDetails.getDiscountAmount());
        product.setSizesJson(productDetails.getSizesJson());
        product.setIsAvailable(productDetails.getIsAvailable());
        product.setIsHot(productDetails.getIsHot());
        product.setHasSizes(productDetails.getHasSizes());
        product.setCategory(resolveCategory(productDetails));
        product.setSubCategory(resolveSubCategory(productDetails));

        return productRepository.save(product);
    }

    public long countByCategory(Long categoryId) {
        return productRepository.countByCategoryId(categoryId);
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (Boolean.TRUE.equals(product.getDeleted())) return;
        product.setDeleted(true);
        productRepository.save(product);
    }

    private ProductDTO convertToDTO(Product product) {
        SubCategory sub = product.getSubCategory();
        return ProductDTO.builder()
            .id(product.getId())
            .name(product.getName())
            .description(product.getDescription())
            .price(product.getPrice())
            .imageUrl(product.getImageUrl())
            .priceSmall(product.getPriceSmall())
            .priceMedium(product.getPriceMedium())
            .priceLarge(product.getPriceLarge())
            .labelSmall(product.getLabelSmall())
            .labelMedium(product.getLabelMedium())
            .labelLarge(product.getLabelLarge())
            .discountPct(product.getDiscountPct())
            .discountAmount(product.getDiscountAmount())
            .sizesJson(product.getSizesJson())
            .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
            .category(product.getCategory() != null ? product.getCategory().getName() : "")
            .subCategoryId(sub != null ? sub.getId() : null)
            .subCategoryName(sub != null ? sub.getName() : null)
            .isAvailable(product.getIsAvailable())
            .isHot(product.getIsHot())
            .hasSizes(product.getHasSizes())
            .build();
    }

    private Category resolveCategory(ProductDTO productDetails) {
        if (productDetails.getCategoryId() != null) {
            return categoryRepository.findById(productDetails.getCategoryId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        }

        if (productDetails.getCategory() != null && !productDetails.getCategory().isBlank()) {
            return categoryRepository.findByNameIgnoreCase(productDetails.getCategory().trim())
                .orElseGet(() -> categoryRepository.save(Category.builder()
                    .name(productDetails.getCategory().trim())
                    .isActive(true)
                    .build()));
        }

        throw new AppException(HttpStatus.BAD_REQUEST, "Category is required");
    }

    private SubCategory resolveSubCategory(ProductDTO productDetails) {
        if (productDetails.getSubCategoryId() == null) return null;
        return subCategoryRepository.findById(productDetails.getSubCategoryId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SubCategory not found"));
    }
}
