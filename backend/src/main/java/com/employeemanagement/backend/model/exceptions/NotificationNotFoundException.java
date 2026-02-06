package com.employeemanagement.backend.model.exceptions;

public class NotificationNotFoundException extends RuntimeException {
    public NotificationNotFoundException(Long message) {
        super(String.format("Notification with id=%d not found", message));
    }
}