package com.shaxian.repository;

import com.shaxian.entity.StoreInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreInfoRepository extends JpaRepository<StoreInfo, Integer> {
    Optional<StoreInfo> findFirstByOrderByIdAsc();
}

