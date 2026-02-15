package com.employeemanagement.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Entity
@NoArgsConstructor
@Table(name = "leave_requests")
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;

    // PENDING, APPROVED, REJECTED
    private String status = "PENDING";

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}