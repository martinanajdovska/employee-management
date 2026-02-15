package com.employeemanagement.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
public class WorkLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer year;
    private String month;
    private Double hoursWorked;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public WorkLog(Integer year, String month, Double hoursWorked, User user) {
        this.year = year;
        this.month = month;
        this.hoursWorked = hoursWorked;
        this.user = user;
    }
}