package com.employeemanagement.backend.model.exceptions;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(String.format("Email %s already exists", message));
    }
}
