package com.employeemanagement.backend.model.DTO.auth;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SignInRequestDTO {
    private String username;
    private String password;
}
