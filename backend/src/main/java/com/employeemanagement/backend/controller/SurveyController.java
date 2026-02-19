package com.employeemanagement.backend.controller;

import com.employeemanagement.backend.model.Survey;
import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.enums.NotificationType;
import com.employeemanagement.backend.repository.SurveyRepository;
import com.employeemanagement.backend.repository.UserRepository;
import com.employeemanagement.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    private final SurveyRepository surveyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SurveyController(
            SurveyRepository surveyRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.surveyRepository = surveyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ADMIN: Sends a survey to a specific employee
    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public Survey sendSurvey(@RequestParam String question, @RequestParam Long employeeId, Principal principal) {
        User employee = userRepository.findById(employeeId).orElseThrow();
        Survey survey = new Survey();
        survey.setQuestion(question);
        survey.setAdmin(userRepository.findByUsername(principal.getName()).orElseThrow());
        survey.setEmployee(employee);
        Survey savedSurvey = surveyRepository.save(survey);

        notificationService.createNotification(
                employee.getUsername(),
                principal.getName(),
                "New survey assigned: " + question,
                "/surveys/" + savedSurvey.getId(),
                NotificationType.SURVEY
        );

        return savedSurvey;
    }

    // EMPLOYEE: Gets their surveys
    @GetMapping("/my-surveys")
    public List<Survey> getMySurveys(Principal principal) {
        return surveyRepository.findByEmployeeUsername(principal.getName());
    }

    // ADMIN: Gets surveys (and responses) for a selected employee
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Survey> getEmployeeSurveys(@PathVariable Long employeeId) {
        return surveyRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    // EMPLOYEE: Submits an answer
    @PatchMapping("/answer/{id}")
    @PreAuthorize("hasRole('USER')")
    public Survey answerSurvey(@PathVariable Long id, @RequestParam String response, Principal principal) {
        Survey survey = surveyRepository.findById(id).orElseThrow();
        if (!survey.getEmployee().getUsername().equals(principal.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can answer only your own surveys.");
        }

        survey.setResponse(response);
        Survey savedSurvey = surveyRepository.save(survey);

        notificationService.createNotification(
                savedSurvey.getAdmin().getUsername(),
                principal.getName(),
                "Survey answered by " + principal.getName() + ": " + savedSurvey.getQuestion(),
                "/hr/surveys?employeeId=" + savedSurvey.getEmployee().getId(),
                NotificationType.SURVEY
        );

        return savedSurvey;
    }
}
