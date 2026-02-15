package com.employeemanagement.backend.model;

import com.employeemanagement.backend.model.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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

    private Double salary;
    private String department;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<LeaveRequest> leaveRequests;

    @OneToMany(mappedBy = "recipient", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Notification> notificationsReceived;

    public User(String username, String firstName, String lastName, String password, String email, Role role, Double salary, String department) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.salary = salary;
        this.department = department;
    }
}