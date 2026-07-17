package com.nearbuy.listing_service.service;

import com.nearbuy.listing_service.dto.CreateListingRequest;
import com.nearbuy.listing_service.model.Listing;
import com.nearbuy.listing_service.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.math.BigDecimal;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    public Listing createListing(CreateListingRequest request, Long sellerId) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Listing type is required");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }
        Listing listing = new Listing();
        listing.setSellerId(sellerId);
        listing.setTitle(request.getTitle().trim());
        listing.setDescription(request.getDescription() == null ? "" : request.getDescription().trim());
        listing.setType(request.getType());
        listing.setPrice(request.getPrice());
        if (request.getImageUrls() != null) {
            if (request.getImageUrls().size() > 8) {
                throw new IllegalArgumentException("A listing can have at most 8 photos");
            }
            boolean invalidImage = request.getImageUrls().stream()
                    .anyMatch(url -> url == null || !url.startsWith("/api/listings/images/"));
            if (invalidImage) {
                throw new IllegalArgumentException("Invalid listing photo URL");
            }
            listing.setImageUrls(request.getImageUrls());
        }

        return listingRepository.save(listing);
    }

    public List<Listing> getActiveListings() {
        return listingRepository.findByStatus(Listing.ListingStatus.ACTIVE);
    }

    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
    }

    public Listing incrementViewCount(Long id) {
        Listing listing = getListingById(id);
        listing.setViewCount(listing.getViewCount() + 1);
        return listingRepository.save(listing);
    }

    public Listing incrementChatCount(Long id) {
        Listing listing = getListingById(id);
        listing.setChatCount(listing.getChatCount() + 1);
        return listingRepository.save(listing);
    }

    public List<Listing> getMyListings(Long sellerId) {
        return listingRepository.findBySellerId(sellerId);
    }

    public List<Listing> searchListings(String keyword) {
        return listingRepository.findByTitleContainingIgnoreCase(keyword);
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
