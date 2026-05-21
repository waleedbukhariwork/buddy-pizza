package com.buddyfeast.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    @Autowired
    private Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        validateFile(file);

        Map<?, ?> result = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder",        "buddy-feast/products",
                "public_id",     "product-" + UUID.randomUUID(),
                "overwrite",     false,
                "resource_type", "image"
            )
        );

        return (String) result.get("secure_url");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                "Unsupported file type: " + file.getContentType() +
                ". Allowed: jpeg, png, webp, gif"
            );
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("File exceeds the 5 MB limit");
        }
    }
}
