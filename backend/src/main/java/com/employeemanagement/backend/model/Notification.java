package com.employeemanagement.backend.model;

import com.employeemanagement.backend.model.enums.NotificationType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User actor;

    private String message;
    private String link;
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    private NotificationType type;

    public Notification(User recipient, User actor, String message, String link, boolean isRead, LocalDateTime createdAt, NotificationType type) {
        this.recipient = recipient;
        this.actor = actor;
        this.message = message;
        this.link = link;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.type = type;
    }
}

