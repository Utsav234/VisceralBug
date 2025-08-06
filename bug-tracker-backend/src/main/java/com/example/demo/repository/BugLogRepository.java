package com.example.demo.repository;

import com.example.demo.model.BugLog;
import com.example.demo.model.Bug;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BugLogRepository extends JpaRepository<BugLog, Long> {
    List<BugLog> findByBugOrderByTimestampAsc(Bug bug);
    List<BugLog> findByBugOrderByTimestampDesc(Bug bug);
} 