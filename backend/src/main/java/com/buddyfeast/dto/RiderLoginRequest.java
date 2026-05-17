package com.buddyfeast.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RiderLoginRequest {
    private String riderId;
    private String pin;
}
