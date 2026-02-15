package com.employeemanagement.backend.controller;

import com.employeemanagement.backend.model.Event;
import com.employeemanagement.backend.repository.EventRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:3000")
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Event createEvent(@RequestBody Event event) {
        return eventRepository.save(event);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteEvent(@PathVariable Long id) {
        eventRepository.deleteById(id);
    }
}