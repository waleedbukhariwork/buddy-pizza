package com.buddyfeast.dto;

import com.buddyfeast.entity.Admin;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminRegisterRequest {
    private String email;
    private String password;
    private Admin.AdminRole role;
}
