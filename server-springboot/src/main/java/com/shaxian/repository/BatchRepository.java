package com.shaxian.repository;

import com.shaxian.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, String> {
    List<Batch> findByColorIdOrderByCode(String colorId);
    Optional<Batch> findByCode(String code);
    boolean existsByCode(String code);
    
    @Modifying
    @Query("UPDATE Batch b SET b.stockQuantity = b.stockQuantity - :quantity WHERE b.id = :batchId")
    void decreaseStock(@Param("batchId") String batchId, @Param("quantity") BigDecimal quantity);
    
    @Modifying
    @Query("UPDATE Batch b SET b.stockQuantity = b.stockQuantity + :quantity WHERE b.id = :batchId")
    void increaseStock(@Param("batchId") String batchId, @Param("quantity") BigDecimal quantity);
}
