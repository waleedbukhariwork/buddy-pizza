package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiateRegistrationResponse {
    private String identifier;
    private String identifierType; // "EMAIL" or "PHONE"
    private String message;
}
