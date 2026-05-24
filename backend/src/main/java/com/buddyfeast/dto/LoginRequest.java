package com.buddyfeast.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email or phone is required")
    private String phoneOrEmail;

    @NotBlank(message = "Password is required")
    private String password;
}
