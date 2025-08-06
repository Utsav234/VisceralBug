package com.example.demo.service;



import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initAdminUser() {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("gavliutsav@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // change later!
            admin.setRole("ADMIN");
            userRepository.save(admin);
        }
    }

    public User authenticate(String username, String password) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    boolean match = passwordEncoder.matches(password, user.getPassword());
                    System.out.println("Login attempt for: " + username);
                    System.out.println("Password matches: " + match);
                    return match ? user : null;
                })
                .orElse(null);
    }
    
    public void save(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword())); // encode on save
        userRepository.save(user);
    }

    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    
    
  
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),
            getAuthorities(user.getRole())
        );
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String role) {

        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
    public User getUserByUserId(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof UserDetails details) {
            username = details.getUsername();
        } else {
            username = principal.toString(); // fallback
        }

        return getUserByUsername(username);
    }
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    public List<User> getAllDevelopers() {
        return userRepository.findByRole("DEVELOPER");
    }

    public List<User> getAllTesters() {
        return userRepository.findByRole("TESTER");
    }
    
    
}

