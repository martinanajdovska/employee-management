package com.employeemanagement.backend.model.DTO.auth;

import com.employeemanagement.backend.model.enums.NotificationType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class NotificationDTO {
    private Long id;
    private String recipient;
    private String actor;
    private String message;
    private String link;
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private NotificationType type;

    public NotificationDTO(Long id, String recipient, String actor, String message, String link, boolean isRead, LocalDateTime createdAt, NotificationType type) {
        this.id = id;
        this.recipient = recipient;
        this.actor = actor;
        this.message = message;
        this.link = link;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.type = type;
    }
}
