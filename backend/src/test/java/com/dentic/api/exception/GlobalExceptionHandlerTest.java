package com.dentic.api.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleIllegalArgument_shouldReturnBadRequestWithMessage() {
        ResponseEntity<Map<String, String>> response = handler.handleIllegalArgument(
                new IllegalArgumentException("Campo inválido")
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Campo inválido", response.getBody().get("message"));
    }

    @Test
    void handleResponseStatus_shouldPreserveStatusAndReason() {
        ResponseEntity<Map<String, String>> response = handler.handleResponseStatus(
                new ResponseStatusException(HttpStatus.CONFLICT, "Registro em uso")
        );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Registro em uso", response.getBody().get("message"));
    }

    @Test
    void handleGenericException_shouldReturnInternalServerError() {
        ResponseEntity<Map<String, String>> response = handler.handleGenericException(
                new RuntimeException("falha inesperada")
        );

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Ocorreu um erro interno no servidor.", response.getBody().get("message"));
    }
}
