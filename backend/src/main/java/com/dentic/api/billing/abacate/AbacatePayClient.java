package com.dentic.api.billing.abacate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class AbacatePayClient {
    private final AbacatePayProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AbacatePayClient(AbacatePayProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder()
                .baseUrl(trimSlash(properties.getBaseUrl()))
                .build();
    }

    public JsonNode createProduct(String externalId, String name, String description, int priceCents) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("externalId", externalId);
        body.put("name", name);
        body.put("description", description == null ? name : description);
        body.put("price", priceCents);
        body.put("currency", "BRL");
        body.put("cycle", "MONTHLY");
        return post("/products/create", body);
    }

    public JsonNode listProducts() {
        return get("/products/list");
    }

    public JsonNode listSubscriptionCheckouts(String customerId, int limit) {
        StringBuilder path = new StringBuilder("/subscriptions/checkouts/list?limit=")
                .append(Math.max(1, Math.min(limit, 100)));
        if (customerId != null && !customerId.isBlank()) {
            path.append("&customerId=").append(customerId);
        }
        return get(path.toString());
    }

    public JsonNode listSubscriptions(String checkoutId, String status, int limit) {
        StringBuilder path = new StringBuilder("/subscriptions/list?limit=")
                .append(Math.max(1, Math.min(limit, 100)));
        if (checkoutId != null && !checkoutId.isBlank()) {
            path.append("&checkoutId=").append(checkoutId);
        }
        if (status != null && !status.isBlank()) {
            path.append("&status=").append(status);
        }
        return get(path.toString());
    }

    public JsonNode createCustomer(String email, String name, String cellphone) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        if (name != null && !name.isBlank()) {
            body.put("name", name);
        }
        if (cellphone != null && !cellphone.isBlank()) {
            body.put("cellphone", cellphone);
        }
        return post("/customers/create", body);
    }

    public JsonNode createSubscriptionCheckout(
            String productId,
            String customerId,
            String externalId,
            String completionUrl,
            String returnUrl,
            Map<String, Object> metadata,
            List<String> coupons
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", List.of(Map.of("id", productId, "quantity", 1)));
        boolean hasCoupon = coupons != null && !coupons.isEmpty();
        // Cupom em assinatura só vale com CARD (sem PIX). Sem cupom, oferece cartão + Pix.
        body.put("methods", hasCoupon ? List.of("CARD") : List.of("CARD", "PIX"));
        if (hasCoupon) {
            body.put("coupons", coupons);
        }
        if (customerId != null && !customerId.isBlank()) {
            body.put("customerId", customerId);
        }
        if (externalId != null && !externalId.isBlank()) {
            body.put("externalId", externalId);
        }
        if (completionUrl != null && !completionUrl.isBlank()) {
            body.put("completionUrl", completionUrl);
        }
        if (returnUrl != null && !returnUrl.isBlank()) {
            body.put("returnUrl", returnUrl);
        }
        if (metadata != null && !metadata.isEmpty()) {
            body.put("metadata", metadata);
        }
        return post("/subscriptions/create", body);
    }

    public JsonNode cancelSubscription(String subscriptionId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", subscriptionId);
        return post("/subscriptions/cancel", body);
    }

    private JsonNode get(String path) {
        requireConfigured();
        try {
            String raw = restClient.get()
                    .uri(path)
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .retrieve()
                    .body(String.class);
            return unwrap(raw);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(502), "Falha ao consultar Abacate Pay: " + ex.getMessage());
        }
    }

    private JsonNode post(String path, Map<String, Object> body) {
        requireConfigured();
        try {
            String raw = restClient.post()
                    .uri(path)
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return unwrap(raw);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(502), "Falha ao chamar Abacate Pay: " + ex.getMessage());
        }
    }

    private JsonNode unwrap(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw == null ? "{}" : raw);
        if (root.has("success") && root.get("success").isBoolean() && !root.get("success").asBoolean()) {
            String error = root.path("error").asText("Erro desconhecido na Abacate Pay");
            throw new ResponseStatusException(HttpStatusCode.valueOf(502), error);
        }
        return root.has("data") ? root.get("data") : root;
    }

    private void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(503), "Abacate Pay não configurado. Defina ABACATE_API_KEY.");
        }
    }

    private static String trimSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://api.abacatepay.com/v2";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
