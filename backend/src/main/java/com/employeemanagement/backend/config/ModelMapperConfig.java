package com.employeemanagement.backend.config;

import com.employeemanagement.backend.model.DTO.auth.NotificationDTO;
import com.employeemanagement.backend.model.Notification;
import org.modelmapper.TypeMap;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.modelmapper.ModelMapper;

@Configuration
public class ModelMapperConfig {
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        TypeMap<Notification, NotificationDTO> notificationMapper = modelMapper.createTypeMap(Notification.class, NotificationDTO.class);
        notificationMapper.addMappings(mapper -> {
            mapper.map(src -> src.getActor().getUsername(), NotificationDTO::setActor);
            mapper.map(src -> src.getRecipient().getUsername(), NotificationDTO::setRecipient);
        });

        return modelMapper;
    }
}
