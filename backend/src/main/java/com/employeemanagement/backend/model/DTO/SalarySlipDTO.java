package com.employeemanagement.backend.model.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SalarySlipDTO {
    private String month;
    private Integer year;
    private Double hoursWorked;
    private Double fixedSalary;
    private String department;

    public Double getTotalPayout() {
        if (fixedSalary == null || hoursWorked == null) return 0.0;
        return (fixedSalary / 160) * hoursWorked;
    }

}