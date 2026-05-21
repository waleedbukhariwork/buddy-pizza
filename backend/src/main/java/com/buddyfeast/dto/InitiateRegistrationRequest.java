package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InitiateRegistrationRequest {
    private String name;
    private String identifier; // email or phone number
    private String password;
}
