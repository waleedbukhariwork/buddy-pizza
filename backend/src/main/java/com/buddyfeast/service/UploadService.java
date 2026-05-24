package com.buddyfeast.service;

import com.buddyfeast.exception.AppException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        validateFile(file);

        String safeFolder = (folder != null && !folder.isBlank()) ? folder : "buddy-feast/products";

        Map<?, ?> result = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder",        safeFolder,
                "public_id",     "img-" + UUID.randomUUID(),
                "overwrite",     false,
                "resource_type", "image",
                "quality",       "auto",
                "fetch_format",  "auto"
            )
        );

        return (String) result.get("secure_url");
    }

    public void deleteImage(String imageUrl) throws IOException {
        if (imageUrl == null || imageUrl.isBlank()) return;

        String publicId = extractPublicId(imageUrl);
        if (publicId == null) return;

        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    private String extractPublicId(String url) {
        try {
            int uploadIndex = url.indexOf("/upload/v");
            if (uploadIndex == -1) return null;

            String afterVersion = url.substring(uploadIndex + 9);
            int slashIndex = afterVersion.indexOf("/");
            if (slashIndex == -1) return null;

            String pathWithExt = afterVersion.substring(slashIndex + 1);
            int dotIndex = pathWithExt.lastIndexOf(".");
            return (dotIndex == -1) ? pathWithExt : pathWithExt.substring(0, dotIndex);
        } catch (Exception e) {
            return null;
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "No file provided");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Unsupported file type: " + file.getContentType() +
                ". Allowed: jpeg, png, webp, gif"
            );
        }
        if (file.getSize() > MAX_BYTES) {
            throw new AppException(HttpStatus.BAD_REQUEST, "File exceeds the 5 MB limit");
        }
    }
}
