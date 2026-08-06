package com.dentic.api.booking.web;

import com.dentic.api.booking.service.PublicBookingService;
import com.dentic.api.booking.service.PublicBookingService.AvailabilityResponse;
import com.dentic.api.booking.service.PublicBookingService.BookingPageResponse;
import com.dentic.api.booking.service.PublicBookingService.PublicBookRequest;
import com.dentic.api.booking.service.PublicBookingService.PublicBookingConfirmation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/booking")
public class PublicBookingController {

    private final PublicBookingService booking;

    public PublicBookingController(PublicBookingService booking) {
        this.booking = booking;
    }

    @GetMapping("/{slug}")
    public BookingPageResponse page(@PathVariable String slug) {
        return booking.getBookingPage(slug);
    }

    @GetMapping("/{slug}/availability")
    public AvailabilityResponse availability(
            @PathVariable String slug,
            @RequestParam UUID professionalId,
            @RequestParam String date
    ) {
        return booking.getAvailability(slug, professionalId, LocalDate.parse(date));
    }

    @PostMapping("/{slug}/appointments")
    public ResponseEntity<PublicBookingConfirmation> book(
            @PathVariable String slug,
            @RequestBody PublicBookRequest request
    ) {
        return ResponseEntity.ok(booking.book(slug, request));
    }
}
