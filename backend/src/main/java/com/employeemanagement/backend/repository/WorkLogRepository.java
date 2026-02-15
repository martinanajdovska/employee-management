package com.employeemanagement.backend.repository;

import com.employeemanagement.backend.model.WorkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {
    List<WorkLog> findByUserId(Long userId);
    Optional<WorkLog> findByUserIdAndMonthAndYear(Long userId, String month, Integer year);
}