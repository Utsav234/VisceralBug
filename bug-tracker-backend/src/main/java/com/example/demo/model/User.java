package com.example.demo.model;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String password;
    private String role;
    
    
    @ManyToMany(mappedBy = "developers")
    @JsonIgnoreProperties({"developers", "testers"})
    private Set<Project> assignedAsDeveloper = new HashSet<>();

    @ManyToMany(mappedBy = "testers")
    @JsonIgnoreProperties({"developers", "testers"})
    private Set<Project> assignedAsTester = new HashSet<>();

}