package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import com.example.demo.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskLogRepository taskLogRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    // Create a new task (Developer)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createTask(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam("projectId") Long projectId,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User developer = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Developer not found"));

            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            Task task = new Task();
            task.setTitle(title);
            task.setDescription(description);
            task.setPriority(Task.TaskPriority.valueOf(priority.toUpperCase()));
            task.setProject(project);
            task.setCreatedBy(developer);
            task.setStatus(Task.TaskStatus.UNASSIGNED);

            if (image != null && !image.isEmpty()) {
                task.setDeveloperImageBlob(image.getBytes());
                task.setOriginalDeveloperImageBlob(image.getBytes());
            }

            Task savedTask = taskRepository.save(task);

            // Create initial log
            TaskLog log = new TaskLog();
            log.setTask(savedTask);
            log.setUser(developer);
            log.setStatus(Task.TaskStatus.UNASSIGNED);
            log.setText("Task created by " + developer.getUsername());
            if (image != null && !image.isEmpty()) {
                log.setImageBlob(image.getBytes());
            }
            taskLogRepository.save(log);

            // Send email to project admin
            if (project.getCreatedBy() != null && project.getCreatedBy().getEmail() != null) {
                String subject = "New Task Created in '" + project.getName() + "': " + title;
                String text = "A new task has been created in your project '" + project.getName() + "'.\n" +
                        "Title: " + title + "\n" +
                        "Description: " + description + "\n" +
                        "Priority: " + priority + "\n" +
                        "Created by: " + developer.getUsername() + "\n" +
                        "Please assign this task to a tester.";
                mailService.sendMail(project.getCreatedBy().getEmail(), subject, text);
            }

            return ResponseEntity.ok(savedTask);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating task: " + e.getMessage());
        }
    }

    // Get all tasks (Admin)
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        return ResponseEntity.ok(tasks);
    }

    // Get tasks created by developer
    @GetMapping("/created")
    public ResponseEntity<List<Task>> getTasksCreatedByDeveloper() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User developer = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Developer not found"));

            List<Task> tasks = taskRepository.findByCreatedById(developer.getId());
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get tasks assigned to tester
    @GetMapping("/assigned")
    public ResponseEntity<List<Task>> getTasksAssignedToTester() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User tester = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Tester not found"));

            List<Task> tasks = taskRepository.findByAssignedToId(tester.getId());
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Assign task to tester (Admin)
    @PutMapping("/{taskId}/assign/{testerId}")
    public ResponseEntity<?> assignTaskToTester(@PathVariable Long taskId, @PathVariable Long testerId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            User tester = userRepository.findById(testerId)
                    .orElseThrow(() -> new RuntimeException("Tester not found"));
            if (!"TESTER".equalsIgnoreCase(tester.getRole())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Assigned user must be a tester.");
            }
            task.setAssignedTo(tester);
            task.setStatus(Task.TaskStatus.ASSIGNED);
            task.setAssignedAt(LocalDateTime.now());
            taskRepository.save(task);

            // Log assignment
            TaskLog log = new TaskLog();
            log.setTask(task);
            log.setUser(tester);
            log.setStatus(Task.TaskStatus.ASSIGNED);
            log.setText("Assigned to tester: " + tester.getUsername());
            log.setTimestamp(LocalDateTime.now());
            taskLogRepository.save(log);

            // Send email to assigned tester
            if (tester.getEmail() != null) {
                String subject = "Task Assigned in '" + task.getProject().getName() + "': " + task.getTitle();
                String text = "You have been assigned a new task in your project.\n" +
                        "Title: " + task.getTitle() + "\n" +
                        "Description: " + task.getDescription() + "\n" +
                        "Priority: " + task.getPriority() + "\n" +
                        "Project: " + task.getProject().getName() + "\n" +
                        "Created by: " + task.getCreatedBy().getUsername() + "\n" +
                        "Please take action on this task.";
                mailService.sendMail(tester.getEmail(), subject, text);
            }

            return ResponseEntity.ok("Task assigned to tester.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error assigning task: " + e.getMessage());
        }
    }

    // Close task by tester
    @PostMapping("/{taskId}/close-by-tester")
    public ResponseEntity<?> closeTaskByTester(
            @PathVariable Long taskId,
            @RequestParam("comment") String comment,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User tester = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Tester not found"));
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            if (task.getStatus() == Task.TaskStatus.CLOSED) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Task is already closed");
            }
            task.setStatus(Task.TaskStatus.CLOSED);
            task.setClosedAt(LocalDateTime.now());
            taskRepository.save(task);

            // Log closure
            TaskLog log = new TaskLog();
            log.setTask(task);
            log.setUser(tester);
            log.setStatus(Task.TaskStatus.CLOSED);
            log.setText(comment);
            log.setTimestamp(LocalDateTime.now());
            if (image != null && !image.isEmpty()) {
                log.setImageBlob(image.getBytes());
            }
            taskLogRepository.save(log);

            // Send email to creator and admin (CC)
            String creatorEmail = task.getCreatedBy() != null ? task.getCreatedBy().getEmail() : null;
            String adminEmail = task.getProject() != null && task.getProject().getCreatedBy() != null ? task.getProject().getCreatedBy().getEmail() : null;
            if (creatorEmail != null || adminEmail != null) {
                String subject = "Task Closed in '" + (task.getProject() != null ? task.getProject().getName() : "N/A") + "': " + task.getTitle();
                String text = "The task '" + task.getTitle() + "' has been closed.\n" +
                        "Description: " + task.getDescription() + "\n" +
                        "Project: " + (task.getProject() != null ? task.getProject().getName() : "N/A") + "\n" +
                        "Closed by: " + tester.getUsername();
                String to = creatorEmail != null ? creatorEmail : adminEmail;
                String[] cc = (creatorEmail != null && adminEmail != null && !creatorEmail.equals(adminEmail)) ? new String[]{adminEmail} : null;
                mailService.sendMail(to, subject, text, cc, null);
            }

            return ResponseEntity.ok("Task closed by tester.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error closing task: " + e.getMessage());
        }
    }

    // Get task logs
    @GetMapping("/{taskId}/logs")
    public ResponseEntity<List<Map<String, Object>>> getTaskLogs(@PathVariable Long taskId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User currentUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

            // Check authorization
            if (currentUser.getRole().equals("DEVELOPER") && !task.getCreatedBy().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (currentUser.getRole().equals("TESTER") && !task.getAssignedTo().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<TaskLog> logs = taskLogRepository.findByTaskIdOrderByTimestampDesc(taskId);
            List<Map<String, Object>> logMaps = logs.stream().map(log -> {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("id", log.getId());
                logMap.put("status", log.getStatus());
                logMap.put("text", log.getText());
                logMap.put("timestamp", log.getTimestamp());
                logMap.put("hasImage", log.getImageBlob() != null && log.getImageBlob().length > 0);
                
                // Create user map to avoid Hibernate proxy issues
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", log.getUser().getId());
                userMap.put("username", log.getUser().getUsername());
                userMap.put("role", log.getUser().getRole());
                logMap.put("user", userMap);
                
                return logMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(logMaps);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get task image
    @GetMapping("/{taskId}/image")
    public ResponseEntity<byte[]> getTaskImage(@PathVariable Long taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

            if (task.getDeveloperImageBlob() != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(task.getDeveloperImageBlob());
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get original task image
    @GetMapping("/{taskId}/original-image")
    public ResponseEntity<byte[]> getOriginalTaskImage(@PathVariable Long taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

            if (task.getOriginalDeveloperImageBlob() != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(task.getOriginalDeveloperImageBlob());
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get log image
    @GetMapping("/logs/{logId}/image")
    public ResponseEntity<byte[]> getLogImage(@PathVariable Long logId) {
        try {
            TaskLog log = taskLogRepository.findById(logId)
                    .orElseThrow(() -> new RuntimeException("Log not found"));

            if (log.getImageBlob() != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(log.getImageBlob());
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get testers for project (for assignment dropdown)
    @GetMapping("/project/{projectId}/testers")
    public ResponseEntity<List<User>> getProjectTesters(@PathVariable Long projectId) {
        try {
            List<User> testers = userRepository.findByRole("TESTER");
            return ResponseEntity.ok(testers);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 