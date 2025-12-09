package com.shaxian.repository;

import com.shaxian.entity.InventoryAlertSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryAlertSettingsRepository extends JpaRepository<InventoryAlertSettings, Integer> {
    Optional<InventoryAlertSettings> findFirstByOrderByIdAsc();
}

