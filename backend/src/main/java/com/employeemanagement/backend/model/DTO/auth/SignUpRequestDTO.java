package com.employeemanagement.backend.model.DTO.auth;

import lombok.Data;

@Data
public class SignUpRequestDTO {
    private String username;
    private String email;
    private String password;
}
