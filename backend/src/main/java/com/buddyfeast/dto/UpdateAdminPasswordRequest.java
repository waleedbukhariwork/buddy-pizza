package com.buddyfeast.dto;

import lombok.Data;

@Data
public class UpdateAdminPasswordRequest {
    private String currentPassword;
    private String newPassword;
}
