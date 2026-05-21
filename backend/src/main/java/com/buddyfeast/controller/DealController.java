package com.buddyfeast.controller;

import com.buddyfeast.dto.DealDTO;
import com.buddyfeast.service.DealService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/deals")
public class DealController {
    
    @Autowired
    private DealService dealService;
    
    @GetMapping
    public ResponseEntity<List<DealDTO>> getAllDeals() {
        return ResponseEntity.ok(dealService.getAllDeals());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DealDTO> getDealById(@PathVariable Long id) {
        return ResponseEntity.ok(dealService.getDealById(id));
    }
}
