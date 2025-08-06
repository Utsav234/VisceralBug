package com.example.demo.repository;



import com.example.demo.model.Project;
import com.example.demo.model.User;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByDevelopers_Id(Long developerId);

    List<Project> findByTesters_Id(Long testerId);
    
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.developers LEFT JOIN FETCH p.testers WHERE p.id = :projectId")
    Optional<Project> findByIdWithUsers(@Param("projectId") Long projectId);
    
    List<Project> findByCreatedBy(User user);

}

