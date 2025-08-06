package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use your absolute path here, with forward slashes and a trailing slash!
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/C:/Users/avgav/Downloads/DBT Kit for CDAC Mumbai/DBT Kit for CDAC Mumbai/MySQL - SQL - Assignments/Bug_Tracking_App/bug-tracker-backend/uploads/");
    }
} 