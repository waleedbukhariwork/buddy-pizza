package com.buddyfeast.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerifyRequest {
    @NotBlank(message = "Identifier is required")
    private String identifier;

    @NotBlank(message = "Verification code is required")
    private String code;
}
