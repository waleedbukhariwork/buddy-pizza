package com.buddyfeast.service;

import com.buddyfeast.dto.DealDTO;
import com.buddyfeast.entity.Deal;
import com.buddyfeast.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DealService {

    @Autowired
    private DealRepository dealRepository;

    public List<DealDTO> getAllDeals() {
        LocalDateTime now = LocalDateTime.now();
        return dealRepository.findByIsActiveTrue()
            .stream()
            .filter(d -> d.getStartsAt() == null || !now.isBefore(d.getStartsAt()))
            .filter(d -> d.getExpiresAt() == null || now.isBefore(d.getExpiresAt()))
            .filter(d -> d.getMaxOrders() == null || d.getOrdersCount() == null || d.getOrdersCount() < d.getMaxOrders())
            .sorted(Comparator.comparingInt(d -> d.getDisplayOrder() == null ? 0 : d.getDisplayOrder()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DealDTO> getAllDealsAdmin() {
        return dealRepository.findAll()
            .stream()
            .sorted(Comparator.comparingInt(d -> d.getDisplayOrder() == null ? 0 : d.getDisplayOrder()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public DealDTO getDealById(Long id) {
        return dealRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new RuntimeException("Deal not found"));
    }

    public Deal createDeal(Deal deal) {
        validatePricing(deal);
        return dealRepository.save(deal);
    }

    public Deal updateDeal(Long id, Deal dealDetails) {
        validatePricing(dealDetails);
        Deal deal = dealRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Deal not found"));

        deal.setTitle(dealDetails.getTitle());
        deal.setDescription(dealDetails.getDescription());
        deal.setTag(dealDetails.getTag());
        deal.setOriginalPrice(dealDetails.getOriginalPrice());
        deal.setDiscountPrice(dealDetails.getDiscountPrice());
        deal.setBadge(dealDetails.getBadge());
        deal.setItems(dealDetails.getItems());
        deal.setIsActive(dealDetails.getIsActive());
        deal.setIsFeatured(dealDetails.getIsFeatured());
        deal.setImageUrl(dealDetails.getImageUrl());
        deal.setTermsText(dealDetails.getTermsText());
        deal.setMaxOrders(dealDetails.getMaxOrders());
        deal.setDisplayOrder(dealDetails.getDisplayOrder());
        deal.setStartsAt(dealDetails.getStartsAt());
        deal.setExpiresAt(dealDetails.getExpiresAt());

        return dealRepository.save(deal);
    }

    private void validatePricing(Deal deal) {
        if (deal.getTitle() == null || deal.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal title is required");
        }
        if (deal.getOriginalPrice() != null && deal.getDiscountPrice() != null
                && deal.getDiscountPrice() > deal.getOriginalPrice()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Deal price (Rs." + deal.getDiscountPrice().intValue() +
                ") cannot be greater than original price (Rs." + deal.getOriginalPrice().intValue() + ")");
        }
        if (deal.getStartsAt() != null && deal.getExpiresAt() != null
                && !deal.getExpiresAt().isAfter(deal.getStartsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Expiry date must be after start date");
        }
    }

    public void deleteDeal(Long id) {
        dealRepository.deleteById(id);
    }

    private DealDTO convertToDTO(Deal deal) {
        return DealDTO.builder()
            .id(deal.getId())
            .title(deal.getTitle())
            .description(deal.getDescription())
            .tag(deal.getTag())
            .originalPrice(deal.getOriginalPrice())
            .discountPrice(deal.getDiscountPrice())
            .badge(deal.getBadge())
            .items(deal.getItems())
            .isActive(deal.getIsActive())
            .isFeatured(deal.getIsFeatured())
            .imageUrl(deal.getImageUrl())
            .termsText(deal.getTermsText())
            .maxOrders(deal.getMaxOrders())
            .ordersCount(deal.getOrdersCount())
            .displayOrder(deal.getDisplayOrder())
            .startsAt(deal.getStartsAt())
            .expiresAt(deal.getExpiresAt())
            .build();
    }
}
