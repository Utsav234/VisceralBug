package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.User;

import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    public List<Project> getProjectsByCurrentAdmin() {
        User currentUser = userService.getCurrentUser();
        return projectRepository.findByCreatedBy(currentUser);
    }
    @PostMapping
    public Project createProject(@RequestBody Project project) {
        User currentUser = userService.getCurrentUser(); 
        project.setCreatedBy(currentUser);               
        return projectRepository.save(project);
    }
    
    @GetMapping("/{projectId}/users")
    public ResponseEntity<?> getAssignedUsers(@PathVariable Long projectId) {
        Project project = projectRepository.findByIdWithUsers(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        return ResponseEntity.ok().body(Map.of(
            "developers", project.getDevelopers(),
            "testers", project.getTesters()
        ));
    }

    @GetMapping("/{projectId}/developers")
    public ResponseEntity<?> getProjectDevelopers(@PathVariable Long projectId) {
        Project project = projectRepository.findByIdWithUsers(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        return ResponseEntity.ok().body(project.getDevelopers());
    }


  
    @PutMapping("/{projectId}/assign")
    public ResponseEntity<?> assignUserToProject(
            @PathVariable Long projectId,
            @RequestParam Long userId,
            @RequestParam String role
    ) {
        User admin = getCurrentUser();
        if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can assign users to projects.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("DEVELOPER".equalsIgnoreCase(role)) {
            if (!"DEVELOPER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body("User is not a developer.");
            }
            project.getDevelopers().add(user);
        } else if ("TESTER".equalsIgnoreCase(role)) {
            if (!"TESTER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body("User is not a tester.");
            }
            project.getTesters().add(user);
        } else {
            return ResponseEntity.badRequest().body("Invalid role specified.");
        }

        projectRepository.save(project);
        return ResponseEntity.ok("User assigned successfully");
    }
    
    @PutMapping("/{projectId}/unassign")
    public ResponseEntity<?> unassignUserFromProject(
            @PathVariable Long projectId,
            @RequestParam Long userId,
            @RequestParam String role
    ) {
        User admin = getCurrentUser();
        if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can unassign users from projects.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("DEVELOPER".equalsIgnoreCase(role)) {
            project.getDevelopers().remove(user);
        } else if ("TESTER".equalsIgnoreCase(role)) {
            project.getTesters().remove(user);
        } else {
            return ResponseEntity.badRequest().body("Invalid role specified.");
        }

        projectRepository.save(project);
        return ResponseEntity.ok("User unassigned successfully");
    }

    
    @GetMapping("/assigned")
    public ResponseEntity<?> getAssignedProjects() {
        User currentUser = getCurrentUser();
        List<Project> assignedProjects;

        if ("DEVELOPER".equalsIgnoreCase(currentUser.getRole())) {
            assignedProjects = projectRepository.findByDevelopers_Id(currentUser.getId());
        } else if ("TESTER".equalsIgnoreCase(currentUser.getRole())) {
            assignedProjects = projectRepository.findByTesters_Id(currentUser.getId());
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only developers or testers can view assigned projects.");
        }

        return ResponseEntity.ok(assignedProjects);
    }
 
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    
}
