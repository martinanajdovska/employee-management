package com.employeemanagement.backend.controller;

import com.employeemanagement.backend.model.Survey;
import com.employeemanagement.backend.repository.SurveyRepository;
import com.employeemanagement.backend.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    private final SurveyRepository surveyRepository;
    private final UserRepository userRepository;

    public SurveyController(SurveyRepository surveyRepository, UserRepository userRepository) {
        this.surveyRepository = surveyRepository;
        this.userRepository = userRepository;
    }

    // ADMIN: Sends a survey to a specific employee
    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public Survey sendSurvey(@RequestParam String question, @RequestParam Long employeeId, Principal principal) {
        Survey survey = new Survey();
        survey.setQuestion(question);
        survey.setAdmin(userRepository.findByUsername(principal.getName()).orElseThrow());
        survey.setEmployee(userRepository.findById(employeeId).orElseThrow());
        return surveyRepository.save(survey);
    }

    // EMPLOYEE: Gets their surveys
    @GetMapping("/my-surveys")
    public List<Survey> getMySurveys(Principal principal) {
        return surveyRepository.findByEmployeeUsername(principal.getName());
    }

    // EMPLOYEE: Submits an answer
    @PatchMapping("/answer/{id}")
    public Survey answerSurvey(@PathVariable Long id, @RequestParam String response) {
        Survey survey = surveyRepository.findById(id).orElseThrow();
        survey.setResponse(response);
        return surveyRepository.save(survey);
    }
}