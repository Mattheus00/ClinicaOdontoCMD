package com.dentic.api.booking.service;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class BookingSlugService {

    private final ClinicRepository clinics;

    public BookingSlugService(ClinicRepository clinics) {
        this.clinics = clinics;
    }

    @Transactional
    public String ensureSlug(Clinic clinic) {
        if (clinic.getBookingSlug() != null && !clinic.getBookingSlug().isBlank()) {
            return clinic.getBookingSlug();
        }
        String slug = generateUniqueSlug(clinic.getName());
        clinic.setBookingSlug(slug);
        clinics.save(clinic);
        return slug;
    }

    @Transactional
    public String regenerateSlug(Clinic clinic) {
        String slug = generateUniqueSlug(clinic.getName());
        clinic.setBookingSlug(slug);
        clinics.save(clinic);
        return slug;
    }

    private String generateUniqueSlug(String clinicName) {
        String base = slugify(clinicName);
        if (base.isBlank()) {
            base = "clinica";
        }
        if (base.length() > 48) {
            base = base.substring(0, 48);
        }

        for (int attempt = 0; attempt < 12; attempt++) {
            String candidate = attempt == 0 ? base : base + "-" + randomSuffix();
            if (!clinics.existsByBookingSlug(candidate)) {
                return candidate;
            }
        }
        return base + "-" + Long.toHexString(System.currentTimeMillis());
    }

    private static String slugify(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized;
    }

    private static String randomSuffix() {
        int value = ThreadLocalRandom.current().nextInt(1000, 9999);
        return String.valueOf(value);
    }
}
