package com.shaxian.util;

import java.util.UUID;

public class UuidUtil {
    public static String generate() {
        return UUID.randomUUID().toString();
    }
}

