package com.employeemanagement.backend.model.DTO;

import lombok.Data;

@Data
public class WorkLogRequestDTO {
    private Long userId;
    private String month;
    private Integer year;
    private Double hoursWorked;
}