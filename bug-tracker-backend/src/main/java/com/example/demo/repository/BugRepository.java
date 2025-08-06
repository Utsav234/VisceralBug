package com.example.demo.repository;

import com.example.demo.model.Bug;
import com.example.demo.model.Project;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BugRepository extends JpaRepository<Bug, Long> {

  
    List<Bug> findByCreatedBy(User user);


    List<Bug> findByAssignedTo(User user);


    List<Bug> findByStatus(String status);

  
    List<Bug> findByProject(Project project);
    
    @Query("SELECT b FROM Bug b WHERE b.project.createdBy = :admin")
    List<Bug> findBugsByProjectCreator(@Param("admin") User admin);


    List<Bug> findByPriorityOrderByIdAsc(String priority);


    List<Bug> findByStatusAndProjectAndPriorityOrderByPriorityDescIdAsc(String status, Project project, String priority);
    List<Bug> findByStatusOrderByPriorityDescIdAsc(String status);
    List<Bug> findByWasBreachedTrue();
}
