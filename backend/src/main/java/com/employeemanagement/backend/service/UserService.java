package com.employeemanagement.backend.service;

import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.enums.Role;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User register(String username, String firstName, String lastName, String password,
                  Role role, String email, Double salary, String department);

    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndPassword(String username, String password);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findAll();
    void deleteById(Long id);
}