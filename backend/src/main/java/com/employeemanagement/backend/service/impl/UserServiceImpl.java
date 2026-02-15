package com.employeemanagement.backend.service.impl;

import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.enums.Role;
import com.employeemanagement.backend.model.exceptions.EmailAlreadyExistsException;
import com.employeemanagement.backend.model.exceptions.UsernameAlreadyExistsException;
import com.employeemanagement.backend.repository.UserRepository;
import com.employeemanagement.backend.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User register(String username, String firstName, String lastName, String password, Role role, String email, Double salary, String department) {
        if (username == null || firstName== null || lastName==null || password == null || username.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("Must fill all fields");
        }

        if (this.existsByUsername(username)) {
            throw new UsernameAlreadyExistsException(username);
        }

        if (this.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        String hashedPassword = passwordEncoder.encode(password);

        User user = new User(username, firstName, lastName, hashedPassword, email, role, salary, department);

        return this.userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return this.userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByUsernameAndPassword(String username, String password) {
        return this.userRepository.findByUsernameAndPassword(username, password);
    }

    @Override
    public boolean existsByUsername(String username) {
        return this.userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return this.userRepository.existsByEmail(email);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

}
