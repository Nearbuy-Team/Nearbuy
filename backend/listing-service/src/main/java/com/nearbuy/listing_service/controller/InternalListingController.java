package com.nearbuy.listing_service.controller;

import com.nearbuy.listing_service.service.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/listings")
public class InternalListingController {
    private final ListingService listingService;

    public InternalListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @PatchMapping("/{id}/chat-count")
    public ResponseEntity<?> incrementChatCount(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(listingService.incrementChatCount(id));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.notFound().build();
        }
    }
}
