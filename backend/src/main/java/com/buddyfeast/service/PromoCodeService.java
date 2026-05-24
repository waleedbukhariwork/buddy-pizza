package com.buddyfeast.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

@Service
public class PromoCodeService {

    @Getter
    @AllArgsConstructor
    public static class PromoResult {
        private final boolean valid;
        private final double discount;
        private final String message;
    }

    public PromoResult validate(String code, double cartTotal) {
        if (code == null || code.isBlank()) {
            return new PromoResult(false, 0, "Please enter a promo code");
        }
        return switch (code.trim().toUpperCase()) {
            case "WELCOME"  -> new PromoResult(true, 100.0,  "Rs. 100 off your first order!");
            case "SAVE50"   -> new PromoResult(true, 50.0,   "Rs. 50 discount applied!");
            case "FEAST10"  -> new PromoResult(true, Math.round(cartTotal * 0.10), "10% off — nice!");
            case "BUDDY20"  -> new PromoResult(true, Math.round(cartTotal * 0.20), "20% off for Buddy members!");
            default         -> new PromoResult(false, 0,     "Invalid or expired promo code");
        };
    }
}
