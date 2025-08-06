package com.example.demo.controller;

import com.example.demo.model.Bug;
import com.example.demo.model.Project;
import com.example.demo.model.User;
import com.example.demo.model.BugLog;
import com.example.demo.repository.BugRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.BugLogRepository;
import com.example.demo.service.UserService;
import com.example.demo.service.MailService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bugs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class BugController {

    private final BugRepository bugRepository;
    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final BugLogRepository bugLogRepository;
    private final MailService mailService;

    @Value("${bugtracker.upload.dir:uploads}")
    private String uploadDir;

    private String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path uploadPath = Path.of(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/" + uploadDir + "/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }

    private boolean isBreached(Bug bug) {
        if (bug.isWasBreached()) return true;
        if ("RESOLVED".equalsIgnoreCase(bug.getStatus()) || "CLOSED".equalsIgnoreCase(bug.getStatus())) return false;
        if (bug.getLastStatusChange() == null) return false;
        long elapsedMs = new Date().getTime() - bug.getLastStatusChange().getTime();
        long breachMs = 210 * 1000L; // 3.5 minutes for demo
        if (elapsedMs > breachMs) {
            bug.setWasBreached(true);
            bugRepository.save(bug);
            return true;
        }
        return false;
    }

    @GetMapping
    public List<Map<String, Object>> getAllBugs(@RequestParam(required = false) Integer days, @RequestParam(required = false) Boolean breached) {
        User user = userService.getCurrentUser();
        String role = user.getRole().toUpperCase();
        List<Bug> bugs;
        if (Boolean.TRUE.equals(breached)) {
            if ("DEVELOPER".equals(role)) {
                bugs = bugRepository.findByWasBreachedTrue().stream()
                    .filter(b -> b.getAssignedTo() != null && b.getAssignedTo().getId().equals(user.getId()))
                    .toList();
            } else {
                bugs = bugRepository.findByWasBreachedTrue();
            }
            // Sort breached bugs by createdAt descending (latest first)
            bugs = bugs.stream()
                .sorted((b1, b2) -> {
                    if (b1.getCreatedAt() == null && b2.getCreatedAt() == null) return 0;
                    if (b1.getCreatedAt() == null) return 1;
                    if (b2.getCreatedAt() == null) return -1;
                    return b2.getCreatedAt().compareTo(b1.getCreatedAt());
                })
                .toList();
        } else {
            switch (role) {
                case "ADMIN" -> bugs = bugRepository.findBugsByProjectCreator(user);
                case "TESTER" -> bugs = bugRepository.findByCreatedBy(user);
                case "DEVELOPER" -> bugs = bugRepository.findByAssignedTo(user);
                default -> throw new RuntimeException("Unauthorized role");
            }
            // Exclude wasBreached bugs from regular reports
            bugs = bugs.stream().filter(b -> !b.isWasBreached()).toList();
        }
        if (days != null) {
            Date cutoff = Date.from(Instant.now().minus(days, ChronoUnit.DAYS));
            bugs = bugs.stream()
                       .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().after(cutoff))
                       .collect(Collectors.toList());
        }
        // Add breach info to each bug
        return bugs.stream().map(bug -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("bug", bug);
            map.put("breached", isBreached(bug));
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createBug(
            @RequestPart("bug") Bug bug,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            User user = userService.getCurrentUser();
            if (!"TESTER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only testers can create bugs.");
            }

            Project project = projectRepository.findById(bug.getProject().getId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            bug.setProject(project);
            bug.setCreatedBy(user);
            bug.setStatus("OPEN");
            bug.setCreatedAt(new java.util.Date());
            bug.setLastStatusChange(new java.util.Date());

            // Handle image upload
            if (image != null && !image.isEmpty()) {
                // Store as BLOB only
                byte[] imageBytes = image.getBytes();
                bug.setTesterImageBlob(imageBytes);
                bug.setOriginalTesterImageBlob(imageBytes); // Store original image separately
            } else {
                System.out.println("No image uploaded.");
            }

            Bug savedBug = bugRepository.save(bug);

            // Create log
            BugLog log = new BugLog();
            log.setBug(savedBug);
            log.setUser(user);
            log.setStatus("OPEN");
            log.setText(bug.getDescription());
            log.setImageBlob(savedBug.getTesterImageBlob());
            log.setTimestamp(savedBug.getCreatedAt());
            bugLogRepository.save(log);

            // Send email to project admin
            if (project.getCreatedBy() != null && project.getCreatedBy().getEmail() != null) {
                String subject = "New Bug Created in '" + project.getName() + "': " + bug.getTitle();
                String text = "A new bug has been created in your project '" + project.getName() + "'.\n" +
                        "Title: " + bug.getTitle() + "\n" +
                        "Description: " + bug.getDescription() + "\n" +
                        "Priority: " + bug.getPriority() + "\n" +
                        "Created by: " + user.getUsername() + "\n" +
                        "Please assign this bug to a developer.";
                mailService.sendMail(project.getCreatedBy().getEmail(), subject, text);
            }

            return ResponseEntity.ok(savedBug);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create bug: " + e.getMessage());
        }
    }

    @PutMapping("/{bugId}/assign/{developerId}")
    public Bug assignBugToDeveloper(@PathVariable Long bugId,
                                    @PathVariable Long developerId) {
        User user = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        String status = bug.getStatus().toUpperCase();
        if ("CLOSED".equals(status)) {
            throw new RuntimeException("Cannot reassign a bug that is CLOSED.");
        }

        User developer = userService.getUserByUserId(developerId);
        if (!"DEVELOPER".equalsIgnoreCase(developer.getRole())) {
            throw new RuntimeException("Assigned user must be a developer.");
        }

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            // Admin can always assign
            bug.setAssignedTo(developer);
            bug.setStatus("ASSIGNED");
            bug.setLastStatusChange(new java.util.Date());
        } else if ("DEVELOPER".equalsIgnoreCase(user.getRole())) {
            // Developer can only reassign if they are the currently assigned developer
            if (bug.getAssignedTo() == null || !bug.getAssignedTo().getId().equals(user.getId())) {
                throw new RuntimeException("Only the currently assigned developer can reassign this bug.");
            }
            bug.setAssignedTo(developer);
            bug.setStatus("ASSIGNED");
            bug.setLastStatusChange(new java.util.Date());
        } else {
            throw new RuntimeException("Only admins or the currently assigned developer can assign/reassign bugs.");
        }

        Bug savedBug = bugRepository.save(bug);
        // Create log for assignment
        BugLog log = new BugLog();
        log.setBug(savedBug);
        log.setUser(user);
        log.setStatus("ASSIGNED");
        StringBuilder logText = new StringBuilder();
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            logText.append("Assigned to developer: ").append(developer.getUsername());
        } else {
            logText.append("Reassigning bug to: ").append(developer.getUsername());
        }
        log.setText(logText.toString());
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);

        // Send email to assigned developer
        if (developer.getEmail() != null) {
            String subject = "Bug Assigned in '" + bug.getProject().getName() + "': " + bug.getTitle();
            String text = "You have been assigned a new bug in your project.\n" +
                    "Title: " + bug.getTitle() + "\n" +
                    "Description: " + bug.getDescription() + "\n" +
                    "Priority: " + bug.getPriority() + "\n" +
                    "Project: " + bug.getProject().getName() + "\n" +
                    "Created by: " + bug.getCreatedBy().getUsername() + "\n" +
                    "Please take action on this bug.";
            mailService.sendMail(developer.getEmail(), subject, text);
        }

        return savedBug;
    }

    @PutMapping(value = "/{bugId}/status", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateBugStatus(
            @PathVariable Long bugId,
            @RequestPart("status") String status,
            @RequestPart(value = "resolution", required = false) String resolution,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        if (!"DEVELOPER".equalsIgnoreCase(currentUser.getRole()) ||
                bug.getAssignedTo() == null ||
                !bug.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized: You are not allowed to update this bug.");
        }
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status is required.");
        }
        bug.setStatus(status.toUpperCase());
        bug.setLastStatusChange(new java.util.Date());
        if (image != null && !image.isEmpty()) {
            // Handle image upload properly
            try {
                System.out.println("[DEBUG] Status update image upload - Size: " + image.getSize() + ", Name: " + image.getOriginalFilename());
                bug.setTesterImageBlob(image.getBytes());
            } catch (Exception e) {
                System.out.println("[DEBUG] Error setting status update image: " + e.getMessage());
                e.printStackTrace();
            }
        }
        if ("RESOLVED".equalsIgnoreCase(status)) {
            if (resolution == null || resolution.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Resolution is required when resolving a bug.");
            }
            bug.setResolution(resolution);
        }
        bugRepository.save(bug);
        // Create log
        BugLog log = new BugLog();
        log.setBug(bug);
        log.setUser(currentUser);
        log.setStatus(status.toUpperCase());
        log.setText(resolution);
        if (image != null && !image.isEmpty()) {
            try {
                log.setImageBlob(image.getBytes());
            } catch (Exception e) {
                System.out.println("[DEBUG] Error setting log image in status update: " + e.getMessage());
                e.printStackTrace();
            }
        }
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);

        // Send email to bug creator/admin when bug is resolved or closed
        if (bug.getCreatedBy() != null && bug.getCreatedBy().getEmail() != null) {
            String[] cc = null;
            // CC the admin (project creator) if different from creator
            if (bug.getProject() != null && bug.getProject().getCreatedBy() != null && bug.getProject().getCreatedBy().getEmail() != null) {
                String adminEmail = bug.getProject().getCreatedBy().getEmail();
                if (!adminEmail.equalsIgnoreCase(bug.getCreatedBy().getEmail())) {
                    cc = new String[] { adminEmail };
                }
            }
            if ("RESOLVED".equalsIgnoreCase(status)) {
                String subject = "Bug Resolved in '" + bug.getProject().getName() + "': " + bug.getTitle();
                String resolvedText = "Your bug '" + bug.getTitle() + "' has been resolved.\n" +
                        "Description: " + bug.getDescription() + "\n" +
                        "Resolution: " + bug.getResolution() + "\n" +
                        "Project: " + bug.getProject().getName() + "\n" +
                        "Created by: " + bug.getCreatedBy().getUsername() + "\n" +
                        "Resolved by: " + currentUser.getUsername();
                mailService.sendMail(bug.getCreatedBy().getEmail(), subject, resolvedText, cc, null);
            } else if ("CLOSED".equalsIgnoreCase(status)) {
                String subject = "Bug Closed in '" + bug.getProject().getName() + "': " + bug.getTitle();
                String closeText = "Your bug '" + bug.getTitle() + "' has been closed.\n" +
                        "Description: " + bug.getDescription() + "\n" +
                        "Resolution: " + bug.getResolution() + "\n" +
                        "Project: " + bug.getProject().getName() + "\n" +
                        "Created by: " + bug.getCreatedBy().getUsername() + "\n" +
                        "Closed by: " + currentUser.getUsername();
                mailService.sendMail(bug.getCreatedBy().getEmail(), subject, closeText, cc, null);
            }
        }

        return ResponseEntity.ok("Bug status updated successfully.");
    }

    @PostMapping(value = "/{bugId}/reopen", consumes = {"multipart/form-data"})
    public ResponseEntity<?> reopenBugByTester(
            @PathVariable Long bugId,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        if (!"TESTER".equalsIgnoreCase(currentUser.getRole()) ||
                bug.getCreatedBy() == null ||
                !bug.getCreatedBy().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized: Only the tester who created this bug can reopen it.");
        }
        if (!"RESOLVED".equalsIgnoreCase(bug.getStatus())) {
            return ResponseEntity.badRequest().body("Bug is not in RESOLVED state.");
        }
        bug.setStatus("IN_PROGRESS");
        bug.setLastStatusChange(new java.util.Date());
        bugRepository.save(bug);
        BugLog log = new BugLog();
        log.setBug(bug);
        log.setUser(currentUser);
        log.setStatus("IN_PROGRESS");
        log.setText(text);
        if (image != null && !image.isEmpty()) {
            try {
                System.out.println("[DEBUG] Reopen image upload - Size: " + image.getSize() + ", Name: " + image.getOriginalFilename());
                log.setImageBlob(image.getBytes());
            } catch (Exception e) {
                System.out.println("[DEBUG] Error setting reopen image: " + e.getMessage());
                e.printStackTrace();
            }
        }
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);
        return ResponseEntity.ok("Bug reopened and log added.");
    }

    @PostMapping(value = "/{bugId}/close-by-tester", consumes = {"multipart/form-data"})
    public ResponseEntity<?> closeByTester(
            @PathVariable Long bugId,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        
        // Debug logging
        System.out.println("[DEBUG] closeByTester - Bug ID: " + bugId);
        System.out.println("[DEBUG] closeByTester - Current User: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ", Role: " + currentUser.getRole() + ")");
        System.out.println("[DEBUG] closeByTester - Bug Created By: " + (bug.getCreatedBy() != null ? bug.getCreatedBy().getUsername() + " (ID: " + bug.getCreatedBy().getId() + ")" : "null"));
        System.out.println("[DEBUG] closeByTester - Bug Status: " + bug.getStatus());
        System.out.println("[DEBUG] closeByTester - Text received: " + text);
        
        if (!"TESTER".equalsIgnoreCase(currentUser.getRole()) ||
                bug.getCreatedBy() == null ||
                !bug.getCreatedBy().getId().equals(currentUser.getId())) {
            System.out.println("[DEBUG] closeByTester - Authorization failed:");
            System.out.println("[DEBUG] closeByTester - Is TESTER: " + "TESTER".equalsIgnoreCase(currentUser.getRole()));
            System.out.println("[DEBUG] closeByTester - Bug CreatedBy is null: " + (bug.getCreatedBy() == null));
            if (bug.getCreatedBy() != null) {
                System.out.println("[DEBUG] closeByTester - CreatedBy ID matches current user: " + bug.getCreatedBy().getId().equals(currentUser.getId()));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized: Only the tester who created this bug can close it.");
        }
        
        if (!"RESOLVED".equalsIgnoreCase(bug.getStatus())) {
            System.out.println("[DEBUG] closeByTester - Bug status is not RESOLVED: " + bug.getStatus());
            return ResponseEntity.badRequest().body("Bug must be RESOLVED to close.");
        }
        
        System.out.println("[DEBUG] closeByTester - Authorization successful, proceeding with close...");
        
        bug.setStatus("CLOSED");
        bug.setLastStatusChange(new java.util.Date());
        bugRepository.save(bug);
        BugLog log = new BugLog();
        log.setBug(bug);
        log.setUser(currentUser);
        log.setStatus("CLOSED");
        log.setText(text);
        if (image != null && !image.isEmpty()) {
            try {
                log.setImageBlob(image.getBytes());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);

        // Send email to bug creator/admin when bug is closed (closeByTester)
        if (bug.getCreatedBy() != null && bug.getCreatedBy().getEmail() != null) {
            String[] cc = null;
            if (bug.getProject() != null && bug.getProject().getCreatedBy() != null && bug.getProject().getCreatedBy().getEmail() != null) {
                String adminEmail = bug.getProject().getCreatedBy().getEmail();
                if (!adminEmail.equalsIgnoreCase(bug.getCreatedBy().getEmail())) {
                    cc = new String[] { adminEmail };
                }
            }
            String subject = "Bug Closed in '" + bug.getProject().getName() + "': " + bug.getTitle();
            String closeText = "Your bug '" + bug.getTitle() + "' has been closed.\n" +
                    "Description: " + bug.getDescription() + "\n" +
                    "Resolution: " + bug.getResolution() + "\n" +
                    "Project: " + bug.getProject().getName() + "\n" +
                    "Created by: " + bug.getCreatedBy().getUsername() + "\n" +
                    "Closed by: " + currentUser.getUsername();
            mailService.sendMail(bug.getCreatedBy().getEmail(), subject, closeText, cc, null);
        }

        return ResponseEntity.ok("Bug closed by tester.");
    }

    @PostMapping(value = "/{bugId}/reassign-by-tester", consumes = {"multipart/form-data"})
    public ResponseEntity<?> reassignByTester(
            @PathVariable Long bugId,
            @RequestPart("developerId") Long developerId,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        
        // Debug logging
        System.out.println("[DEBUG] reassignByTester - Bug ID: " + bugId);
        System.out.println("[DEBUG] reassignByTester - Current User: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ", Role: " + currentUser.getRole() + ")");
        System.out.println("[DEBUG] reassignByTester - Bug Created By: " + (bug.getCreatedBy() != null ? bug.getCreatedBy().getUsername() + " (ID: " + bug.getCreatedBy().getId() + ")" : "null"));
        System.out.println("[DEBUG] reassignByTester - Bug Status: " + bug.getStatus());
        
        if (!"TESTER".equalsIgnoreCase(currentUser.getRole()) ||
                bug.getCreatedBy() == null ||
                !bug.getCreatedBy().getId().equals(currentUser.getId())) {
            System.out.println("[DEBUG] reassignByTester - Authorization failed:");
            System.out.println("[DEBUG] reassignByTester - Is TESTER: " + "TESTER".equalsIgnoreCase(currentUser.getRole()));
            System.out.println("[DEBUG] reassignByTester - Bug CreatedBy is null: " + (bug.getCreatedBy() == null));
            if (bug.getCreatedBy() != null) {
                System.out.println("[DEBUG] reassignByTester - CreatedBy ID matches current user: " + bug.getCreatedBy().getId().equals(currentUser.getId()));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized: Only the tester who created this bug can reassign it.");
        }
        
        if (!"RESOLVED".equalsIgnoreCase(bug.getStatus())) {
            System.out.println("[DEBUG] reassignByTester - Bug status is not RESOLVED: " + bug.getStatus());
            return ResponseEntity.badRequest().body("Bug must be RESOLVED to reassign.");
        }
        
        // Check developer is on the same project
        User newDev = userService.getUserByUserId(developerId);
        System.out.println("[DEBUG] reassignByTester - New Developer: " + newDev.getUsername() + " (ID: " + newDev.getId() + ", Role: " + newDev.getRole() + ")");
        
        if (!"DEVELOPER".equalsIgnoreCase(newDev.getRole()) || bug.getProject() == null ||
            newDev.getAssignedAsDeveloper().stream().noneMatch(p -> p.getId().equals(bug.getProject().getId()))) {
            System.out.println("[DEBUG] reassignByTester - Developer validation failed:");
            System.out.println("[DEBUG] reassignByTester - Is DEVELOPER: " + "DEVELOPER".equalsIgnoreCase(newDev.getRole()));
            System.out.println("[DEBUG] reassignByTester - Bug Project is null: " + (bug.getProject() == null));
            if (bug.getProject() != null) {
                System.out.println("[DEBUG] reassignByTester - Developer assigned to project: " + newDev.getAssignedAsDeveloper().stream().anyMatch(p -> p.getId().equals(bug.getProject().getId())));
            }
            return ResponseEntity.badRequest().body("Selected user is not a developer on this project.");
        }
        
        System.out.println("[DEBUG] reassignByTester - Authorization successful, proceeding with reassignment...");
        
        bug.setAssignedTo(newDev);
        bug.setStatus("ASSIGNED");
        bug.setLastStatusChange(new java.util.Date());
        bugRepository.save(bug);
        BugLog log = new BugLog();
        log.setBug(bug);
        log.setUser(currentUser);
        log.setStatus("ASSIGNED");
        StringBuilder logText = new StringBuilder();
        logText.append("Reassigning bug to: ").append(newDev.getUsername());
        if (text != null && !text.trim().isEmpty()) {
            logText.append("\n").append(text);
        }
        log.setText(logText.toString());
        if (image != null && !image.isEmpty()) {
            try {
                log.setImageBlob(image.getBytes());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);

        // Send email to reassigned developer
        if (newDev.getEmail() != null) {
            String subject = "Bug Reassigned in '" + bug.getProject().getName() + "': " + bug.getTitle();
            String reassignText = "Your bug '" + bug.getTitle() + "' has been reassigned to you.\n" +
                    "Description: " + bug.getDescription() + "\n" +
                    "Priority: " + bug.getPriority() + "\n" +
                    "Project: " + bug.getProject().getName() + "\n" +
                    "Created by: " + bug.getCreatedBy().getUsername() + "\n" +
                    "Reassigned by: " + currentUser.getUsername();
            mailService.sendMail(newDev.getEmail(), subject, reassignText);
        }

        return ResponseEntity.ok("Bug reassigned by tester.");
    }


    
    @GetMapping("/assigned")
    public List<Map<String, Object>> getAssignedBugsForDeveloper() {
        User currentUser = userService.getCurrentUser();
        
        if (!"DEVELOPER".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Only developers can access this endpoint.");
        }

        List<Bug> bugs = bugRepository.findByAssignedTo(currentUser)
            .stream().filter(b -> !b.isWasBreached()).toList();
        
        // Check and update breach status for each bug
        for (Bug bug : bugs) {
            isBreached(bug);
        }
        // Re-fetch bugs after possible breach updates
        bugs = bugRepository.findByAssignedTo(currentUser)
            .stream().filter(b -> !b.isWasBreached()).toList();
        
        // Return lightweight version without BLOB data
        return bugs.stream().map(bug -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", bug.getId());
            map.put("title", bug.getTitle());
            map.put("description", bug.getDescription());
            map.put("status", bug.getStatus());
            map.put("priority", bug.getPriority());
            map.put("createdAt", bug.getCreatedAt());
            map.put("lastStatusChange", bug.getLastStatusChange());
            map.put("resolution", bug.getResolution());
            map.put("project", bug.getProject());
            map.put("createdBy", bug.getCreatedBy());
            map.put("assignedTo", bug.getAssignedTo());
            map.put("hasImage", bug.getTesterImageBlob() != null);
            map.put("wasBreached", bug.isWasBreached());
            return map;
        }).collect(Collectors.toList());
    }
    
    @GetMapping("/filter")
    public List<Bug> filterBugs(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String priority,
            @AuthenticationPrincipal User user) {

        String role = user.getRole().toUpperCase();
        List<Bug> bugs;

        switch (role) {
            case "ADMIN":
                bugs = bugRepository.findAll();
                break;
            case "TESTER":
                bugs = bugRepository.findByCreatedBy(user);
                break;
            case "DEVELOPER":
                bugs = bugRepository.findByAssignedTo(user);
                break;
            default:
                throw new RuntimeException("Unauthorized role");
        }

        return bugs.stream()
                .filter(b -> status == null || b.getStatus().equalsIgnoreCase(status))
                .filter(b -> projectId == null || (b.getProject() != null && b.getProject().getId().equals(projectId)))
                .filter(b -> priority == null || b.getPriority().equalsIgnoreCase(priority))
                .sorted((b1, b2) -> {
                    int p1 = mapPriority(b1.getPriority());
                    int p2 = mapPriority(b2.getPriority());
                    return p1 != p2 ? Integer.compare(p1, p2) : Long.compare(b1.getId(), b2.getId());
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{bugId}/logs")
    public List<Map<String, Object>> getBugLogs(@PathVariable Long bugId) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        
        // Debug logging
        System.out.println("[DEBUG] getBugLogs - Bug ID: " + bugId);
        System.out.println("[DEBUG] getBugLogs - Current User: " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ", Role: " + currentUser.getRole() + ")");
        System.out.println("[DEBUG] getBugLogs - Bug Assigned To: " + (bug.getAssignedTo() != null ? bug.getAssignedTo().getUsername() + " (ID: " + bug.getAssignedTo().getId() + ")" : "null"));
        System.out.println("[DEBUG] getBugLogs - Bug Created By: " + (bug.getCreatedBy() != null ? bug.getCreatedBy().getUsername() + " (ID: " + bug.getCreatedBy().getId() + ")" : "null"));
        
        // Authorization checks
        String role = currentUser.getRole().toUpperCase();
        if ("DEVELOPER".equals(role)) {
            // Developers can only see logs for bugs assigned to them
            if (bug.getAssignedTo() == null || !bug.getAssignedTo().getId().equals(currentUser.getId())) {
                System.out.println("[DEBUG] getBugLogs - Authorization failed for developer. AssignedTo ID: " + (bug.getAssignedTo() != null ? bug.getAssignedTo().getId() : "null") + ", Current User ID: " + currentUser.getId());
                throw new RuntimeException("Unauthorized: You can only view logs for bugs assigned to you.");
            }
        } else if ("TESTER".equals(role)) {
            // Testers can only see logs for bugs they created
            if (bug.getCreatedBy() == null || !bug.getCreatedBy().getId().equals(currentUser.getId())) {
                System.out.println("[DEBUG] getBugLogs - Authorization failed for tester. CreatedBy ID: " + (bug.getCreatedBy() != null ? bug.getCreatedBy().getId() : "null") + ", Current User ID: " + currentUser.getId());
                throw new RuntimeException("Unauthorized: You can only view logs for bugs you created.");
            }
        }
        // Admins can see all logs (no additional check needed)
        
        System.out.println("[DEBUG] getBugLogs - Authorization successful, fetching logs...");
        List<BugLog> logs = bugLogRepository.findByBugOrderByTimestampDesc(bug);
        System.out.println("[DEBUG] getBugLogs - Found " + logs.size() + " logs");
        
        return logs.stream().map(log -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", log.getId());
            map.put("status", log.getStatus());
            
            // Handle User object to avoid Hibernate proxy serialization issues
            User logUser = log.getUser();
            Map<String, Object> userMap = new java.util.HashMap<>();
            if (logUser != null) {
                userMap.put("id", logUser.getId());
                userMap.put("username", logUser.getUsername());
                userMap.put("role", logUser.getRole());
                // Add other user fields as needed
            }
            map.put("user", userMap);
            
            map.put("timestamp", log.getTimestamp());
            map.put("text", log.getText());
            map.put("hasImage", log.getImageBlob() != null);
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping(value = "/{bugId}/log", consumes = {"multipart/form-data"})
    public ResponseEntity<?> addBugLog(
            @PathVariable Long bugId,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        User currentUser = userService.getCurrentUser();
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        if (!"DEVELOPER".equalsIgnoreCase(currentUser.getRole()) ||
                bug.getAssignedTo() == null ||
                !bug.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized: You are not allowed to log for this bug.");
        }
        BugLog log = new BugLog();
        log.setBug(bug);
        log.setUser(currentUser);
        log.setStatus(bug.getStatus()); // current status
        log.setText(text);
        if (image != null && !image.isEmpty()) {
            try {
                System.out.println("[DEBUG] Log image upload - Size: " + image.getSize() + ", Name: " + image.getOriginalFilename() + ", ContentType: " + image.getContentType());
                byte[] imageBytes = image.getBytes();
                System.out.println("[DEBUG] Image bytes length: " + imageBytes.length);
                log.setImageBlob(imageBytes);
                System.out.println("[DEBUG] Log image blob set, size: " + (log.getImageBlob() != null ? log.getImageBlob().length : "null"));
            } catch (Exception e) {
                System.out.println("[DEBUG] Error setting log image blob: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("[DEBUG] No image provided for log");
        }
        log.setTimestamp(new java.util.Date());
        bugLogRepository.save(log);
        return ResponseEntity.ok("Log added successfully.");
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getBugImage(@PathVariable Long id) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        if (bug.getTesterImageBlob() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(bug.getTesterImageBlob());
    }

    @GetMapping("/{id}/original-image")
    public ResponseEntity<byte[]> getOriginalBugImage(@PathVariable Long id) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bug not found"));
        if (bug.getOriginalTesterImageBlob() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(bug.getOriginalTesterImageBlob());
    }

    @GetMapping("/logs/{logId}/image")
    public ResponseEntity<byte[]> getLogImage(@PathVariable Long logId) {
        BugLog log = bugLogRepository.findById(logId).orElse(null);
        if (log == null || log.getImageBlob() == null) {
            System.out.println("[DEBUG] No image blob found for logId: " + logId);
            return ResponseEntity.notFound().build();
        }
        System.out.println("[DEBUG] Serving image blob size: " + log.getImageBlob().length);
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(log.getImageBlob());
    }

    private int mapPriority(String priority) {
        return switch (priority.toUpperCase()) {
            case "HIGH" -> 1;
            case "MEDIUM" -> 2;
            case "LOW" -> 3;
            default -> 4;
        };
    }
}
