package com.nearbuy.user_service.dto;

import com.nearbuy.user_service.model.User;

public class PublicUserResponse {
    private final Long id;
    private final String fullName;
    private final Integer trustScore;
    private final Boolean idVerified;

    public PublicUserResponse(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.trustScore = user.getTrustScore();
        this.idVerified = user.getIdVerified();
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public Integer getTrustScore() {
        return trustScore;
    }

    public Boolean getIdVerified() {
        return idVerified;
    }
}
