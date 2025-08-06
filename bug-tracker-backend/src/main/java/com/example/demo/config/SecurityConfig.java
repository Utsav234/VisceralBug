package com.example.demo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.slf4j.Logger;

import static org.springframework.security.config.Customizer.withDefaults;
import org.slf4j.LoggerFactory;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    private final JwtFilter jwtFilter;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        logger.info("Loading SecurityConfig and creating SecurityFilterChain bean");
        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/uploads/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                                .requestMatchers("/api/bugs/*/image").permitAll()
                                .requestMatchers("/api/bugs/*/original-image").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/bugs/logs/*/image").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/tasks/*/image").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/tasks/*/original-image").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/tasks/logs/*/image").permitAll()
                                .requestMatchers("/resources/**", "/static/**", "/public/**", "/webui/**", "/h2-console/**").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                // TESTER
                                .requestMatchers(HttpMethod.POST, "/api/bugs").hasRole("TESTER")
                                .requestMatchers(HttpMethod.POST, "/api/bugs/*/reassign-by-tester").hasRole("TESTER")
                                .requestMatchers(HttpMethod.POST, "/api/bugs/*/close-by-tester").hasRole("TESTER")
                                // DEVELOPER
                                .requestMatchers(HttpMethod.POST, "/api/tasks").hasRole("DEVELOPER")
                                .requestMatchers(HttpMethod.POST, "/api/tasks/*/close-by-tester").hasRole("TESTER")
                                // ALL ROLES can view their bugs/tasks (access is controlled in controller logic)
                                .requestMatchers(HttpMethod.GET, "/api/bugs").authenticated()
                                .requestMatchers(HttpMethod.GET, "/api/tasks").authenticated()
                                // ADMIN assigns bugs and tasks
                                .requestMatchers(HttpMethod.PUT, "/api/bugs/*/assign/*").hasAnyRole("ADMIN", "DEVELOPER")
                                .requestMatchers(HttpMethod.PUT, "/api/tasks/*/assign/*").hasRole("ADMIN")
                                .requestMatchers("/api/user/change-password").authenticated()
                                // DEVELOPER updates bugs
                                .requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                                // Projects
                                .requestMatchers("/api/projects/**").authenticated()
                                .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("https://bug-tracker-system.onrender.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
