package com.shaxian.repository;

import com.shaxian.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountPayableRepository extends JpaRepository<AccountPayable, String> {
    @Query("SELECT ap FROM AccountPayable ap WHERE " +
           "(:supplierId IS NULL OR ap.supplierId = :supplierId) AND " +
           "(:status IS NULL OR CAST(ap.status AS string) = :status) " +
           "ORDER BY ap.accountDate DESC")
    List<AccountPayable> findByFilters(@Param("supplierId") String supplierId, @Param("status") String status);
}

