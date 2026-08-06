package com.dentic.api.common;

public final class PhoneNormalizer {

    private PhoneNormalizer() {}

    public static String normalize(String phone) {
        if (phone == null) {
            return "";
        }
        return phone.replaceAll("\\D+", "");
    }
}
