package com.shaxian.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Random;

public class OrderNumberGenerator {
    private static final Random random = new Random();

    public static String generatePurchaseOrderNumber() {
        return generateOrderNumber("CG");
    }

    public static String generateSalesOrderNumber() {
        return generateOrderNumber("XS");
    }

    public static String generateAdjustmentOrderNumber() {
        return generateOrderNumber("TZ");
    }

    public static String generateDyeingOrderNumber() {
        return generateOrderNumber("RS");
    }

    public static String generateInventoryCheckOrderNumber() {
        return generateOrderNumber("PD");
    }

    private static String generateOrderNumber(String prefix) {
        LocalDate date = LocalDate.now();
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String sequence = String.format("%03d", random.nextInt(1000));
        return prefix + dateStr + sequence;
    }
}

