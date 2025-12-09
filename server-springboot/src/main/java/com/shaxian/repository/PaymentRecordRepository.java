package com.shaxian.repository;

import com.shaxian.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, String> {
    List<PaymentRecord> findByAccountPayableIdOrderByPaymentDateDesc(String accountPayableId);
}

