package com.employeemanagement.backend.repository;

import com.employeemanagement.backend.model.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    List<Survey> findByEmployeeUsername(String username);
    List<Survey> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
}
