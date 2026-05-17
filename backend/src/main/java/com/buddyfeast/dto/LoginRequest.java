package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String phoneOrEmail;
    private String password;
}
