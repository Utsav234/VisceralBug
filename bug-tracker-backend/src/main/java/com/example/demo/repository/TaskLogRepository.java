package com.example.demo.repository;

import com.example.demo.model.TaskLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskLogRepository extends JpaRepository<TaskLog, Long> {
    
    List<TaskLog> findByTaskIdOrderByTimestampDesc(Long taskId);
    
    List<TaskLog> findByTaskId(Long taskId);
} 