package com.employeemanagement.backend.controller;

import com.employeemanagement.backend.model.DTO.SalarySlipDTO;
import com.employeemanagement.backend.model.DTO.WorkLogRequestDTO;
import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.WorkLog;
import com.employeemanagement.backend.repository.UserRepository;
import com.employeemanagement.backend.repository.WorkLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class ProfileController {

    private final UserRepository userRepository;
    private final WorkLogRepository workLogRepository;

    public ProfileController(UserRepository userRepository, WorkLogRepository workLogRepository) {
        this.userRepository = userRepository;
        this.workLogRepository = workLogRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfileData(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SalarySlipDTO> workHistory = workLogRepository.findByUserId(id).stream()
                .map(log -> new SalarySlipDTO(
                        log.getMonth(),
                        log.getYear(),
                        log.getHoursWorked(),
                        user.getSalary(),
                        user.getDepartment()
                ))
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("fullName", user.getFirstName() + " " + user.getLastName());
        response.put("department", user.getDepartment());
        response.put("monthlySalary", user.getSalary());
        response.put("workHistory", workHistory);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/log-hours")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkLog> logHours(@RequestBody WorkLogRequestDTO request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkLog workLog = workLogRepository
                .findByUserIdAndMonthAndYear(user.getId(), request.getMonth(), request.getYear())
                .orElse(new WorkLog());

        workLog.setUser(user);
        workLog.setMonth(request.getMonth());
        workLog.setYear(request.getYear());
        workLog.setHoursWorked(request.getHoursWorked());

        return ResponseEntity.ok(workLogRepository.save(workLog));
    }

    @GetMapping("/all-employees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllEmployees() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("name", user.getFirstName() + " " + user.getLastName());
                    map.put("department", user.getDepartment());
                    return map;
                }).toList());
    }

    @GetMapping("/{id}/slips")
    public ResponseEntity<List<SalarySlipDTO>> getSalarySlips(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkLog> logs = workLogRepository.findByUserId(id);

        List<SalarySlipDTO> slips = logs.stream()
                .map(log -> new SalarySlipDTO(
                        log.getMonth(),
                        log.getYear(),
                        log.getHoursWorked(),
                        user.getSalary(),
                        user.getDepartment()
                ))
                .toList();

        return ResponseEntity.ok(slips);
    }
}
