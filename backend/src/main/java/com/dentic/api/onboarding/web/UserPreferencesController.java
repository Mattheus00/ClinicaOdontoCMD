package com.dentic.api.onboarding.web;

import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.security.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user-preferences")
public class UserPreferencesController {
    private final UserRepository users;
    public UserPreferencesController(UserRepository users) { this.users = users; }

    private User currentUser() {
        var id = SecurityUtils.currentUserId().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return users.findById(id).filter(user -> user.getClinic().getId().equals(TenantContext.getCurrentTenant()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }
    @GetMapping
    @Transactional(readOnly = true)
    public Preferences get() { return new Preferences(currentUser().getTutorialVersion()); }

    @PutMapping
    @Transactional
    public Preferences save(@Valid @RequestBody Preferences preferences) {
        User user = currentUser();
        user.setTutorialVersion(Math.max(user.getTutorialVersion(), preferences.tutorialVersion()));
        users.save(user);
        return new Preferences(user.getTutorialVersion());
    }
    public record Preferences(@Min(0) @Max(100) int tutorialVersion) {}
}
