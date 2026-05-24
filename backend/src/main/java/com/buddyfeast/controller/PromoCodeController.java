package com.buddyfeast.controller;

import com.buddyfeast.service.PromoCodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/promo")
public class PromoCodeController {

    @Autowired
    private PromoCodeService promoCodeService;

    @Getter @Setter
    public static class ValidateRequest {
        @NotBlank(message = "Promo code is required")
        private String code;
        private double cartTotal;
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@Valid @RequestBody ValidateRequest req) {
        PromoCodeService.PromoResult result = promoCodeService.validate(req.getCode(), req.getCartTotal());
        return ResponseEntity.ok(Map.of(
            "valid",    result.isValid(),
            "discount", result.getDiscount(),
            "message",  result.getMessage()
        ));
    }
}
