package com.dentic.api.billing.service;

import com.dentic.api.billing.abacate.AbacatePayClient;
import com.dentic.api.billing.abacate.AbacatePayProperties;
import com.dentic.api.billing.domain.Plan;
import com.dentic.api.billing.domain.Subscription;
import com.dentic.api.billing.repository.PlanRepository;
import com.dentic.api.billing.repository.SubscriptionRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.security.SecurityUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BillingService {
    private final PlanRepository plans;
    private final SubscriptionRepository subscriptions;
    private final ClinicRepository clinics;
    private final UserRepository users;
    private final AbacatePayClient abacate;
    private final AbacatePayProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BillingService(
            PlanRepository plans,
            SubscriptionRepository subscriptions,
            ClinicRepository clinics,
            UserRepository users,
            AbacatePayClient abacate,
            AbacatePayProperties properties
    ) {
        this.plans = plans;
        this.subscriptions = subscriptions;
        this.clinics = clinics;
        this.users = users;
        this.abacate = abacate;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPlans() {
        return plans.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(this::toPlanCard)
                .toList();
    }

    @Transactional
    public Map<String, Object> currentSubscription() {
        Clinic clinic = requireClinic();
        Subscription current = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId()).orElse(null);
        syncSubscriptionFromGateway(clinic, current);
        current = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId()).orElse(null);
        clinic = clinics.findById(clinic.getId()).orElse(clinic);

        boolean cancelled = current != null
                && ("CANCELLED".equalsIgnoreCase(current.getStatus())
                || "CANCELED".equalsIgnoreCase(current.getStatus()));
        // Assinatura cancelada não deve continuar vinculada ao plano pago.
        if (cancelled && clinic.getPlan() != null) {
            clinic.setPlan(null);
            if (clinic.getTrialEndsAt() != null && clinic.getTrialEndsAt().isAfter(OffsetDateTime.now())) {
                clinic.setStatus("active");
            }
            clinics.save(clinic);
        }

        Plan plan = cancelled ? null : clinic.getPlan();
        if (plan == null && !cancelled && current != null) {
            plan = current.getPlan();
        }

        String status = resolveStatus(clinic, current);
        boolean hasGatewaySub = !cancelled
                && current != null
                && current.getGatewaySubscriptionId() != null
                && current.getGatewaySubscriptionId().startsWith("subs_");
        boolean hasPaidCheckout = !cancelled && hasPaidCheckoutForClinic(clinic, current);
        // Durante o trial, plano pago + checkout/fatura PAID ainda deve permitir cancelar.
        if (hasPaidCheckout && !"SUSPENDED".equals(status) && !cancelled) {
            status = "ACTIVE";
        }
        boolean canCancel = !cancelled && (
                "ACTIVE".equals(status)
                        || hasGatewaySub
                        || hasPaidCheckout
                        || (current != null && current.getGatewayCheckoutId() != null)
        );
        List<String> features = plan != null ? parseFeatures(plan.getFeaturesJson()) : List.of(
                "Agenda e pacientes",
                "Profissionais",
                "Atendimento organizado"
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("planName", plan != null ? plan.getName() : (cancelled ? "Sem plano" : "Período de teste"));
        payload.put("planSlug", plan != null ? plan.getSlug() : null);
        payload.put("status", status);
        payload.put("canCancel", canCancel);
        payload.put("price", plan != null ? plan.getPriceCents() / 100.0 : 0);
        payload.put("priceCents", plan != null ? plan.getPriceCents() : 0);
        payload.put("listPriceCents", plan != null ? plan.getListPriceCents() : null);
        payload.put("currency", "BRL");
        payload.put("features", features);
        payload.put("trialEndsAt", clinic.getTrialEndsAt());
        payload.put("nextBillingAt", current != null ? current.getCurrentPeriodEnd() : null);
        payload.put("gatewaySubscriptionId", current != null ? current.getGatewaySubscriptionId() : null);
        payload.put("maxProfessionals", plan != null ? plan.getMaxProfessionals() : null);
        return payload;
    }

    private void syncSubscriptionFromGateway(Clinic clinic, Subscription subscription) {
        if (!properties.isConfigured()) {
            return;
        }
        if (subscription != null
                && "ACTIVE".equalsIgnoreCase(subscription.getStatus())
                && subscription.getGatewaySubscriptionId() != null
                && subscription.getGatewaySubscriptionId().startsWith("subs_")) {
            return;
        }
        if (subscription != null
                && ("CANCELLED".equalsIgnoreCase(subscription.getStatus())
                || "CANCELED".equalsIgnoreCase(subscription.getStatus()))) {
            return;
        }

        try {
            if (subscription != null && subscription.getGatewayCheckoutId() != null) {
                for (JsonNode item : listGatewaySubscriptions(subscription.getGatewayCheckoutId())) {
                    if (activateLocalFromGateway(clinic, subscription, item)) {
                        return;
                    }
                }
            }

            String customerId = subscription != null ? subscription.getGatewayCustomerId() : null;
            JsonNode checkouts = abacate.listSubscriptionCheckouts(customerId, 50);
            for (JsonNode checkout : asArray(checkouts)) {
                if (!belongsToClinic(
                        checkout,
                        clinic.getId().toString(),
                        customerId,
                        subscription != null ? subscription.getGatewayCheckoutId() : null
                )) {
                    continue;
                }
                if (!"PAID".equalsIgnoreCase(text(checkout, "status"))
                        && !"REDEEMED".equalsIgnoreCase(text(checkout, "status"))) {
                    continue;
                }
                String billId = text(checkout, "id");
                if (billId == null) {
                    continue;
                }

                Subscription target = subscription;
                if (target == null) {
                    target = new Subscription();
                    target.setClinic(clinic);
                    if (clinic.getPlan() != null) {
                        target.setPlan(clinic.getPlan());
                    }
                }

                String embeddedSubId = firstNonBlank(
                        text(checkout, "subscriptionId"),
                        text(checkout.path("subscription"), "id")
                );
                if (embeddedSubId != null && embeddedSubId.startsWith("subs_")) {
                    target.setGatewayCheckoutId(billId);
                    target.setGatewayCustomerId(firstNonBlank(text(checkout, "customerId"), target.getGatewayCustomerId()));
                    target.setGatewaySubscriptionId(embeddedSubId);
                    target.setStatus("ACTIVE");
                    clinic.setStatus("active");
                    clinics.save(clinic);
                    subscriptions.save(target);
                    return;
                }

                for (JsonNode item : listGatewaySubscriptions(billId)) {
                    if (activateLocalFromGateway(clinic, target, item)) {
                        if (target.getGatewayCheckoutId() == null) {
                            target.setGatewayCheckoutId(billId);
                            subscriptions.save(target);
                        }
                        return;
                    }
                }

                // Checkout pago sem subs_ listável: marca ACTIVE local para liberar cancelamento/UI.
                target.setGatewayCheckoutId(billId);
                target.setGatewayCustomerId(firstNonBlank(text(checkout, "customerId"), target.getGatewayCustomerId()));
                if (target.getStatus() == null
                        || "PENDING".equalsIgnoreCase(target.getStatus())
                        || "TRIAL".equalsIgnoreCase(target.getStatus())) {
                    target.setStatus("ACTIVE");
                }
                clinic.setStatus("active");
                clinics.save(clinic);
                subscriptions.save(target);
                return;
            }
        } catch (Exception ignored) {
            // keep local status if Abacate is unavailable
        }
    }

    private Iterable<JsonNode> listGatewaySubscriptions(String checkoutId) {
        List<JsonNode> items = new ArrayList<>();
        try {
            for (JsonNode item : asArray(abacate.listSubscriptions(checkoutId, "ACTIVE", 20))) {
                items.add(item);
            }
        } catch (Exception ignored) {
            // try without status filter below
        }
        if (!items.isEmpty()) {
            return items;
        }
        try {
            for (JsonNode item : asArray(abacate.listSubscriptions(checkoutId, null, 20))) {
                items.add(item);
            }
        } catch (Exception ignored) {
            // empty
        }
        return items;
    }

    private boolean hasPaidCheckoutForClinic(Clinic clinic, Subscription subscription) {
        if (!properties.isConfigured() || clinic == null) {
            return false;
        }
        try {
            String customerId = subscription != null ? subscription.getGatewayCustomerId() : null;
            String checkoutId = subscription != null ? subscription.getGatewayCheckoutId() : null;
            JsonNode checkouts = abacate.listSubscriptionCheckouts(customerId, 50);
            for (JsonNode checkout : asArray(checkouts)) {
                if (!belongsToClinic(checkout, clinic.getId().toString(), customerId, checkoutId)) {
                    continue;
                }
                String status = text(checkout, "status");
                if ("PAID".equalsIgnoreCase(status) || "REDEEMED".equalsIgnoreCase(status)) {
                    return true;
                }
            }
        } catch (Exception ignored) {
            return false;
        }
        return false;
    }

    private boolean activateLocalFromGateway(Clinic clinic, Subscription subscription, JsonNode item) {
        String id = text(item, "id");
        if (id == null || !id.startsWith("subs_")) {
            return false;
        }
        if (!"ACTIVE".equalsIgnoreCase(text(item, "status")) && text(item, "status") != null) {
            // list already filtered by ACTIVE, but keep safe
        }
        subscription.setClinic(clinic);
        subscription.setGatewaySubscriptionId(id);
        subscription.setGatewayCheckoutId(firstNonBlank(text(item, "checkoutId"), subscription.getGatewayCheckoutId()));
        subscription.setGatewayCustomerId(firstNonBlank(text(item, "customerId"), subscription.getGatewayCustomerId()));
        subscription.setStatus("ACTIVE");
        if (subscription.getPlan() == null && clinic.getPlan() != null) {
            subscription.setPlan(clinic.getPlan());
        }
        clinic.setStatus("active");
        clinics.save(clinic);
        subscriptions.save(subscription);
        return true;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listInvoices() {
        Clinic clinic = requireClinic();
        Optional<Subscription> current = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId());
        String customerId = current.map(Subscription::getGatewayCustomerId).orElse(null);
        String clinicId = clinic.getId().toString();
        String checkoutId = current.map(Subscription::getGatewayCheckoutId).orElse(null);

        if (!properties.isConfigured()) {
            return List.of();
        }

        try {
            JsonNode listed = abacate.listSubscriptionCheckouts(customerId, 50);
            List<Map<String, Object>> invoices = new ArrayList<>();
            for (JsonNode item : asArray(listed)) {
                if (!belongsToClinic(item, clinicId, customerId, checkoutId)) {
                    continue;
                }
                invoices.add(toInvoice(item));
            }
            invoices.sort(Comparator.comparing((Map<String, Object> row) -> String.valueOf(row.get("issuedAt")), Comparator.nullsLast(String::compareTo)).reversed());
            return invoices;
        } catch (Exception ex) {
            return List.of();
        }
    }

    @Transactional
    public Map<String, Object> subscribe(String planSlug, String couponCode) {
        SecurityUtils.requireAdmin();
        if (planSlug == null || planSlug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o plano.");
        }
        Plan plan = plans.findBySlug(planSlug.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado."));
        if (!Boolean.TRUE.equals(plan.getCheckoutEnabled())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este plano ainda não está disponível para assinatura.");
        }

        Clinic clinic = requireClinic();
        User user = users.findById(SecurityUtils.currentUserId().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.")))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));

        String productId = ensureGatewayProduct(plan);
        String customerId = ensureGatewayCustomer(clinic, user);

        String completionUrl = firstNonBlank(properties.getCompletionUrl(), properties.getReturnUrl(), frontendBillingUrl());
        String returnUrl = firstNonBlank(properties.getReturnUrl(), completionUrl);

        // Mantém o código exatamente como no painel da Abacate (case-sensitive).
        String normalizedCoupon = couponCode == null ? null : couponCode.trim();
        List<String> coupons = normalizedCoupon == null || normalizedCoupon.isBlank()
                ? List.of()
                : List.of(normalizedCoupon);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("clinicId", clinic.getId().toString());
        metadata.put("planSlug", plan.getSlug());
        metadata.put("userId", user.getId().toString());
        if (!coupons.isEmpty()) {
            metadata.put("coupon", coupons.getFirst());
        }

        // externalId único por tentativa — reutilizar o mesmo devolve checkout antigo (pago/expirado).
        String externalId = "clinic-" + clinic.getId() + "-" + plan.getSlug() + "-" + UUID.randomUUID();

        JsonNode checkout;
        try {
            checkout = abacate.createSubscriptionCheckout(
                    productId,
                    customerId,
                    externalId,
                    completionUrl,
                    returnUrl,
                    metadata,
                    coupons
            );
        } catch (ResponseStatusException ex) {
            throw translateSubscribeError(ex, normalizedCoupon);
        } catch (Exception ex) {
            throw translateSubscribeError(
                    new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage()),
                    normalizedCoupon
            );
        }

        String checkoutUrl = firstNonBlank(text(checkout, "url"), text(checkout, "checkoutUrl"));
        String checkoutId = text(checkout, "id");
        if (checkoutUrl == null || checkoutUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Abacate Pay não retornou URL de checkout.");
        }

        Subscription subscription = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId())
                .orElseGet(Subscription::new);
        subscription.setClinic(clinic);
        subscription.setPlan(plan);
        subscription.setStatus("PENDING");
        subscription.setGatewayCustomerId(customerId);
        subscription.setGatewayCheckoutId(checkoutId);
        subscription.setGatewaySubscriptionId(null);
        subscription.setCurrentPeriodEnd(null);
        subscriptions.save(subscription);

        return Map.of("checkoutUrl", checkoutUrl, "checkoutId", checkoutId == null ? "" : checkoutId);
    }

    @Transactional
    public Map<String, Object> cancel() {
        SecurityUtils.requireAdmin();
        Clinic clinic = requireClinic();
        Subscription subscription = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assinatura não encontrada."));

        if ("CANCELLED".equalsIgnoreCase(subscription.getStatus())
                || "CANCELED".equalsIgnoreCase(subscription.getStatus())) {
            applyLocalCancellation(clinic, subscription, subscription.getGatewaySubscriptionId());
            return Map.of("status", "CANCELLED");
        }

        String subscriptionId = resolveGatewaySubscriptionId(subscription);
        if (subscriptionId != null && !subscriptionId.isBlank()) {
            try {
                abacate.cancelSubscription(subscriptionId);
            } catch (Exception ex) {
                // Já cancelada/inexistente na Abacate: sincroniza o estado local e segue.
                if (!isAlreadyInactiveOnGateway(ex)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "Falha ao cancelar na Abacate Pay: " + ex.getMessage()
                    );
                }
            }
        }

        applyLocalCancellation(clinic, subscription, subscriptionId);
        return Map.of("status", "CANCELLED");
    }

    private void applyLocalCancellation(Clinic clinic, Subscription subscription, String gatewaySubscriptionId) {
        if (gatewaySubscriptionId != null && gatewaySubscriptionId.startsWith("subs_")) {
            subscription.setGatewaySubscriptionId(gatewaySubscriptionId);
        }
        subscription.setStatus("CANCELLED");
        subscriptions.save(subscription);
        clinic.setPlan(null);
        if (clinic.getTrialEndsAt() != null && clinic.getTrialEndsAt().isAfter(OffsetDateTime.now())) {
            clinic.setStatus("active");
        } else {
            clinic.setStatus("suspended");
        }
        clinics.save(clinic);
    }

    private static boolean isAlreadyInactiveOnGateway(Throwable ex) {
        String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause.getMessage() != null) {
                message = message + " " + cause.getMessage().toLowerCase();
            }
            cause = cause.getCause();
        }
        return message.contains("doesn't exists")
                || message.contains("does not exist")
                || message.contains("not active")
                || message.contains("already cancelled")
                || message.contains("already canceled")
                || message.contains("subscription doesn't exist");
    }

    private static ResponseStatusException translateSubscribeError(ResponseStatusException ex, String coupon) {
        String message = ex.getReason() == null ? String.valueOf(ex.getMessage()) : ex.getReason();
        String lower = message == null ? "" : message.toLowerCase();
        if (lower.contains("could not find coupon")
                || (lower.contains("coupon") && (lower.contains("not found") || lower.contains("doesn't exist") || lower.contains("does not exist")))) {
            String code = coupon == null || coupon.isBlank() ? "informado" : coupon;
            return new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cupom " + code + " indisponível na Abacate. Se o painel mostra que já foi usado, o limite de resgates "
                            + "(maxRedeems) provavelmente esgotou — aumente para -1 (ilimitado) ou crie outro cupom."
            );
        }
        if (lower.contains("redeem") || lower.contains("esgot") || lower.contains("max redeem")) {
            String code = coupon == null || coupon.isBlank() ? "informado" : coupon;
            return new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cupom " + code + " atingiu o limite de usos. Ajuste maxRedeems no painel da Abacate ou use outro código."
            );
        }
        return ex;
    }

    private String resolveGatewaySubscriptionId(Subscription subscription) {
        String current = subscription.getGatewaySubscriptionId();
        if (current != null && current.startsWith("subs_")) {
            return current;
        }

        if (!properties.isConfigured()) {
            return current;
        }

        try {
            if (subscription.getGatewayCheckoutId() != null) {
                for (JsonNode item : listGatewaySubscriptions(subscription.getGatewayCheckoutId())) {
                    String id = text(item, "id");
                    if (id != null && id.startsWith("subs_")) {
                        return id;
                    }
                }
            }

            JsonNode checkouts = abacate.listSubscriptionCheckouts(subscription.getGatewayCustomerId(), 50);
            for (JsonNode checkout : asArray(checkouts)) {
                if (!"PAID".equalsIgnoreCase(text(checkout, "status"))
                        && !"REDEEMED".equalsIgnoreCase(text(checkout, "status"))) {
                    continue;
                }
                String embedded = firstNonBlank(
                        text(checkout, "subscriptionId"),
                        text(checkout.path("subscription"), "id")
                );
                if (embedded != null && embedded.startsWith("subs_")) {
                    return embedded;
                }
                String billId = text(checkout, "id");
                if (billId == null) {
                    continue;
                }
                for (JsonNode item : listGatewaySubscriptions(billId)) {
                    String id = text(item, "id");
                    if (id != null && id.startsWith("subs_")) {
                        return id;
                    }
                }
            }
        } catch (Exception ignored) {
            // fall through
        }
        return current != null && current.startsWith("subs_") ? current : null;
    }

    @Transactional
    public void handleAbacateWebhook(String webhookSecret, JsonNode payload) {
        String expected = properties.getWebhookSecret();
        if (expected == null || expected.isBlank() || webhookSecret == null || !expected.equals(webhookSecret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook secret inválido.");
        }

        String event = firstNonBlank(
                text(payload, "event"),
                text(payload, "type"),
                text(payload.path("data"), "event")
        );
        JsonNode data = payload.has("data") ? payload.get("data") : payload;
        if (event == null || event.isBlank()) {
            event = text(data, "event");
        }
        if (event == null) {
            return;
        }

        switch (event) {
            case "subscription.completed", "subscription.trial_started", "subscription.renewed", "subscription.plan_changed" ->
                    activateFromWebhook(data, event);
            case "subscription.payment_failed" -> markPastDue(data);
            case "subscription.cancelled" -> markCancelled(data);
            default -> {
                // ignore unrelated events
            }
        }
    }

    private void activateFromWebhook(JsonNode data, String event) {
        JsonNode subscriptionNode = data.has("subscription") ? data.get("subscription") : data;
        Clinic clinic = resolveClinic(data);
        if (clinic == null) {
            clinic = resolveClinic(subscriptionNode);
        }
        Plan plan = resolvePlan(data, clinic);
        if (plan == null) {
            plan = resolvePlan(subscriptionNode, clinic);
        }
        if (clinic == null) {
            return;
        }

        Subscription subscription = findOrCreateSubscription(clinic, subscriptionNode);
        subscription.setClinic(clinic);
        if (plan != null) {
            subscription.setPlan(plan);
            clinic.setPlan(plan);
        }
        String gatewaySubscriptionId = firstNonBlank(
                text(subscriptionNode, "id"),
                text(data, "subscriptionId"),
                text(data, "id"),
                subscription.getGatewaySubscriptionId()
        );
        if (gatewaySubscriptionId != null && gatewaySubscriptionId.startsWith("bill_")) {
            gatewaySubscriptionId = firstNonBlank(
                    text(subscriptionNode, "subscriptionId"),
                    text(data.path("subscription"), "id"),
                    subscription.getGatewaySubscriptionId()
            );
        }
        subscription.setGatewaySubscriptionId(gatewaySubscriptionId);
        subscription.setGatewayCheckoutId(firstNonBlank(
                text(subscriptionNode, "checkoutId"),
                text(data, "checkoutId"),
                text(data, "billId"),
                text(data, "id") != null && text(data, "id").startsWith("bill_") ? text(data, "id") : null,
                subscription.getGatewayCheckoutId()
        ));
        subscription.setGatewayCustomerId(firstNonBlank(
                text(subscriptionNode, "customerId"),
                text(data, "customerId"),
                subscription.getGatewayCustomerId()
        ));
        subscription.setStatus("ACTIVE");
        subscription.setCurrentPeriodEnd(parseDate(firstNonBlank(
                text(subscriptionNode, "nextBillingAt"),
                text(subscriptionNode, "currentPeriodEnd"),
                text(data, "nextBillingAt"),
                text(data, "currentPeriodEnd")
        )));
        clinic.setStatus("active");
        clinics.save(clinic);
        subscriptions.save(subscription);
    }

    private void markPastDue(JsonNode data) {
        Subscription subscription = resolveSubscription(data);
        if (subscription == null) {
            return;
        }
        subscription.setStatus("PAST_DUE");
        subscriptions.save(subscription);
        Clinic clinic = subscription.getClinic();
        clinic.setStatus("suspended");
        clinics.save(clinic);
    }

    private void markCancelled(JsonNode data) {
        JsonNode subscriptionNode = data.has("subscription") ? data.get("subscription") : data;
        Subscription subscription = resolveSubscription(subscriptionNode);
        if (subscription == null) {
            subscription = resolveSubscription(data);
        }
        if (subscription == null) {
            return;
        }
        String gatewayId = text(subscriptionNode, "id");
        if (gatewayId != null && gatewayId.startsWith("subs_")) {
            subscription.setGatewaySubscriptionId(gatewayId);
        }
        Clinic clinic = subscription.getClinic();
        applyLocalCancellation(clinic, subscription, gatewayId);
    }

    private Subscription findOrCreateSubscription(Clinic clinic, JsonNode data) {
        String gatewayId = firstNonBlank(text(data, "id"), text(data, "subscriptionId"));
        if (gatewayId != null) {
            Optional<Subscription> byGateway = subscriptions.findByGatewaySubscriptionId(gatewayId);
            if (byGateway.isPresent()) {
                return byGateway.get();
            }
        }
        String checkoutId = firstNonBlank(text(data, "checkoutId"), text(data, "billId"));
        if (checkoutId != null) {
            Optional<Subscription> byCheckout = subscriptions.findByGatewayCheckoutId(checkoutId);
            if (byCheckout.isPresent()) {
                return byCheckout.get();
            }
        }
        return subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId())
                .orElseGet(Subscription::new);
    }

    private Subscription resolveSubscription(JsonNode data) {
        String gatewayId = firstNonBlank(text(data, "id"), text(data, "subscriptionId"));
        if (gatewayId != null) {
            Optional<Subscription> byGateway = subscriptions.findByGatewaySubscriptionId(gatewayId);
            if (byGateway.isPresent()) {
                return byGateway.get();
            }
        }
        Clinic clinic = resolveClinic(data);
        if (clinic == null) {
            return null;
        }
        return subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId()).orElse(null);
    }

    private Clinic resolveClinic(JsonNode data) {
        JsonNode metadata = data.path("metadata");
        String clinicId = firstNonBlank(
                text(metadata, "clinicId"),
                text(data, "clinicId"),
                text(data, "externalId")
        );
        if (clinicId != null && clinicId.startsWith("clinic-")) {
            String[] parts = clinicId.split("-");
            if (parts.length >= 6) {
                clinicId = String.join("-", parts[1], parts[2], parts[3], parts[4], parts[5]);
            }
        }
        if (clinicId != null) {
            try {
                return clinics.findById(UUID.fromString(clinicId)).orElse(null);
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        return null;
    }

    private Plan resolvePlan(JsonNode data, Clinic clinic) {
        JsonNode metadata = data.path("metadata");
        String slug = firstNonBlank(text(metadata, "planSlug"), text(data, "planSlug"));
        if (slug != null) {
            return plans.findBySlug(slug).orElse(null);
        }
        if (clinic != null && clinic.getPlan() != null) {
            return clinic.getPlan();
        }
        return null;
    }

    private String ensureGatewayProduct(Plan plan) {
        if (plan.getGatewayProductId() != null && !plan.getGatewayProductId().isBlank()) {
            return plan.getGatewayProductId();
        }
        String externalId = "velora-" + plan.getSlug();
        try {
            JsonNode listed = abacate.listProducts();
            JsonNode found = findProductByExternalId(listed, externalId);
            if (found != null) {
                String id = text(found, "id");
                plan.setGatewayProductId(id);
                plans.save(plan);
                return id;
            }
        } catch (Exception ignored) {
            // create below
        }
        JsonNode created = abacate.createProduct(
                externalId,
                "Velora " + plan.getName(),
                plan.getDescription(),
                plan.getPriceCents()
        );
        String id = text(created, "id");
        if (id == null || id.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível criar o produto na Abacate Pay.");
        }
        plan.setGatewayProductId(id);
        plans.save(plan);
        return id;
    }

    private String ensureGatewayCustomer(Clinic clinic, User user) {
        Subscription existing = subscriptions.findFirstByClinic_IdOrderByCreatedAtDesc(clinic.getId()).orElse(null);
        if (existing != null && existing.getGatewayCustomerId() != null && !existing.getGatewayCustomerId().isBlank()) {
            return existing.getGatewayCustomerId();
        }
        JsonNode customer = abacate.createCustomer(
                firstNonBlank(user.getEmail(), clinic.getEmail()),
                firstNonBlank(user.getName(), clinic.getName()),
                clinic.getPhone()
        );
        return text(customer, "id");
    }

    private JsonNode findProductByExternalId(JsonNode listed, String externalId) {
        if (listed == null) {
            return null;
        }
        if (listed.isArray()) {
            for (JsonNode item : listed) {
                if (externalId.equals(text(item, "externalId"))) {
                    return item;
                }
            }
            return null;
        }
        JsonNode data = listed.path("data");
        if (data.isArray()) {
            for (JsonNode item : data) {
                if (externalId.equals(text(item, "externalId"))) {
                    return item;
                }
            }
        }
        return null;
    }

    private Map<String, Object> toInvoice(JsonNode item) {
        String gatewayStatus = text(item, "status");
        String status = switch (gatewayStatus == null ? "" : gatewayStatus.toUpperCase()) {
            case "PAID", "REDEEMED" -> "PAID";
            case "PENDING" -> "PENDING";
            default -> "FAILED";
        };
        Number amountCents = item.path("paidAmount").isNumber()
                ? item.path("paidAmount").numberValue()
                : item.path("amount").isNumber() ? item.path("amount").numberValue() : 0;
        double amount = amountCents == null ? 0 : amountCents.doubleValue() / 100.0;

        Map<String, Object> invoice = new LinkedHashMap<>();
        invoice.put("id", text(item, "id"));
        invoice.put("issuedAt", firstNonBlank(text(item, "updatedAt"), text(item, "createdAt"), OffsetDateTime.now().toString()));
        invoice.put("amount", amount);
        invoice.put("status", status);
        String receipt = text(item, "receiptUrl");
        String url = text(item, "url");
        invoice.put("invoiceUrl", firstNonBlank(receipt, url));
        return invoice;
    }

    private boolean belongsToClinic(JsonNode item, String clinicId, String customerId, String checkoutId) {
        String itemId = text(item, "id");
        if (checkoutId != null && checkoutId.equals(itemId)) {
            return true;
        }
        String itemCustomer = text(item, "customerId");
        if (customerId != null && customerId.equals(itemCustomer)) {
            return true;
        }
        JsonNode metadata = item.path("metadata");
        String metaClinic = text(metadata, "clinicId");
        if (clinicId.equals(metaClinic)) {
            return true;
        }
        String externalId = text(item, "externalId");
        return externalId != null && externalId.contains(clinicId);
    }

    private static Iterable<JsonNode> asArray(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return List.of();
        }
        if (node.isArray()) {
            return node;
        }
        JsonNode nested = node.path("data");
        if (nested.isArray()) {
            return nested;
        }
        return List.of(node);
    }

    private Map<String, Object> toPlanCard(Plan plan) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", plan.getId());
        card.put("slug", plan.getSlug());
        card.put("name", plan.getName());
        card.put("description", plan.getDescription());
        card.put("priceCents", plan.getPriceCents());
        card.put("listPriceCents", plan.getListPriceCents());
        card.put("currency", "BRL");
        card.put("maxProfessionals", plan.getMaxProfessionals());
        card.put("maxTeamUsers", plan.getMaxTeamUsers());
        card.put("includesWhatsapp", plan.getIncludesWhatsapp());
        card.put("features", parseFeatures(plan.getFeaturesJson()));
        card.put("highlighted", Boolean.TRUE.equals(plan.getHighlighted()));
        card.put("checkoutEnabled", Boolean.TRUE.equals(plan.getCheckoutEnabled()));
        card.put("comingSoon", !Boolean.TRUE.equals(plan.getCheckoutEnabled()));
        return card;
    }

    private List<String> parseFeatures(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String resolveStatus(Clinic clinic, Subscription subscription) {
        boolean cancelled = subscription != null
                && ("CANCELLED".equalsIgnoreCase(subscription.getStatus())
                || "CANCELED".equalsIgnoreCase(subscription.getStatus()));

        if (cancelled) {
            if (clinic.getTrialEndsAt() != null && clinic.getTrialEndsAt().isAfter(OffsetDateTime.now())) {
                return "TRIAL";
            }
            return "SUSPENDED";
        }

        if (clinic != null && "suspended".equalsIgnoreCase(clinic.getStatus())) {
            return "SUSPENDED";
        }
        if (subscription != null) {
            String status = subscription.getStatus();
            if ("ACTIVE".equalsIgnoreCase(status)) {
                return "ACTIVE";
            }
            if ("PAST_DUE".equalsIgnoreCase(status)) {
                return "SUSPENDED";
            }
        }
        // Plano pago vinculado + checkout/assinatura local ainda PENDING: trata como ACTIVE
        if (clinic.getPlan() != null
                && subscription != null
                && (subscription.getGatewayCheckoutId() != null
                || subscription.getGatewayCustomerId() != null
                || (subscription.getGatewaySubscriptionId() != null
                && subscription.getGatewaySubscriptionId().startsWith("subs_")))) {
            return "ACTIVE";
        }
        if (clinic.getTrialEndsAt() != null && clinic.getTrialEndsAt().isAfter(OffsetDateTime.now())) {
            return "TRIAL";
        }
        return clinic.getPlan() != null ? "ACTIVE" : "TRIAL";
    }

    private Clinic requireClinic() {
        UUID clinicId = TenantContext.getCurrentTenant();
        if (clinicId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        return clinics.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clínica não encontrada."));
    }

    private String frontendBillingUrl() {
        String base = firstNonBlank(System.getenv("DENTIC_FRONTEND_URL"), "http://localhost:5173");
        return trimSlash(base) + "/billing";
    }

    private static OffsetDateTime parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() || "null".equals(text) ? null : text;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String trimSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public Optional<Plan> findPlanBySlug(String slug) {
        return plans.findBySlug(slug);
    }
}
