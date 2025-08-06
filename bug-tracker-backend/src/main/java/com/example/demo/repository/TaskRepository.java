package com.example.demo.repository;

import com.example.demo.model.Task;
import com.example.demo.model.Task.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByProjectId(Long projectId);
    
    List<Task> findByCreatedById(Long createdById);
    
    List<Task> findByAssignedToId(Long assignedToId);
    
    List<Task> findByStatus(TaskStatus status);
    
    List<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :testerId AND t.status = :status")
    List<Task> findByAssignedToIdAndStatus(@Param("testerId") Long testerId, @Param("status") TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.createdBy.id = :developerId AND t.status = :status")
    List<Task> findByCreatedByIdAndStatus(@Param("developerId") Long developerId, @Param("status") TaskStatus status);
} 