package com.buddyfeast.dto;

import lombok.Data;

@Data
public class UpdateAdminProfileRequest {
    private String name;
    private String avatarUrl;
}
