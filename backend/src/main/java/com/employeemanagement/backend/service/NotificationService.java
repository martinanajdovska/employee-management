package com.employeemanagement.backend.service;

import com.employeemanagement.backend.model.DTO.auth.NotificationDTO;
import com.employeemanagement.backend.model.Notification;
import com.employeemanagement.backend.model.enums.NotificationType;

import java.util.List;

public interface NotificationService {
    void createNotification(String to, String from, String msg, String link, NotificationType type);
    List<NotificationDTO> findAllByRecipient(String username);
    void markAsRead(Long id);
    NotificationDTO convertToDTO(Notification user);
}
