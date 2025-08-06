package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BugLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bug_id")
    @JsonBackReference
    private Bug bug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String status;
    private String text;

    @Lob
    private byte[] imageBlob;

    public byte[] getImageBlob() { return imageBlob; }
    public void setImageBlob(byte[] imageBlob) {
        this.imageBlob = imageBlob;
    }

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;
} 