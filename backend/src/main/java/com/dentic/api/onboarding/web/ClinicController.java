package com.dentic.api.onboarding.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.dentic.api.security.SecurityUtils;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    @PatchMapping("/me")
    public ResponseEntity<String> updateMyClinic() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok("Clinic details updated");
    }
}
