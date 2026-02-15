package com.employeemanagement.backend.controller;

import com.employeemanagement.backend.model.DTO.LeaveRequestDTO;
import com.employeemanagement.backend.model.LeaveRequest;
import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.enums.NotificationType; //
import com.employeemanagement.backend.repository.LeaveRequestRepository;
import com.employeemanagement.backend.repository.UserRepository;
import com.employeemanagement.backend.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/leave")
@CrossOrigin(origins = "http://localhost:3000")
public class LeaveRequestController {

    private final LeaveRequestRepository leaveRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public LeaveRequestController(LeaveRequestRepository leaveRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @PostMapping("/request")
    public LeaveRequest submitRequest(@RequestBody LeaveRequestDTO dto, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LeaveRequest request = new LeaveRequest();
        request.setUser(user);
        request.setStartDate(dto.getStartDate());
        request.setEndDate(dto.getEndDate());
        request.setReason(dto.getReason());
        request.setStatus("PENDING");

        return leaveRepository.save(request);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<LeaveRequest> getAllRequests() {
        return leaveRepository.findAll();
    }

    @PatchMapping("/status/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LeaveRequest updateStatus(@PathVariable Long id, @RequestParam String status, Principal principal) {
        LeaveRequest request = leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(status);
        LeaveRequest savedRequest = leaveRepository.save(request);

        NotificationType type = status.equalsIgnoreCase("APPROVED")
                ? NotificationType.APPROVE
                : NotificationType.DENY;

        notificationService.createNotification(
                request.getUser().getUsername(),
                principal.getName(),
                "Your leave request has been " + status,
                "/my-requests",
                type
        );

        return savedRequest;
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteRequest(@PathVariable Long id) {
        leaveRepository.deleteById(id);
    }
}