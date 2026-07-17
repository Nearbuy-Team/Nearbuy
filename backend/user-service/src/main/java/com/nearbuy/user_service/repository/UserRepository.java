package com.nearbuy.user_service.repository;

import com.nearbuy.user_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

}
