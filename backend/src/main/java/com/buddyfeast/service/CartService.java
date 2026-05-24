package com.buddyfeast.service;

import com.buddyfeast.dto.CartDTO;
import com.buddyfeast.dto.CartItemDTO;
import com.buddyfeast.entity.Cart;
import com.buddyfeast.entity.User;
import com.buddyfeast.exception.AppException;
import org.springframework.http.HttpStatus;
import com.buddyfeast.repository.CartRepository;
import com.buddyfeast.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public CartDTO getCart(@NonNull Long userId) {
        return cartRepository.findByUserId(userId)
            .map(this::toDTO)
            .orElse(CartDTO.builder()
                .userId(userId)
                .items(List.of())
                .total(0.0)
                .build());
    }

    public CartDTO syncCart(@NonNull Long userId, List<CartItemDTO> items) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserId(userId)
            .orElse(Cart.builder().user(user).build());

        try {
            cart.setUser(user);
            cart.setItems(objectMapper.writeValueAsString(items));
            return toDTO(cartRepository.save(cart));
        } catch (Exception e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to sync cart");
        }
    }

    public void clearCart(@NonNull Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            try {
                cart.setItems(objectMapper.writeValueAsString(List.of()));
                cartRepository.save(cart);
            } catch (Exception e) {
                throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to clear cart");
            }
        });
    }

    private CartDTO toDTO(Cart cart) {
        List<CartItemDTO> items;
        try {
            String raw = cart.getItems();
            items = (raw == null || raw.isBlank())
                ? List.of()
                : objectMapper.readValue(raw, new TypeReference<List<CartItemDTO>>() {});
        } catch (Exception e) {
            items = List.of();
        }

        double total = items.stream()
            .mapToDouble(i -> (i.getSizePrice() != null ? i.getSizePrice() : i.getPrice()) * i.getQuantity())
            .sum();

        return CartDTO.builder()
            .userId(cart.getUser().getId())
            .items(items)
            .total(total)
            .updatedAt(cart.getUpdatedAt())
            .build();
    }
}
