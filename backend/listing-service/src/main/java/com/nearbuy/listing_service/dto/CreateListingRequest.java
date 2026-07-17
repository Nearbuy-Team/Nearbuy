package com.nearbuy.listing_service.dto;

import com.nearbuy.listing_service.model.Listing;

import java.math.BigDecimal;

public class CreateListingRequest {

    private String title;
    private String description;
    private Listing.ListingType type;
    private BigDecimal price;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Listing.ListingType getType() {
        return type;
    }

    public void setType(Listing.ListingType type) {
        this.type = type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}