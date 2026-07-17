package com.nearbuy.listing_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final Path uploadDirectory;

    public ImageStorageService(@Value("${nearbuy.upload-dir}") String uploadDirectory) throws IOException {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDirectory);
    }

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo to upload");
        }
        String contentType = file.getContentType() == null
                ? ""
                : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP photos are supported");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID() + extension;
        Path destination = uploadDirectory.resolve(filename).normalize();
        if (!destination.getParent().equals(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid photo filename");
        }
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    public Resource load(String filename) throws IOException {
        if (filename == null || !filename.matches("[a-fA-F0-9-]+\\.(jpg|png|webp)")) {
            throw new IllegalArgumentException("Invalid photo filename");
        }
        Path file = uploadDirectory.resolve(filename).normalize();
        if (!file.getParent().equals(uploadDirectory) || !Files.exists(file)) {
            throw new IllegalArgumentException("Photo not found");
        }
        return new UrlResource(file.toUri());
    }
}
