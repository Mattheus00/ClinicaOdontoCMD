package com.dentic.api.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String clinicName;

    @NotBlank
    private String phone;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 12, max = 128)
    private String password;
}
