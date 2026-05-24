package com.buddyfeast.controller;

import com.buddyfeast.exception.AppException;
import com.buddyfeast.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) {
        try {
            String url = uploadService.uploadImage(file, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", url));
        } catch (AppException e) {
            return ResponseEntity.status(e.getStatus())
                    .body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Upload failed. Please try again."));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteImage(
            @RequestParam("url") String imageUrl) {
        try {
            uploadService.deleteImage(imageUrl);
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to delete image. Please try again."));
        }
    }
}
