package com.nearbuy.listing_service.controller;

import com.nearbuy.listing_service.dto.CreateListingRequest;
import com.nearbuy.listing_service.model.Listing;
import com.nearbuy.listing_service.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingService listingService;

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
            return ResponseEntity.ok(listingService.getListingById(id));
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
    public Listing updateStatus(Long listingId, Listing.ListingStatus newStatus, Long sellerId) {
        Listing listing = getListingById(listingId);

        if (!listing.getSellerId().equals(sellerId)) {
            throw new SecurityException("You do not own this listing");
        }

        listing.setStatus(newStatus);
        return listingRepository.save(listing);
    }

    public void deleteListing(Long listingId, Long sellerId) {
        Listing listing = getListingById(listingId);

        if (!listing.getSellerId().equals(sellerId)) {
            throw new SecurityException("You do not own this listing");
        }

        listingRepository.delete(listing);
    }
}