package com.buddyfeast.controller;

import com.buddyfeast.dto.CartDTO;
import com.buddyfeast.dto.CartItemDTO;
import com.buddyfeast.entity.User;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.UserRepository;
import com.buddyfeast.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        String principal = (String) auth.getPrincipal();
        boolean isEmail = principal.contains("@");
        User user = (isEmail ? userRepository.findByEmail(principal) : userRepository.findByPhone(principal))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<CartDTO> getCart() {
        return ResponseEntity.ok(cartService.getCart(getAuthenticatedUserId()));
    }

    @PutMapping
    public ResponseEntity<CartDTO> syncCart(@RequestBody List<CartItemDTO> items) {
        return ResponseEntity.ok(cartService.syncCart(getAuthenticatedUserId(), items));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart() {
        cartService.clearCart(getAuthenticatedUserId());
        return ResponseEntity.noContent().build();
    }
}
