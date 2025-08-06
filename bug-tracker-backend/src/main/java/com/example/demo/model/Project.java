package com.example.demo.model;



import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany
    @JoinTable(
        name = "project_developers",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "developer_id")
    )
    @JsonIgnoreProperties({"assignedAsDeveloper", "assignedAsTester", "password"}) // Prevent infinite loop
    private Set<User> developers = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "project_testers",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "testers_id")
    )
    @JsonIgnoreProperties({"assignedAsDeveloper", "assignedAsTester", "password"}) // Prevent infinite loop
    private Set<User> testers = new HashSet<>();
    
   
}
