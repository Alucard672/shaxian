package com.shaxian.repository;

import com.shaxian.entity.SystemParams;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemParamsRepository extends JpaRepository<SystemParams, Integer> {
    Optional<SystemParams> findFirstByOrderByIdAsc();
}

