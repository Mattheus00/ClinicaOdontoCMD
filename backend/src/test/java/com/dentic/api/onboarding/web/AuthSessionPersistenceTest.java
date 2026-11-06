package com.dentic.api.onboarding.web;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.security.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthSessionPersistenceTest {
    @Autowired AuthController auth;
    @Autowired ClinicRepository clinics;
    @Autowired UserRepository users;
    @Autowired RefreshTokenRepository tokens;
    @Autowired PasswordEncoder passwords;

    @Test void loginMustPersistRefreshTokenAfterTransactionCommits() {
        String email = "investigation-" + UUID.randomUUID() + "@example.invalid";
        Clinic clinic = new Clinic();
        clinic.setName("Investigation fixture"); clinic.setPhone("00000000000"); clinic.setEmail(email);
        clinic = clinics.saveAndFlush(clinic);
        User user = new User(); user.setClinic(clinic); user.setName("Investigation"); user.setEmail(email);
        user.setPasswordHash(passwords.encode("temporary-fixture-password")); user.setRole("ADMIN");
        users.saveAndFlush(user);
        long before = tokens.count();
        MockHttpServletResponse response = new MockHttpServletResponse();
        var result = auth.login(new AuthController.LoginRequest(email,"temporary-fixture-password",true),response);
        assertEquals(200,result.getStatusCode().value());
        assertNotNull(response.getHeader("Set-Cookie"));
        assertEquals(before+1,tokens.count(),"Login must commit the token represented by its refresh cookie");
    }
}
