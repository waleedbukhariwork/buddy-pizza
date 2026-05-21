package com.buddyfeast.controller;

import com.buddyfeast.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/v1/assets")
public class UploadController {

    @Autowired
    private UploadService uploadService;

    /**
     * POST /api/v1/assets/upload
     * Accepts: multipart/form-data, field name = "file"
     * Returns: { "url": "https://res.cloudinary.com/..." }
     *
     * Protected — requires ADMIN JWT (SecurityConfig: /v1/assets/** → ADMIN)
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadImage(file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed. Please try again."));
        }
    }
}
