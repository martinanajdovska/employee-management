package com.employeemanagement.backend.service;

public interface TokenService {
    String generateToken(String username);
    String validateToken(String token);
}
