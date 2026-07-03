package com.nearbuy.listing_service.service;

import com.nearbuy.listing_service.dto.CreateListingRequest;
import com.nearbuy.listing_service.model.Listing;
import com.nearbuy.listing_service.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    public Listing createListing(CreateListingRequest request, Long sellerId) {
        Listing listing = new Listing();
        listing.setSellerId(sellerId);
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setType(request.getType());
        listing.setPrice(request.getPrice());

        return listingRepository.save(listing);
    }

    public List<Listing> getActiveListings() {
        return listingRepository.findByStatus(Listing.ListingStatus.ACTIVE);
    }

    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));
    }

    public List<Listing> getMyListings(Long sellerId) {
        return listingRepository.findBySellerId(sellerId);
    }

    public List<Listing> searchListings(String keyword) {
        return listingRepository.findByTitleContainingIgnoreCase(keyword);
    }
}