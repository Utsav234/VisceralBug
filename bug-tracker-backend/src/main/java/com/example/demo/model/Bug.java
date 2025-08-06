package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)  
public class Bug {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    private String priority;  

    private String status = "OPEN";  

    private String resolution;

    @Lob
    private byte[] testerImageBlob;

    public byte[] getTesterImageBlob() { return testerImageBlob; }
    public void setTesterImageBlob(byte[] testerImageBlob) {
        this.testerImageBlob = testerImageBlob;
    }

    @Lob
    private byte[] originalTesterImageBlob;

    public byte[] getOriginalTesterImageBlob() { return originalTesterImageBlob; }
    public void setOriginalTesterImageBlob(byte[] originalTesterImageBlob) {
        this.originalTesterImageBlob = originalTesterImageBlob;
    }

    @Column(nullable = false)
    private boolean wasBreached = false;

    @OneToMany(mappedBy = "bug", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private java.util.List<BugLog> logs = new java.util.ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @Temporal(TemporalType.TIMESTAMP)
    @CreatedDate
    @Column(updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastStatusChange;
}
