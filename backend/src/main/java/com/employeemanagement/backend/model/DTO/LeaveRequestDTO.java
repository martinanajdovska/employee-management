package com.employeemanagement.backend.model.DTO;

import lombok.Data;
import java.time.LocalDate;

@Data
public class LeaveRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}