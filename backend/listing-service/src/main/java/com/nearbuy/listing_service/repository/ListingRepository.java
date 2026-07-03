package com.nearbuy.listing_service.repository;

import com.nearbuy.listing_service.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findBySellerId(Long sellerId);

    List<Listing> findByStatus(Listing.ListingStatus status);

    List<Listing> findByTitleContainingIgnoreCase(String keyword);
}