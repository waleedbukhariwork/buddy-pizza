package com.buddyfeast.service;

import com.buddyfeast.dto.DealDTO;
import com.buddyfeast.entity.Deal;
import com.buddyfeast.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DealService {
    
    @Autowired
    private DealRepository dealRepository;
    
    public List<DealDTO> getAllDeals() {
        return dealRepository.findByIsActiveTrue()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DealDTO> getAllDealsAdmin() {
        return dealRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public DealDTO getDealById(Long id) {
        return dealRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new RuntimeException("Deal not found"));
    }
    
    public Deal createDeal(Deal deal) {
        return dealRepository.save(deal);
    }
    
    public Deal updateDeal(Long id, Deal dealDetails) {
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
        
        return dealRepository.save(deal);
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
            .isActive(deal.getIsActive())
            .build();
    }
}
