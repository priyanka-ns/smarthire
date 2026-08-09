package com.smarthire.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the static frontend (GitHub Pages, localhost, etc.) to call the API.
 * Configure allowed origins with the CORS_ALLOWED_ORIGINS env var
 * (comma-separated). Defaults to "*" for easy local/demo use.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${smarthire.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "OPTIONS");
    }
}
