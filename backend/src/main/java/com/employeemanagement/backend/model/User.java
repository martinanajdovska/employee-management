package com.employeemanagement.backend.model;

import com.employeemanagement.backend.model.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@Table(name = "user_table")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String firstName;
    private String lastName;
    private String username;
    private String password;
    @Column(unique = true)
    private String email;

    @Enumerated(value = EnumType.STRING)
    private Role role;

    public User(String username, String firstName, String lastName, String password, String email, Role role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }
}