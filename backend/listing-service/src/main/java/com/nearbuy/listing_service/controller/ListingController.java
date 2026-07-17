package com.nearbuy.listing_service.controller;

import com.nearbuy.listing_service.dto.CreateListingRequest;
import com.nearbuy.listing_service.model.Listing;
import com.nearbuy.listing_service.service.ListingService;
import com.nearbuy.listing_service.service.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.time.Duration;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingService listingService;

    @Autowired
    private ImageStorageService imageStorageService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String filename = imageStorageService.store(file);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("url", "/api/listings/images/" + filename));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not store photo");
        }
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<?> getImage(@PathVariable String filename) {
        try {
            Resource resource = imageStorageService.load(filename);
            String contentType = Files.probeContentType(resource.getFile().toPath());
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                    .contentType(MediaType.parseMediaType(contentType == null ? "image/jpeg" : contentType))
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createListing(@RequestBody CreateListingRequest request,
                                            @RequestHeader("X-User-Id") Long sellerId) {
        try {
            Listing listing = listingService.createListing(request, sellerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(listing);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Listing>> getActiveListings() {
        return ResponseEntity.ok(listingService.getActiveListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getListingById(@PathVariable Long id) {
        try {
            Listing listing = listingService.incrementViewCount(id);
            return ResponseEntity.ok(listing);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Listing>> getMyListings(@RequestHeader("X-User-Id") Long sellerId) {
        return ResponseEntity.ok(listingService.getMyListings(sellerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Listing>> searchListings(@RequestParam String q) {
        return ResponseEntity.ok(listingService.searchListings(q));
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Listing.ListingStatus status,
                                           @RequestHeader("X-User-Id") Long sellerId) {
        try {
            Listing updated = listingService.updateStatus(id, status, sellerId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id,
                                            @RequestHeader("X-User-Id") Long sellerId) {
        try {
            listingService.deleteListing(id, sellerId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/chat-count")
    public ResponseEntity<?> incrementChatCount(@PathVariable Long id) {
        try {
            Listing listing = listingService.incrementChatCount(id);
            return ResponseEntity.ok(listing);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
