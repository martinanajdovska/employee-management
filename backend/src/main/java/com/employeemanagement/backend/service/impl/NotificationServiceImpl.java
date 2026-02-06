package com.employeemanagement.backend.service.impl;

import com.employeemanagement.backend.model.DTO.NotificationDTO;
import com.employeemanagement.backend.model.Notification;
import com.employeemanagement.backend.model.User;
import com.employeemanagement.backend.model.enums.NotificationType;
import com.employeemanagement.backend.model.exceptions.ActionNotAllowedException;
import com.employeemanagement.backend.model.exceptions.NotificationNotFoundException;
import com.employeemanagement.backend.model.exceptions.UsernameNotFoundException;
import com.employeemanagement.backend.repository.NotificationRepository;
import com.employeemanagement.backend.service.NotificationService;
import com.employeemanagement.backend.service.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final ModelMapper modelMapper;

    public NotificationServiceImpl(SimpMessagingTemplate messagingTemplate, NotificationRepository notificationRepository, UserService userService, ModelMapper modelMapper) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.userService = userService;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void createNotification(String to, String from, String msg, String link, NotificationType type) {
        User recipient = this.userService.findByUsername(to).orElseThrow(()->new UsernameNotFoundException(to));
        User actor = this.userService.findByUsername(from).orElseThrow(()->new UsernameNotFoundException(from));

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setMessage(msg);
        notification.setLink(link);
        notification.setType(type);

        this.notificationRepository.save(notification);

        messagingTemplate.convertAndSendToUser(to, "/queue/notifications", convertToDTO(notification));
    }

    @Override
    public List<NotificationDTO> findAllByRecipient(String username) {
        User user = this.userService.findByUsername(username).orElseThrow(()-> new UsernameNotFoundException(username));

        List<Notification> notifications = this.notificationRepository.findAllByRecipientUsernameOrderByCreatedAtDesc(username);
        List<NotificationDTO> result = notifications.stream().map(this::convertToDTO).collect(Collectors.toList());

        return result;
    }

    @Override
    public void markAsRead(String username, Long id) {
        User user = this.userService.findByUsername(username).orElseThrow(()-> new UsernameNotFoundException(username));
        Notification notification = this.notificationRepository.findById(id).orElseThrow(()-> new NotificationNotFoundException(id));

        if (!notification.getRecipient().equals(user)) {
            throw new ActionNotAllowedException(String.format("User %s can't open notification with id: %d", username, id));
        }

        notification.setRead(true);
        this.notificationRepository.save(notification);
    }

    @Override
    public NotificationDTO convertToDTO(Notification user) {
        return this.modelMapper.map(user, NotificationDTO.class);
    }
}

