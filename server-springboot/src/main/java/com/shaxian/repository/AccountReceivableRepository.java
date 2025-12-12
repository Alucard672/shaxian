package com.shaxian.repository;

import com.shaxian.entity.AccountReceivable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountReceivableRepository extends JpaRepository<AccountReceivable, Long> {
    @Query("SELECT ar FROM AccountReceivable ar WHERE " +
           "(:customerId IS NULL OR ar.customerId = :customerId) AND " +
           "(:status IS NULL OR CAST(ar.status AS string) = :status) " +
           "ORDER BY ar.accountDate DESC")
    List<AccountReceivable> findByFilters(@Param("customerId") Long customerId, @Param("status") String status);
}

