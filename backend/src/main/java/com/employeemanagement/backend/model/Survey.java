package com.employeemanagement.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Survey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String question;
    private String response; // empty until the employee answers
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private User employee;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin;
}