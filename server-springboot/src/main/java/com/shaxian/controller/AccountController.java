package com.shaxian.controller;

import com.shaxian.entity.*;
import com.shaxian.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountReceivableRepository accountReceivableRepository;
    private final AccountPayableRepository accountPayableRepository;
    private final ReceiptRecordRepository receiptRecordRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    public AccountController(
            AccountReceivableRepository accountReceivableRepository,
            AccountPayableRepository accountPayableRepository,
            ReceiptRecordRepository receiptRecordRepository,
            PaymentRecordRepository paymentRecordRepository) {
        this.accountReceivableRepository = accountReceivableRepository;
        this.accountPayableRepository = accountPayableRepository;
        this.receiptRecordRepository = receiptRecordRepository;
        this.paymentRecordRepository = paymentRecordRepository;
    }


    // ========== 应收账款 ==========
    @GetMapping("/receivables")
    public ResponseEntity<List<AccountReceivable>> getReceivables(
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(accountReceivableRepository.findByFilters(customerId != null ? Long.parseLong(customerId) : null, status));
    }

    @PostMapping("/receivables")
    public ResponseEntity<AccountReceivable> createReceivable(@RequestBody Map<String, Object> request) {
        AccountReceivable receivable = new AccountReceivable();
        receivable.setCustomerId(parseLong(request.get("customerId")));
        receivable.setCustomerName((String) request.get("customerName"));
        receivable.setSalesOrderId(parseLong(request.get("salesOrderId")));
        receivable.setSalesOrderNumber((String) request.get("salesOrderNumber"));
        receivable.setReceivableAmount(new BigDecimal(request.get("receivableAmount").toString()));
        BigDecimal receivedAmount = request.containsKey("receivedAmount") ? 
                new BigDecimal(request.get("receivedAmount").toString()) : BigDecimal.ZERO;
        receivable.setReceivedAmount(receivedAmount);
        receivable.setAccountDate(LocalDate.parse((String) request.get("accountDate")));
        
        BigDecimal unpaidAmount = receivable.getReceivableAmount().subtract(receivedAmount);
        receivable.setUnpaidAmount(unpaidAmount);
        receivable.setStatus(unpaidAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                AccountReceivable.AccountStatus.未结清 : AccountReceivable.AccountStatus.已结清);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(accountReceivableRepository.save(receivable));
    }

    @GetMapping("/receivables/{id}/receipts")
    public ResponseEntity<List<ReceiptRecord>> getReceipts(@PathVariable Long id) {
        return ResponseEntity.ok(receiptRecordRepository.findByAccountReceivableIdOrderByReceiptDateDesc(id));
    }

    @PostMapping("/receivables/{id}/receipts")
    @Transactional
    public ResponseEntity<ReceiptRecord> createReceipt(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        ReceiptRecord receipt = new ReceiptRecord();
        receipt.setAccountReceivableId(id);
        receipt.setAmount(new BigDecimal(request.get("amount").toString()));
        if (request.containsKey("paymentMethod")) {
            receipt.setPaymentMethod(ReceiptRecord.PaymentMethod.valueOf((String) request.get("paymentMethod")));
        }
        receipt.setReceiptDate(LocalDate.parse((String) request.get("receiptDate")));
        receipt.setOperator((String) request.get("operator"));
        if (request.containsKey("remark")) receipt.setRemark((String) request.get("remark"));
        
        ReceiptRecord saved = receiptRecordRepository.save(receipt);
        
        AccountReceivable receivable = accountReceivableRepository.findById(id).orElseThrow();
        BigDecimal newReceivedAmount = receivable.getReceivedAmount().add(receipt.getAmount());
        receivable.setReceivedAmount(newReceivedAmount);
        BigDecimal newUnpaidAmount = receivable.getReceivableAmount().subtract(newReceivedAmount);
        receivable.setUnpaidAmount(newUnpaidAmount);
        receivable.setStatus(newUnpaidAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                AccountReceivable.AccountStatus.未结清 : AccountReceivable.AccountStatus.已结清);
        accountReceivableRepository.save(receivable);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ========== 应付账款 ==========
    @GetMapping("/payables")
    public ResponseEntity<List<AccountPayable>> getPayables(
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(accountPayableRepository.findByFilters(supplierId != null ? Long.parseLong(supplierId) : null, status));
    }

    @PostMapping("/payables")
    public ResponseEntity<AccountPayable> createPayable(@RequestBody Map<String, Object> request) {
        AccountPayable payable = new AccountPayable();
        payable.setSupplierId(parseLong(request.get("supplierId")));
        payable.setSupplierName((String) request.get("supplierName"));
        payable.setPurchaseOrderId(parseLong(request.get("purchaseOrderId")));
        payable.setPurchaseOrderNumber((String) request.get("purchaseOrderNumber"));
        payable.setPayableAmount(new BigDecimal(request.get("payableAmount").toString()));
        BigDecimal paidAmount = request.containsKey("paidAmount") ? 
                new BigDecimal(request.get("paidAmount").toString()) : BigDecimal.ZERO;
        payable.setPaidAmount(paidAmount);
        payable.setAccountDate(LocalDate.parse((String) request.get("accountDate")));
        
        BigDecimal unpaidAmount = payable.getPayableAmount().subtract(paidAmount);
        payable.setUnpaidAmount(unpaidAmount);
        payable.setStatus(unpaidAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                AccountPayable.AccountStatus.未结清 : AccountPayable.AccountStatus.已结清);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(accountPayableRepository.save(payable));
    }

    @GetMapping("/payables/{id}/payments")
    public ResponseEntity<List<PaymentRecord>> getPayments(@PathVariable Long id) {
        return ResponseEntity.ok(paymentRecordRepository.findByAccountPayableIdOrderByPaymentDateDesc(id));
    }

    @PostMapping("/payables/{id}/payments")
    @Transactional
    public ResponseEntity<PaymentRecord> createPayment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        PaymentRecord payment = new PaymentRecord();
        payment.setAccountPayableId(id);
        payment.setAmount(new BigDecimal(request.get("amount").toString()));
        if (request.containsKey("paymentMethod")) {
            payment.setPaymentMethod(PaymentRecord.PaymentMethod.valueOf((String) request.get("paymentMethod")));
        }
        payment.setPaymentDate(LocalDate.parse((String) request.get("paymentDate")));
        payment.setOperator((String) request.get("operator"));
        if (request.containsKey("remark")) payment.setRemark((String) request.get("remark"));
        
        PaymentRecord saved = paymentRecordRepository.save(payment);
        
        AccountPayable payable = accountPayableRepository.findById(id).orElseThrow();
        BigDecimal newPaidAmount = payable.getPaidAmount().add(payment.getAmount());
        payable.setPaidAmount(newPaidAmount);
        BigDecimal newUnpaidAmount = payable.getPayableAmount().subtract(newPaidAmount);
        payable.setUnpaidAmount(newUnpaidAmount);
        payable.setStatus(newUnpaidAmount.compareTo(BigDecimal.ZERO) > 0 ? 
                AccountPayable.AccountStatus.未结清 : AccountPayable.AccountStatus.已结清);
        accountPayableRepository.save(payable);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private Long parseLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}

